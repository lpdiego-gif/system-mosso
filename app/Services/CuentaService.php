<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Determina si un usuario autenticado es trabajador o cliente (según las
 * tablas `trabajadores`/`clientes`, ambas ligadas a `users` por fk_user) y a
 * dónde debe ir tras iniciar sesión. Un mismo login (Fortify) sirve para
 * ambos tipos de cuenta; esta clase es la que "diferencia según la base de
 * datos", tal como se pidió.
 */
class CuentaService
{
    public function tipoDe(User $user): string
    {
        if (DB::table('trabajadores')->where('fk_user', $user->id)->exists()) {
            return 'trabajador';
        }

        if (DB::table('clientes')->where('fk_user', $user->id)->exists()) {
            return 'cliente';
        }

        return 'otro';
    }

    public function redirectPara(User $user): string
    {
        return match ($this->tipoDe($user)) {
            'trabajador' => route('dashboard'),
            default => route('mi-cuenta'),
        };
    }

    /**
     * id_cliente de este usuario, o null si no tiene fila en `clientes`
     * (no debería pasar para quien pasó el middleware `cliente`, salvo el
     * caso borde de un `users` sin trabajador ni cliente asociado).
     */
    public function clienteIdDe(User $user): ?int
    {
        return DB::table('clientes')->where('fk_user', $user->id)->value('id_cliente');
    }
}
