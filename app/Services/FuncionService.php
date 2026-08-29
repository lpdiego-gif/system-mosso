<?php

namespace App\Services;

use App\Models\Funcion;

class FuncionService
{
    /**
     * Si la clave no tiene fila en `funciones`, se considera habilitada por
     * defecto — solo los módulos que explícitamente se agregaron a la tabla
     * quedan sujetos a este interruptor. Así no hace falta una fila por cada
     * ruta de la app, solo para los módulos que de verdad se entregan por fases.
     */
    public function activa(string $clave): bool
    {
        $funcion = Funcion::where('clave', $clave)->first();

        return $funcion === null || $funcion->activo;
    }

    /**
     * @return array<string, bool> clave => activo, para compartir con el frontend.
     */
    public function estados(): array
    {
        return Funcion::query()
            ->pluck('activo', 'clave')
            ->map(fn ($activo) => (bool) $activo)
            ->all();
    }
}
