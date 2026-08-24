<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request as RequestFacade;
use Illuminate\Validation\ValidationException;

/**
 * Se ejecuta justo después de una autenticación exitosa (credenciales correctas).
 * Si el usuario corresponde a un trabajador con estado inactivo (activo = 0),
 * se cierra la sesión inmediatamente y se rechaza el login con un mensaje claro.
 *
 * Registro en app/Providers/EventServiceProvider.php:
 *
 *   protected $listen = [
 *       \Illuminate\Auth\Events\Login::class => [
 *           \App\Listeners\CheckTrabajadorActivo::class,
 *       ],
 *   ];
 */
class CheckTrabajadorActivo
{
    public function handle(Login $event): void
    {
        $trabajador = DB::table('trabajadores')
            ->where('fk_user', $event->user->getAuthIdentifier())
            ->first();

        // Si el usuario autenticado no es un trabajador (p. ej. un cliente), no aplica.
        if (! $trabajador) {
            return;
        }

        if ((int) $trabajador->activo === 0) {
            Auth::guard($event->guard ?? 'web')->logout();

            $request = RequestFacade::instance();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            throw ValidationException::withMessages([
                'email' => 'Tu cuenta está inactiva. Comunícate con el administrador del sistema.',
            ]);
        }
    }
}