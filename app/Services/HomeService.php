<?php

namespace App\Services;

use App\Models\Marca;
use App\Models\Producto;
use Illuminate\Support\Collection;

class HomeService
{
    /**
     * Productos destacados para el carrusel principal del home.
     * Nota: no existe todavía un flag "destacado" en la tabla productos,
     * así que por ahora se muestran los más recientes activos.
     * Cuando agregues esa columna, cambia el orderBy de aquí.
     */
    public function productosDestacados(int $limite = 12): Collection
    {
        return Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->latest('created_at')
            ->limit($limite)
            ->get()
            ->map(fn (Producto $p) => $this->transformarProducto($p));
    }

    /** Productos que tienen un descuento vigente ahora mismo (sección Ofertas). */
    public function productosEnOferta(int $limite = 12): Collection
    {
        return Producto::activos()
            ->with(['marca', 'descuentoActivo', 'subcategoria.categoria.animal'])
            ->whereHas('descuentoActivo')
            ->latest('created_at')
            ->limit($limite)
            ->get()
            ->map(fn (Producto $p) => $this->transformarProducto($p));
    }

    /** Marcas para el carrusel de "Marcas premium para tu mascota". */
    public function marcasDestacadas(int $limite = 15): Collection
    {
        return Marca::whereNotNull('logo')
            ->orderBy('nombre')
            ->get()
            ->filter(fn (Marca $m) => file_exists(public_path("image/marcas/{$m->logo}")))
            ->take($limite)
            ->map(fn (Marca $m) => [
                'id' => $m->id_marca,
                'nombre' => $m->nombre,
                'logo' => "/image/marcas/{$m->logo}",
                'href' => "/marcas/{$m->id_marca}",
            ])
            ->values();
    }

    private function transformarProducto(Producto $p): array
    {
        $descuento = $p->descuentoActivo;
        $precioFinal = $p->precio;
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