<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permiso;
use App\Models\Rol;
use App\Services\PermisoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pantalla de Roles y Permisos: una matriz donde cada celda cruza un rol
 * (`roles`) con un permiso (`permisos`) a través del pivote `rol_permisos`.
 * Pensada para asignar/quitar permisos por clic, sin formularios de por
 * medio — igual que los interruptores de `funciones`.
 *
 * El rol «Super Administrador» no se guarda en `rol_permisos`: siempre tiene
 * el catálogo completo por bypass (`PermisoService::esSuperAdmin()`), así
 * que sus celdas viajan al frontend ya marcadas y bloqueadas.
 *
 * Delegación con techo: además del Super Administrador, «Administrador»
 * también entra aquí (ver middleware `gestiona.roles`), pero acotado a su
 * equipo (`rolesGestionablesPor`) y sin poder otorgar lo que él mismo no
 * tiene (`puedeOtorgar`) — quitar un permiso sí siempre se permite.
 */
class RolController extends Controller
{
    public function index(Request $request): Response
    {
        $servicio = app(PermisoService::class);
        $rolesGestionables = $servicio->rolesGestionablesPor($request->user());

        $roles = $rolesGestionables
            ->map(fn (Rol $rol) => [
                'id_rol' => $rol->id_rol,
                'nombre' => $rol->nombre,
                'descripcion' => $rol->descripcion,
                'es_super_admin' => $rol->nombre === PermisoService::ROL_SUPER_ADMIN,
            ])
            ->values();

        $permisos = Permiso::query()
            ->orderBy('clave')
            ->get(['id_permiso', 'clave', 'descripcion']);

        $asignaciones = DB::table('rol_permisos')
            ->whereIn('fk_rol', $rolesGestionables->pluck('id_rol'))
            ->get(['fk_rol', 'fk_permiso'])
            ->groupBy('fk_rol')
            ->map(fn ($filas) => $filas->pluck('fk_permiso')->values());

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'permisos' => $permisos,
            'asignaciones' => (object) $asignaciones->all(),
        ]);
    }

    /**
     * Prende/apaga un único permiso para un rol.
     */
    public function togglePermiso(Request $request, Rol $rol, Permiso $permiso): RedirectResponse
    {
        $servicio = app(PermisoService::class);
        $actor = $request->user();

        if ($this->esSuperAdmin($rol)) {
            return $this->bloquearSuperAdmin();
        }

        if (! $servicio->rolesGestionablesPor($actor)->contains('id_rol', $rol->id_rol)) {
            return $this->bloquearFueraDeAlcance();
        }

        $yaAsignado = $rol->permisos()->where('permisos.id_permiso', $permiso->id_permiso)->exists();

        if (! $yaAsignado && ! $servicio->puedeOtorgar($actor, $permiso->clave)) {
            return $this->bloquearSinTecho($permiso->clave);
        }

        $rol->permisos()->toggle($permiso->id_permiso);

        return back();
    }

    /**
     * Reemplaza de una vez el set completo de permisos de un rol. Lo usan
     * los botones «Seleccionar todos» / «Quitar todos» de cada módulo,
     * enviando la unión o la resta del módulo sobre el set actual.
     */
    public function syncPermisos(Request $request, Rol $rol): RedirectResponse
    {
        $servicio = app(PermisoService::class);
        $actor = $request->user();

        if ($this->esSuperAdmin($rol)) {
            return $this->bloquearSuperAdmin();
        }

        if (! $servicio->rolesGestionablesPor($actor)->contains('id_rol', $rol->id_rol)) {
            return $this->bloquearFueraDeAlcance();
        }

        $validado = $request->validate([
            'permisos' => ['array'],
            'permisos.*' => ['integer', 'exists:permisos,id_permiso'],
        ]);

        $nuevoSet = $validado['permisos'] ?? [];
        $actuales = $rol->permisos()->pluck('permisos.id_permiso')->all();
        $agregados = array_diff($nuevoSet, $actuales);

        if ($agregados !== []) {
            $clavesFueraDeTecho = Permiso::query()
                ->whereIn('id_permiso', $agregados)
                ->get()
                ->reject(fn (Permiso $p) => $servicio->puedeOtorgar($actor, $p->clave))
                ->pluck('clave');

            if ($clavesFueraDeTecho->isNotEmpty()) {
                return $this->bloquearSinTecho($clavesFueraDeTecho->implode(', '));
            }
        }

        $rol->permisos()->sync($nuevoSet);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Permisos de «{$rol->nombre}» actualizados.",
        ]);

        return back();
    }

    private function esSuperAdmin(Rol $rol): bool
    {
        return $rol->nombre === PermisoService::ROL_SUPER_ADMIN;
    }

    private function bloquearSuperAdmin(): RedirectResponse
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => 'El rol «'.PermisoService::ROL_SUPER_ADMIN.'» ya tiene acceso completo por defecto; sus permisos no se pueden editar.',
        ]);

        return back();
    }

    private function bloquearFueraDeAlcance(): RedirectResponse
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => 'No puedes gestionar los permisos de ese rol.',
        ]);

        return back();
    }

    private function bloquearSinTecho(string $claves): RedirectResponse
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => "No puedes otorgar «{$claves}»: tú mismo no tienes ese permiso.",
        ]);

        return back();
    }
}
