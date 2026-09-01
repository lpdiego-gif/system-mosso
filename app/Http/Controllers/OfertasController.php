<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Support\CatalogoCache;
use Inertia\Inertia;
use Inertia\Response;

class OfertasController extends Controller
{
    public function __invoke(): Response
    {
        $productos = CatalogoCache::remember('ofertas', fn () => Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->whereHas('descuentoActivo')
            ->latest('created_at')
            ->get()
            ->map(fn (Producto $p) => $this->formato($p))
            ->values());

        return Inertia::render('ofertas', [
            'productos' => $productos,
        ]);
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
            'tipo_animal' => $p->subcategoria?->categoria?->animal?->nombre,
            'precio' => (float) $p->precio,
            'precioFinal' => round($precioFinal, 2),
            'porcentajeOff' => $porcentajeOff,
            'href' => "/producto/{$p->id_producto}",
        ];
    }
}
