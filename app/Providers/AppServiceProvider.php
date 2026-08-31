<?php

namespace App\Providers;

use App\Models\User;
use App\Services\PermisoService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PermisoService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAutorizacion();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Expone el sistema de roles/permisos (`app/Services/PermisoService.php`)
     * a través del `Gate` estándar de Laravel, para poder usar `$user->can('permiso', 'productos.crear')`
     * o `@can('permiso', 'productos.crear')` en cualquier parte de la app además
     * del middleware `permiso:<clave>` usado en las rutas.
     */
    protected function configureAutorizacion(): void
    {
        Gate::before(fn (User $user, string $ability) => app(PermisoService::class)->esSuperAdmin($user) ? true : null);

        Gate::define('permiso', fn (User $user, string $clave) => app(PermisoService::class)->tiene($user, $clave));
    }
}
