<?php

namespace App\Http\Middleware;

use App\Services\PermisoService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege /admin/roles. A diferencia de `EnsureSuperAdmin`, aquí también
 * entra el rol «Administrador» — con el alcance limitado que impone
 * `PermisoService::rolesGestionablesPor()`/`puedeOtorgar()` (delegación con
 * techo: solo su equipo operativo, y solo lo que él mismo ya tiene).
 */
class EnsureGestionaRoles
{
    public function handle(Request $request, Closure $next, string $redirectA = '/dashboard'): Response
    {
        $user = $request->user();

        if (! $user || ! app(PermisoService::class)->puedeGestionarRoles($user)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No tienes permiso para gestionar roles.',
            ]);

            return redirect($redirectA);
        }

        return $next($request);
    }
}
