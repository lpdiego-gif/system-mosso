<?php

namespace App\Http\Middleware;

use App\Services\CuentaService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege las páginas de "Mi cuenta" (/mi-cuenta/*) de que un trabajador
 * autenticado termine ahí por error: lo manda de vuelta al panel admin.
 * Clientes y cualquier otra cuenta autenticada sin trabajador asociado sí
 * pueden entrar. Se combina siempre con el middleware `auth`.
 */
class EnsureEsCliente
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && app(CuentaService::class)->tipoDe($user) === 'trabajador') {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
