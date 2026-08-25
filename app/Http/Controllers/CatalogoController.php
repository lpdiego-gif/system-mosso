<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\SubCategoria;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CatalogoController extends Controller
{
    public function porSubcategoria(SubCategoria $subcategoria): Response
    {
        $subcategoria->load(['categoria.animal']);

        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo'])
            ->where('fk_id_subcategorias', $subcategoria->id_subcategorias)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return Inertia::render('catalogo/index', [
            'titulo' => $subcategoria->nom_sub_categoria,
            'breadcrumbs' => [
                [
                    'label' => $subcategoria->categoria->animal->nombre,
                    'href'  => "/catalogo/animal/{$subcategoria->categoria->animal->id_animal}",
                ],
                [
                    'label' => $subcategoria->categoria->nombre,
                    'href'  => "/catalogo/categoria/{$subcategoria->categoria->id_categoria}",
                ],
                [
                    'label' => $subcategoria->nom_sub_categoria,
                    'href'  => null,
                ],
            ],
            'productos' => $productos,
        ]);
    }

    public function porCategoria(Categoria $categoria): Response
    {
        $categoria->load(['animal', 'subcategorias']);

        $ids = $categoria->subcategorias->pluck('id_subcategorias');

        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo'])
            ->whereIn('fk_id_subcategorias', $ids)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return Inertia::render('catalogo/index', [
            'titulo' => $categoria->nombre,
            'breadcrumbs' => [
                [
                    'label' => $categoria->animal->nombre,
                    'href'  => "/catalogo/animal/{$categoria->animal->id_animal}",
                ],
                [
                    'label' => $categoria->nombre,
                    'href'  => null,
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

        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo'])
            ->whereIn('fk_id_subcategorias', $ids)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return Inertia::render('catalogo/index', [
            'titulo' => $animal->nombre,
            'breadcrumbs' => [
                [
                    'label' => $animal->nombre,
                    'href'  => null,
                ],
            ],
            'productos' => $productos,
        ]);
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
            'imagen'        => $p->imagen_principal
                                ? Storage::url($p->imagen_principal)
                                : null,
            'precio'        => (float) $p->precio,
            'precioFinal'   => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'href'          => "/producto/{$p->id_producto}",
        ];
    }
}
