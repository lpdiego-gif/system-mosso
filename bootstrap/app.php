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

        // El checkout y "Cambios y devoluciones" son parte del storefront: el
        // invitado va al login público (/cuenta), no al login por defecto de
        // Fortify (/login).
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->routeIs('checkout.*') || $request->routeIs('devoluciones.*')) {
                return route('cuenta');
            }

            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
