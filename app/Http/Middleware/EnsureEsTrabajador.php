<?php

namespace App\Http\Middleware;

use App\Services\CuentaService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Espejo de EnsureEsCliente: protege el panel (`/dashboard` y donde se aplique
 * el alias `trabajador`) de que un cliente autenticado —o cualquier `users` sin
 * fila en `trabajadores`— entre por error. Lo manda a "Mi cuenta". Se combina
 * siempre con `auth`.
 *
 * La restricción de las rutas `two-factor.*` de Fortify vive aparte, en
 * RestringirGestionDosPasos (grupo `web`), porque Fortify las registra por su
 * cuenta y no se les puede añadir middleware de forma fiable.
 */
class EnsureEsTrabajador
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && app(CuentaService::class)->tipoDe($user) !== 'trabajador') {
            return redirect()->route('mi-cuenta');
        }

        return $next($request);
    }
}
