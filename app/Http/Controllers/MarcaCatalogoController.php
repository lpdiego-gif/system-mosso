<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use App\Models\Producto;
use Inertia\Inertia;
use Inertia\Response;

class MarcaCatalogoController extends Controller
{
    /**
     * Listado de todas las marcas ("Ver todas" del mega menú / botón "Marca").
     */
    public function index(): Response
    {
        $marcas = Marca::withCount(['productos' => fn ($q) => $q->activos()])
            ->orderBy('nombre')
            ->get()
            ->filter(fn (Marca $m) => $m->productos_count > 0)
            ->map(fn (Marca $m) => [
                'id' => $m->id_marca,
                'nombre' => $m->nombre,
                'logo' => $m->logo && file_exists(public_path("image/marcas/{$m->logo}"))
                    ? "/image/marcas/{$m->logo}"
                    : null,
                'totalProductos' => $m->productos_count,
                'href' => "/marcas/{$m->id_marca}",
            ])
            ->values();

        return Inertia::render('marcas/index', [
            'marcas' => $marcas,
        ]);
    }

    public function show(Marca $marca): Response
    {
        $productos = Producto::activos()
            ->with(['marca', 'descuentoActivo'])
            ->where('fk_marca', $marca->id_marca)
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p));

        return Inertia::render('catalogo/index', [
            'titulo'      => $marca->nombre,
            'breadcrumbs' => [
                ['label' => 'Marcas',       'href' => '/marcas'],
                ['label' => $marca->nombre, 'href' => null],
            ],
            'productos'   => $productos->values(),
        ]);
    }

    private function formato(Producto $p): array
    {
        $descuento     = $p->descuentoActivo;
        $precioFinal   = (float) $p->precio;
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
            'precio'        => (float) $p->precio,
            'precioFinal'   => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'href'          => "/producto/{$p->id_producto}",
        ];
    }
}
