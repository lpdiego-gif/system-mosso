<?php

namespace App\Http\Responses;

use App\Services\CuentaService;
use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;

/**
 * A dónde va un usuario tras iniciar sesión con passkey. El paquete manda a
 * `config('passkeys.redirect')` (por defecto `/`); aquí replicamos la misma
 * lógica de LoginResponse: si venía de una URL protegida se respeta, si no se
 * decide según sea trabajador (dashboard) o cliente (mi-cuenta).
 */
class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    public function toResponse($request)
    {
        $destino = $request->session()->pull('url.intended')
            ?? app(CuentaService::class)->redirectPara($request->user());

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $destino], 200)
            : redirect()->to($destino);
    }
}
