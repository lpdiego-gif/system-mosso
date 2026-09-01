<?php

namespace App\Services;

use App\Models\Funcion;
use Illuminate\Support\Facades\Cache;

class FuncionService
{
    /**
     * `funciones` se lee en cada request (es un prop compartido de Inertia,
     * ver HandleInertiaRequests) para decidir qué se muestra en el menú y
     * qué rutas se bloquean — se cachea un rato para no pagar esa consulta
     * en cada navegación. Se invalida sola al guardar/borrar un Funcion
     * (ver Funcion::booted()), así que el techo de 5 min es solo un resguardo.
     */
    private const CACHE_KEY = 'shared.funciones.estados';

    private const CACHE_TTL = 300;

    /**
     * Si la clave no tiene fila en `funciones`, se considera habilitada por
     * defecto — solo los módulos que explícitamente se agregaron a la tabla
     * quedan sujetos a este interruptor. Así no hace falta una fila por cada
     * ruta de la app, solo para los módulos que de verdad se entregan por fases.
     */
    public function activa(string $clave): bool
    {
        return $this->estados()[$clave] ?? true;
    }

    /**
     * @return array<string, bool> clave => activo, para compartir con el frontend.
     */
    public function estados(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return Funcion::query()
                ->pluck('activo', 'clave')
                ->map(fn ($activo) => (bool) $activo)
                ->all();
        });
    }

    public static function limpiarCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
