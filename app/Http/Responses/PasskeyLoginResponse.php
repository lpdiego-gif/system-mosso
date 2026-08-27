<?php

namespace App\Http\Responses;

use App\Services\CuentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;

/**
 * A dónde va un usuario tras iniciar sesión con una passkey. Mismo criterio
 * que App\Http\Responses\LoginResponse (login con contraseña): respeta la URL
 * "intended" si la había, si no decide según sea trabajador o cliente.
 *
 * El paquete laravel/passkeys por defecto manda a `/` (o a config
 * `passkeys.redirect`), sin distinguir el tipo de cuenta; esta clase lo
 * alinea con el resto del login unificado. El front (`cuenta.tsx`) hace
 * `router.visit(response.redirect)` con la URL que devolvemos aquí.
 */
class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        $destino = $request->session()->pull('url.intended')
            ?? app(CuentaService::class)->redirectPara($request->user());

        if ($request->wantsJson()) {
            return new JsonResponse(['redirect' => $destino], 200);
        }

        return redirect()->to($destino);
    }
}
