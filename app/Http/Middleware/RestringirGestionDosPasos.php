<?php

namespace App\Http\Middleware;

use App\Services\CuentaService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * La verificación en dos pasos (Fortify) es solo para el personal con acceso al
 * panel, no para clientes del storefront. Fortify registra sus rutas
 * `two-factor.*` por su cuenta, sin punto de enganche para middleware extra (y
 * añadirlo con `Route::getByName()->middleware()` no persiste de forma fiable),
 * así que este guard va en el grupo `web` (ver bootstrap/app.php) y se
 * autolimita por nombre a esas rutas: a quien no sea trabajador le responde 403.
 *
 * El gating de la UI de 2FA lo hace además Settings\SecurityController::edit().
 */
class RestringirGestionDosPasos
{
    private const RUTAS = [
        'two-factor.enable',
        'two-factor.confirm',
        'two-factor.disable',
        'two-factor.qr-code',
        'two-factor.secret-key',
        'two-factor.recovery-codes',
        'two-factor.regenerate-recovery-codes',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs(self::RUTAS)) {
            $user = $request->user();

            abort_unless(
                $user && app(CuentaService::class)->tipoDe($user) === 'trabajador',
                403,
                'La verificación en dos pasos es solo para el personal de MOSSO.',
            );
        }

        return $next($request);
    }
}
