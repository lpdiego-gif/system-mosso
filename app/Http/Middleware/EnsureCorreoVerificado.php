<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege "Mi cuenta" de un cliente que se registró (correo + contraseña) pero
 * nunca confirmó su correo con el código de 6 dígitos. Lo devuelve a /cuenta,
 * donde CuentaController le muestra el formulario del código.
 *
 * No usamos el middleware `verified` de Laravel a propósito: ese redirige a la
 * verificación por enlace de Fortify (`verification.notice`), y el registro de
 * clientes de MOSSO usa código, no enlace. Se combina siempre con `auth`.
 */
class EnsureCorreoVerificado
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->hasVerifiedEmail()) {
            return redirect()->route('cuenta');
        }

        return $next($request);
    }
}
