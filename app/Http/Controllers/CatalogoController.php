<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\SubCategoria;
use App\Support\CatalogoCache;
use Inertia\Inertia;
use Inertia\Response;

class CatalogoController extends Controller
{
    public function porSubcategoria(SubCategoria $subcategoria): Response
    {
        $subcategoria->load(['categoria.animal']);

        $productos = CatalogoCache::remember("subcategoria:{$subcategoria->id_subcategorias}", fn () => Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->where('fk_id_subcategorias', $subcategoria->id_subcategorias)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p))
            ->values());

        return Inertia::render('catalogo/index', [
            'titulo' => $subcategoria->nom_sub_categoria,
            'nivel' => 'subcategoria',
            'breadcrumbs' => [
                [
                    'label' => $subcategoria->categoria->animal->nombre,
                    'href' => "/catalogo/animal/{$subcategoria->categoria->animal->id_animal}",
                ],
                [
                    'label' => $subcategoria->categoria->nombre,
                    'href' => "/catalogo/categoria/{$subcategoria->categoria->id_categoria}",
                ],
                [
                    'label' => $subcategoria->nom_sub_categoria,
                    'href' => null,
                ],
            ],
            'productos' => $productos,
        ]);
    }

    public function porCategoria(Categoria $categoria): Response
    {
        $categoria->load(['animal', 'subcategorias']);

        $ids = $categoria->subcategorias->pluck('id_subcategorias');

        $productos = CatalogoCache::remember("categoria:{$categoria->id_categoria}", fn () => Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->whereIn('fk_id_subcategorias', $ids)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p))
            ->values());

        return Inertia::render('catalogo/index', [
            'titulo' => $categoria->nombre,
            'nivel' => 'categoria',
            'breadcrumbs' => [
                [
                    'label' => $categoria->animal->nombre,
                    'href' => "/catalogo/animal/{$categoria->animal->id_animal}",
                ],
                [
                    'label' => $categoria->nombre,
                    'href' => null,
                ],
            ],
            'productos' => $productos,
        ]);
    }

    public function porAnimal(Animal $animal): Response
    {
        $animal->load(['categorias.subcategorias']);

        $ids = $animal->categorias->flatMap(
            fn ($c) => $c->subcategorias->pluck('id_subcategorias')
        );

        $productos = CatalogoCache::remember("animal:{$animal->id_animal}", fn () => Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->whereIn('fk_id_subcategorias', $ids)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p))
            ->values());

        return Inertia::render('catalogo/index', [
            'titulo' => $animal->nombre,
            'nivel' => 'animal',
            'breadcrumbs' => [
                [
                    'label' => $animal->nombre,
                    'href' => null,
                ],
            ],
            'productos' => $productos,
        ]);
    }

    public function show(Producto $producto): Response
    {
        $producto->load(['marca', 'descuentoActivo', 'subcategoria.categoria.animal']);

        $sub = $producto->subcategoria;
        $cat = $sub?->categoria;
        $animal = $cat?->animal;

        $descuento = $producto->descuentoActivo;
        $precioFinal = (float) $producto->precio;
        $porcentajeOff = null;

        if ($descuento) {
            if ($descuento->tipo === 'porcentaje') {
                $precioFinal = $producto->precio - ($producto->precio * $descuento->valor / 100);
                $porcentajeOff = (int) round($descuento->valor);
            } else {
                $precioFinal = max(0, $producto->precio - $descuento->valor);
                $porcentajeOff = (int) round((1 - $precioFinal / $producto->precio) * 100);
            }
        }

        $breadcrumbs = [];
        if ($animal) {
            $breadcrumbs[] = ['label' => $animal->nombre, 'href' => "/catalogo/animal/{$animal->id_animal}"];
        }
        if ($cat) {
            $breadcrumbs[] = ['label' => $cat->nombre, 'href' => "/catalogo/categoria/{$cat->id_categoria}"];
        }
        if ($sub) {
            $breadcrumbs[] = ['label' => $sub->nom_sub_categoria, 'href' => "/catalogo/subcategoria/{$sub->id_subcategorias}"];
        }
        $breadcrumbs[] = ['label' => $producto->nombre, 'href' => null];

        return Inertia::render('catalogo/producto', [
            'producto' => [
                'id' => $producto->id_producto,
                'sku' => $producto->sku,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'marca' => $producto->marca?->nombre,
                'imagen' => Producto::urlImagen($producto->imagen_principal),
                'precio' => (float) $producto->precio,
                'precioFinal' => round($precioFinal, 2),
                'porcentajeOff' => $porcentajeOff,
                'stock' => (int) $producto->stock,
                'href' => "/producto/{$producto->id_producto}",
            ],
            'breadcrumbs' => $breadcrumbs,
            'relacionados' => $this->relacionados($producto, $sub, $cat),
        ]);
    }

    /**
     * Productos recomendados debajo del detalle: primero intenta la misma
     * subcategoría (más relevante); si tiene pocos productos, amplía a toda
     * la categoría. Nunca incluye al producto actual.
     *
     * @return array<int, array<string, mixed>>
     */
    private function relacionados(Producto $producto, ?SubCategoria $sub, ?Categoria $cat): array
    {
        $minResultados = 4;
        $limite = 10;

        $base = fn () => Producto::activos()
            ->where('id_producto', '!=', $producto->id_producto)
            ->whereNotNull('imagen_principal')
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal']);

        if ($sub) {
            $productos = $base()
                ->where('fk_id_subcategorias', $sub->id_subcategorias)
                ->inRandomOrder()
                ->limit($limite)
                ->get();

            if ($productos->count() >= $minResultados) {
                return $productos->map(fn (Producto $p) => $this->formato($p))->values()->all();
            }
        }

        if ($cat) {
            $productos = $base()
                ->whereHas('subcategoria', fn ($q) => $q->where('fk_id_categoria', $cat->id_categoria))
                ->inRandomOrder()
                ->limit($limite)
                ->get();

            return $productos->map(fn (Producto $p) => $this->formato($p))->values()->all();
        }

        return [];
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

        $subcategoria = $p->subcategoria;
        $categoria = $subcategoria?->categoria;

        return [
            'id' => $p->id_producto,
            'nombre' => $p->nombre,
            'marca' => $p->marca?->nombre,
            'marcaId' => $p->marca?->id_marca,
            'imagen' => Producto::urlImagen($p->imagen_principal),
            'tipo_animal' => $categoria?->animal?->nombre,
            'precio' => (float) $p->precio,
            'precioFinal' => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'stock' => (int) $p->stock,
            'categoriaId' => $categoria?->id_categoria,
            'categoriaNombre' => $categoria?->nombre,
            'subcategoriaId' => $subcategoria?->id_subcategorias,
            'subcategoriaNombre' => $subcategoria?->nom_sub_categoria,
            'href' => "/producto/{$p->id_producto}",
        ];
    }
}
