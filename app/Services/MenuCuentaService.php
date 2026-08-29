<?php

namespace App\Services;

use App\Models\MenuCuenta;

class MenuCuentaService
{
    /**
     * Claves de sección que además dependen de un feature flag en `funciones`
     * (entrega por fases) — si el módulo está apagado ahí, el ítem no se
     * muestra aunque su fila en `menu_cuenta` esté activa. Las claves que no
     * aparecen aquí (pedidos, direcciones, detalles) no dependen de ningún
     * flag.
     *
     * @var array<string, string>
     */
    private const CLAVE_A_FUNCION = [
        'mascotas' => 'mascotas',
        'puntos_cupones' => 'puntos_cupones',
    ];

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

    public function __construct(private readonly FuncionService $funciones) {}

    public function build(): array
    {
        return MenuCuenta::where('activo', true)
            ->orderBy('orden')
            ->get()
            ->filter(fn (MenuCuenta $item) => $this->visible($item))
            ->map(fn (MenuCuenta $item) => $this->resolveItem($item))
            ->values()
            ->toArray();
    }

    private function visible(MenuCuenta $item): bool
    {
        $clave = self::CLAVE_A_FUNCION[$item->clave] ?? null;

        return $clave === null || $this->funciones->activa($clave);
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
