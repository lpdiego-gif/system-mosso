<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege una ruta detrás de un permiso puntual (`modulo.accion`, ver la
 * tabla `permisos`). Reutiliza el Gate `permiso` definido en
 * `AppServiceProvider` (que a su vez usa `PermisoService`), por lo que un rol
 * «Super Administrador» pasa siempre. Uso: `permiso:<clave>,<redirectA>`
 * (redirectA es opcional, por defecto '/dashboard').
 */
class EnsurePermiso
{
    public function handle(Request $request, Closure $next, string $clave, string $redirectA = '/dashboard'): Response
    {
        $user = $request->user();

        if (! $user || Gate::forUser($user)->denies('permiso', $clave)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No tienes permiso para acceder a esta sección.',
            ]);

            return redirect($redirectA);
        }

        return $next($request);
    }
}
