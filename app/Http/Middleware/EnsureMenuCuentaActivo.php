<?php

namespace App\Http\Middleware;

use App\Models\MenuCuenta;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloquea una sección de "Mi cuenta" (/mi-cuenta/pedidos, /direcciones, etc.)
 * cuando el admin la desactivó desde "Menu Clientes" — redirige al escritorio
 * en silencio, sin importar si se entra por URL directa o un enlace viejo
 * guardado en favoritos. Se aplica con el parámetro de la `clave` real de
 * `menu_cuenta` (ej. `menu.cuenta:puntos_cupones`).
 */
class EnsureMenuCuentaActivo
{
    public function handle(Request $request, Closure $next, string $clave): Response
    {
        $activo = MenuCuenta::query()
            ->where('tipo', 'seccion_interna')
            ->where('clave', $clave)
            ->where('activo', true)
            ->exists();

        if (! $activo) {
            return redirect()->route('mi-cuenta');
        }

        return $next($request);
    }
}
