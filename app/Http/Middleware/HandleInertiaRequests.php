<?php

namespace App\Http\Middleware;

use App\Services\CarritoService;
use App\Services\FuncionService;
use App\Services\MenuCuentaService;
use App\Services\MenuService;
use App\Services\PermisoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Claves de permiso (`modulo.accion`) del usuario autenticado — el sidebar
            // admin las usa para no mostrar secciones a las que no tiene acceso.
            // OJO: se llama "misPermisos" (no "permisos") a propósito — la pantalla
            // de Roles y Permisos ya usa "permisos" para su propio catálogo
            // (Admin/Roles/Index), y Inertia sobreescribe un prop compartido con
            // uno de página que tenga el mismo nombre.
            'misPermisos' => fn () => $request->user()
                ? app(PermisoService::class)->clavesDe($request->user())
                : [],
            'esSuperAdmin' => fn () => $request->user()
                ? app(PermisoService::class)->esSuperAdmin($request->user())
                : false,
            'puedeGestionarRoles' => fn () => $request->user()
                ? app(PermisoService::class)->puedeGestionarRoles($request->user())
                : false,

            // Menú del header/mega menu, disponible en todas las páginas
            'menu' => fn () => app(MenuService::class)->build(),

            // Menú del panel "Mi cuenta" (secciones + enlaces libres), disponible en todas las páginas
            'menuCuenta' => fn () => app(MenuCuentaService::class)->build(),

            // Feature flags de módulos entregados por fases (clave => activo), disponible en todas las páginas
            'funciones' => fn () => app(FuncionService::class)->estados(),

            // Cantidad de ítems en carrito (badge del header)
            'carrito' => fn () => [
                'cantidad' => app(CarritoService::class)->contarItems($request),
            ],

            // Datos públicos de la empresa (logo, contacto, dirección) para el header/footer.
            'empresa' => fn () => DB::table('empresa as e')
                ->leftJoin('direcciones as d', 'd.id_direccion', '=', 'e.fk_direccion')
                ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
                ->select([
                    'e.nombre_comercial', 'e.logo', 'e.correo', 'e.telefono',
                    'd.direccion', 'dist.nombre as distrito',
                ])
                ->first(),
        ];
    }
}