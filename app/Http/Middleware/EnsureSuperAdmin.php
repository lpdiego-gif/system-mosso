<?php

namespace App\Http\Middleware;

use App\Services\PermisoService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege módulos que son enteramente del Super Administrador — Roles y
 * Permisos, Menú del portal, Menú de Mi Cuenta, Funciones (feature flags) —
 * y que, a propósito, NO forman parte del catálogo delegable en
 * `/admin/roles`: no tendría sentido dejar que un Administrador se auto-
 * otorgue (o le quiten) acceso a la pantalla que controla, precisamente,
 * quién tiene acceso a qué. Uso: `super_admin:<redirectA>` (redirectA es
 * opcional, por defecto '/dashboard').
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next, string $redirectA = '/dashboard'): Response
    {
        $user = $request->user();

        if (! $user || ! app(PermisoService::class)->esSuperAdmin($user)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Esta sección es exclusiva del Super Administrador.',
            ]);

            return redirect($redirectA);
        }

        return $next($request);
    }
}
