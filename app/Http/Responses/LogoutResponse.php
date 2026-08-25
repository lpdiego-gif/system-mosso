<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

/**
 * A dónde va cualquier usuario (trabajador o cliente) justo después de
 * cerrar sesión: siempre al home público de la tienda. No hay nada que
 * diferenciar aquí (a diferencia de LoginResponse) — una vez sin sesión, no
 * tiene sentido devolver a nadie al panel admin ni a /mi-cuenta.
 */
class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        return redirect()->route('home');
    }
}
