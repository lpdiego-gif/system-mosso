<?php

use App\Http\Middleware\EnsureCorreoVerificado;
use App\Http\Middleware\EnsureEsCliente;
use App\Http\Middleware\EnsureEsTrabajador;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RestringirGestionDosPasos;
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
            // Se autolimita a las rutas `two-factor.*` de Fortify (2FA solo para
            // trabajadores). Va aquí porque esas rutas las registra el paquete.
            RestringirGestionDosPasos::class,
        ]);

        $middleware->alias([
            'cliente' => EnsureEsCliente::class,
            'trabajador' => EnsureEsTrabajador::class,
            'correo.verificado' => EnsureCorreoVerificado::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
