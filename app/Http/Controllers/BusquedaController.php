<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusquedaController extends Controller
{
    private const MAX_SUGERENCIAS = 6;

    public function __invoke(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->when($q !== '', fn ($query) => $query->where('nombre', 'like', "%{$q}%"))
            ->orderBy('nombre')
            ->limit(40)
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return Inertia::render('buscar', [
            'query'     => $q,
            'productos' => $productos->values(),
        ]);
    }

    /**
     * Búsqueda instantánea para el desplegable del buscador del header:
     * JSON liviano, pocos resultados. No confundir con __invoke() (página
     * completa de resultados, usada al enviar el formulario).
     */
    public function sugerencias(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['productos' => []]);
        }

        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->where('nombre', 'like', "%{$q}%")
            ->orderBy('nombre')
            ->limit(self::MAX_SUGERENCIAS)
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return response()->json(['productos' => $productos->values()]);
    }

    private function formato(Producto $p): array
    {
        $descuento    = $p->descuentoActivo;
        $precioFinal  = (float) $p->precio;
        $porcentajeOff = null;

        if ($descuento) {
            if ($descuento->tipo === 'porcentaje') {
                $precioFinal   = $p->precio - ($p->precio * $descuento->valor / 100);
                $porcentajeOff = (int) round($descuento->valor);
            } else {
                $precioFinal   = max(0, $p->precio - $descuento->valor);
                $porcentajeOff = (int) round((1 - $precioFinal / $p->precio) * 100);
            }
        }

        return [
            'id'            => $p->id_producto,
            'nombre'        => $p->nombre,
            'marca'         => $p->marca?->nombre,
            'imagen'        => Producto::urlImagen($p->imagen_principal),
            'tipo_animal'   => $p->subcategoria?->categoria?->animal?->nombre,
            'precio'        => (float) $p->precio,
            'precioFinal'   => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'href'          => "/producto/{$p->id_producto}",
        ];
    }
}