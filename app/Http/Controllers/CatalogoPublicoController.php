<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\SubCategoria;
use App\Support\CatalogoCache;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogoPublicoController extends Controller
{
    /**
     * El catálogo completo son ~2100 productos activos: armar el PDF con
     * todos agota la memoria (dompdf es muy pesado por nodo de CSS/DOM) y
     * antes truena con 500 sin descargar nada. Con 300 el PDF pesa ~1.4 MB,
     * usa ~130 MB de memoria y tarda ~20s -- ya probado. Si el filtro deja
     * más que esto, el PDF avisa que se truncó (ver pdf.catalogo.blade.php).
     */
    private const MAX_PRODUCTOS_PDF = 300;

    public function index(): Response
    {
        // Esta página vuelca TODO el catálogo activo (~2000 productos, ~1 MB
        // de JSON) en cada visita. Se cachea el payload ya transformado; se
        // invalida al editar productos (ver CatalogoCache::flush()).
        $datos = CatalogoCache::remember('publico', function () {
            $animales = Animal::with(['categorias.subcategorias'])
                ->orderBy('nombre')
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id_animal,
                    'nombre' => $a->nombre,
                    'categorias' => $a->categorias->map(fn ($c) => [
                        'id' => $c->id_categoria,
                        'nombre' => $c->nombre,
                        'subcategorias' => $c->subcategorias->map(fn ($s) => [
                            'id' => $s->id_subcategorias,
                            'nombre' => $s->nom_sub_categoria,
                        ])->values(),
                    ])->values(),
                ]);

            $productos = Producto::activos()
                ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
                ->latest('created_at')
                ->get()
                ->map(fn (Producto $p) => $this->formato($p));

            return ['animales' => $animales, 'productos' => $productos];
        });

        return Inertia::render('catalogo/publico', $datos);
    }

    public function pdf(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $query = Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->latest('created_at');

        if ($request->filled('subcategoria')) {
            $query->where('fk_id_subcategorias', $request->integer('subcategoria'));
        } elseif ($request->filled('categoria')) {
            $ids = Categoria::with('subcategorias')
                ->find($request->integer('categoria'))
                ?->subcategorias->pluck('id_subcategorias') ?? collect();
            $query->whereIn('fk_id_subcategorias', $ids);
        } elseif ($request->filled('animal')) {
            $animal = Animal::with('categorias.subcategorias')
                ->find($request->integer('animal'));
            $ids = $animal?->categorias->flatMap(
                fn ($c) => $c->subcategorias->pluck('id_subcategorias')
            ) ?? collect();
            $query->whereIn('fk_id_subcategorias', $ids);
        }

        if ($request->filled('q')) {
            $q = '%'.$request->string('q').'%';
            $query->where('nombre', 'like', $q);
        }

        $total = (clone $query)->count();
        $truncado = $total > self::MAX_PRODUCTOS_PDF;

        // cursor() en vez de chunk(): con el límite ya aplicado, itera fila a
        // fila sin cargar de más -- chunk() no combina bien con limit().
        $productos = [];
        foreach ($query->limit(self::MAX_PRODUCTOS_PDF)->cursor() as $p) {
            $productos[] = $this->formatoPdf($p);
        }
        gc_collect_cycles();

        $pdf = Pdf::loadView('pdf.catalogo', [
            'productos' => collect($productos),
            'titulo' => $this->tituloFiltro($request),
            'fecha' => now()->format('d/m/Y H:i'),
            'truncado' => $truncado,
            'totalReal' => $total,
        ])
            ->setOptions(['isLocalFileSystemAllowed' => true])
            ->setPaper('a4', 'portrait');

        // stream() en vez de download(): abre el PDF en el visor del
        // navegador (Content-Disposition: inline) para que el usuario lo vea
        // antes de decidir si lo descarga, en vez de forzar la descarga.
        return $pdf->stream('catalogo-mosso.pdf');
    }

    private function formato(Producto $p): array
    {
        $descuento = $p->descuentoActivo;
        $precioFinal = (float) $p->precio;
        $porcentajeOff = null;

        if ($descuento) {
            if ($descuento->tipo === 'porcentaje') {
                $precioFinal = $p->precio - ($p->precio * $descuento->valor / 100);
                $porcentajeOff = (int) round($descuento->valor);
            } else {
                $precioFinal = max(0, $p->precio - $descuento->valor);
                $porcentajeOff = (int) round((1 - $precioFinal / $p->precio) * 100);
            }
        }

        return [
            'id' => $p->id_producto,
            'nombre' => $p->nombre,
            'marca' => $p->marca?->nombre,
            'imagen' => Producto::urlImagen($p->imagen_principal),
            'precio' => (float) $p->precio,
            'precioFinal' => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'animal' => $p->subcategoria?->categoria?->animal?->nombre,
            'animal_id' => $p->subcategoria?->categoria?->animal?->id_animal,
            'categoria' => $p->subcategoria?->categoria?->nombre,
            'categoria_id' => $p->subcategoria?->categoria?->id_categoria,
            'subcategoria' => $p->subcategoria?->nom_sub_categoria,
            'subcategoria_id' => $p->fk_id_subcategorias,
            'href' => "/producto/{$p->id_producto}",
        ];
    }

    private function formatoPdf(Producto $p): array
    {
        $base = $this->formato($p);
        // imagenSrc puede ser un data URI (GD disponible) o file:/// URL (fallback sin GD)
        $base['imagenSrc'] = $this->resolverImagenPdf($p->imagen_principal);

        return $base;
    }

    /**
     * Resuelve la imagen para el PDF.
     *
     * Prioridad:
     *   1. GD disponible  → redimensiona a 120 px ancho, devuelve data URI JPEG.
     *   2. GD no disponible → devuelve file:/// URL (dompdf la carga con isLocalFileSystemAllowed).
     */
    private function resolverImagenPdf(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $full = str_starts_with($path, 'productos/')
            ? storage_path("app/public/{$path}")
            : public_path("image/Productos/{$path}");

        if (! file_exists($full)) {
            return null;
        }

        return extension_loaded('gd')
            ? $this->imagenBase64($full)
            : $this->imagenFileUrl($full);
    }

    /**
     * Redimensiona la imagen con GD y devuelve un data URI JPEG (base64).
     * Usa getimagesize() para detectar el tipo real del archivo (no confía en la extensión).
     */
    private function imagenBase64(string $full): ?string
    {
        $info = @getimagesize($full);
        if (! $info) {
            return null;
        }

        $src = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($full),
            IMAGETYPE_PNG => @imagecreatefrompng($full),
            IMAGETYPE_GIF => @imagecreatefromgif($full),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($full) : null,
            default => null,
        };

        if (! $src) {
            // GD no soporta este subtipo específico — cae al fallback file URL
            return $this->imagenFileUrl($full);
        }

        $origW = imagesx($src);
        $origH = imagesy($src);
        $newW = min($origW, 120);
        $newH = $origH > 0 ? (int) round($newW * $origH / $origW) : $newW;

        $dst = imagecreatetruecolor($newW, $newH);
        if (! $dst) {
            imagedestroy($src);

            return null;
        }

        // Fondo blanco: convierte cualquier formato (PNG con alfa, webp, etc.) a JPEG opaco.
        $white = imagecolorallocate($dst, 255, 255, 255);
        imagefill($dst, 0, 0, $white);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
        imagedestroy($src);

        // Temp file: más confiable que ob_start() dentro del stack de buffering de Laravel.
        $tmp = tempnam(sys_get_temp_dir(), 'mosso_pdf_');
        if (! $tmp) {
            imagedestroy($dst);

            return null;
        }

        imagejpeg($dst, $tmp, 65);
        imagedestroy($dst);

        $data = file_get_contents($tmp);
        @unlink($tmp);

        return ($data !== false && $data !== '')
            ? 'data:image/jpeg;base64,'.base64_encode($data)
            : null;
    }

    /**
     * Devuelve una URL file:/// para que dompdf cargue la imagen directamente del disco.
     * Funciona cuando GD no está disponible. Requiere isLocalFileSystemAllowed = true.
     */
    private function imagenFileUrl(string $full): ?string
    {
        // Normaliza separadores y construye file:/// con segmentos codificados.
        $normalized = str_replace('\\', '/', $full);
        $parts = explode('/', $normalized);

        $encoded = implode('/', array_map(function (string $segment): string {
            // No codificar letras de unidad Windows (ej. "C:")
            return preg_match('/^[A-Za-z]:$/', $segment)
                ? $segment
                : rawurlencode($segment);
        }, $parts));

        return 'file:///'.ltrim($encoded, '/');
    }

    private function tituloFiltro(Request $request): string
    {
        if ($request->filled('subcategoria')) {
            $sub = SubCategoria::find($request->integer('subcategoria'));

            return $sub?->nom_sub_categoria ?? 'Catálogo';
        }

        if ($request->filled('categoria')) {
            $cat = Categoria::find($request->integer('categoria'));

            return $cat?->nombre ?? 'Catálogo';
        }

        if ($request->filled('animal')) {
            $animal = Animal::find($request->integer('animal'));

            return $animal?->nombre ?? 'Catálogo';
        }

        return 'Catálogo completo';
    }
}
