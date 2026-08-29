<?php

namespace App\Services;

use App\Models\MenuCuenta;

class MenuCuentaService
{
    /**
     * Ruta pública de cada sección real de "Mi cuenta". La clave en BD no
     * siempre coincide con el slug de la URL (ej. `puntos_cupones` -> `/puntos`),
     * así que se resuelve aquí en vez de asumir `/mi-cuenta/{clave}`.
     *
     * @var array<string, string>
     */
    private const RUTAS_SECCION = [
        'pedidos' => '/mi-cuenta/pedidos',
        'direcciones' => '/mi-cuenta/direcciones',
        'mascotas' => '/mi-cuenta/mascotas',
        'puntos_cupones' => '/mi-cuenta/puntos',
        'detalles' => '/mi-cuenta/detalles',
    ];

    public function build(): array
    {
        return MenuCuenta::where('activo', true)
            ->orderBy('orden')
            ->get()
            ->map(fn (MenuCuenta $item) => $this->resolveItem($item))
            ->values()
            ->toArray();
    }

    private function resolveItem(MenuCuenta $item): array
    {
        return [
            'id' => $item->id_menu_cuenta,
            'tipo' => $item->tipo,
            'clave' => $item->clave,
            'nombre' => $item->nombre,
            'descripcion' => $item->descripcion,
            'icono' => $item->icono,
            'href' => $item->tipo === 'seccion_interna'
                ? (self::RUTAS_SECCION[$item->clave] ?? '/mi-cuenta')
                : ($item->url ?? '#'),
        ];
    }
}
