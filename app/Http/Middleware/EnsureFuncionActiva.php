<?php

namespace App\Http\Middleware;

use App\Services\FuncionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Interruptor maestro de un módulo completo (Puntos y cupones, Mascotas,
 * Servicios, ...) para la entrega por fases: mientras esté apagado en
 * "Funciones" del admin, bloquea el acceso directo a sus rutas sin importar
 * lo que digan `menu_cuenta`/`menus`. Uso: `feature:<clave>,<redirectA>`
 * (redirectA es opcional, por defecto '/').
 */
class EnsureFuncionActiva
{
    public function handle(Request $request, Closure $next, string $clave, string $redirectA = '/'): Response
    {
        if (! app(FuncionService::class)->activa($clave)) {
            return redirect($redirectA);
        }

        return $next($request);
    }
}
