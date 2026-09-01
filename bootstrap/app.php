<?php

use App\Http\Middleware\EnsureEsCliente;
use App\Http\Middleware\EnsureFuncionActiva;
use App\Http\Middleware\EnsureGestionaRoles;
use App\Http\Middleware\EnsureMenuAnimalActivo;
use App\Http\Middleware\EnsureMenuCuentaActivo;
use App\Http\Middleware\EnsurePermiso;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'cliente' => EnsureEsCliente::class,
            'menu.cuenta' => EnsureMenuCuentaActivo::class,
            'menu.animal' => EnsureMenuAnimalActivo::class,
            'feature' => EnsureFuncionActiva::class,
            'permiso' => EnsurePermiso::class,
            'super_admin' => EnsureSuperAdmin::class,
            'gestiona.roles' => EnsureGestionaRoles::class,
        ]);

        // Login único del proyecto: cualquier invitado que caiga en una ruta
        // protegida (storefront o panel admin) va a /cuenta, el formulario del
        // Portal Web. Sirve para trabajador y cliente por igual — ambos POSTean
        // a `login.store` de Fortify y `LoginResponse` decide el destino según
        // el tipo de cuenta y la URL "intended". La página /login de Fortify
        // (auth/login.tsx) sigue existiendo pero ya no se llega a ella por
        // redirección.
        $middleware->redirectGuestsTo(fn () => route('cuenta'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
