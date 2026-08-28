<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;

/**
 * Tras restablecer la contraseña, el kit de Fortify manda a `route('login')`
 * (la pantalla del kit). Aquí devolvemos al hub de auth del storefront
 * (`/cuenta`) con el flash `status`, para que el usuario vea el banner verde
 * de confirmación y siga logueándose sin salir de la tienda.
 */
class PasswordResetResponse implements PasswordResetResponseContract
{
    public function __construct(protected string $status) {}

    public function toResponse($request)
    {
        return $request->wantsJson()
            ? new JsonResponse(['message' => trans($this->status)], 200)
            : redirect()->route('cuenta')->with('status', trans($this->status));
    }
}
