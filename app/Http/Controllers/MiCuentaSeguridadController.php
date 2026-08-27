<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

/**
 * "Acceso y seguridad" del cliente dentro de Mi cuenta: cambiar contraseña y
 * administrar passkeys, con el estilo del storefront. Es el equivalente de
 * Settings\SecurityController (panel admin) pero SIN la verificación en dos
 * pasos, que es solo para trabajadores (ver EnsureEsTrabajador).
 *
 * El cambio de contraseña reutiliza la ruta `user-password.update` de Fortify;
 * las passkeys, las rutas `passkey.*` de laravel/passkeys. Este controlador
 * solo arma la pantalla.
 */
class MiCuentaSeguridadController extends Controller
{
    public function index(Request $request): Response
    {
        $puedeGestionarPasskeys = Features::canManagePasskeys();

        return Inertia::render('mi-cuenta-seguridad', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'canManagePasskeys' => $puedeGestionarPasskeys,
            'passkeys' => $puedeGestionarPasskeys
                ? $request->user()
                    ->passkeys()
                    ->latest()
                    ->get()
                    ->map(fn ($passkey) => [
                        'id' => $passkey->id,
                        'name' => $passkey->name,
                        'created_at_diff' => $passkey->created_at->diffForHumans(),
                        'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                    ])
                    ->values()
                    ->all()
                : [],
        ]);
    }
}
