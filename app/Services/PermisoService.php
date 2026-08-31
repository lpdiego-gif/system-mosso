<?php

namespace App\Services;

use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Autorización basada en roles/permisos (`roles`, `permisos`, `rol_permisos`,
 * ligados a `trabajadores`). El rol «Super Administrador» es el único con
 * bypass: siempre tiene todo, sin necesitar filas en `rol_permisos` — así el
 * catálogo de permisos puede crecer sin tener que mantenerlo sincronizado
 * para ese rol. Los demás roles (Administrador, Vendedor, Almacenero, y
 * cualquier otro que se agregue) dependen enteramente de lo que se les haya
 * asignado desde /admin/roles.
 *
 * Delegación con techo: además del Super Administrador, el rol
 * «Administrador» también puede entrar a /admin/roles, pero con dos límites
 * (ver `rolesGestionablesPor()` y `puedeOtorgar()`):
 *   1. Solo puede tocar los roles operativos de su equipo (Vendedor,
 *      Almacenero, y cualquier otro rol de staff que se agregue) — nunca a
 *      Super Administrador, a Cliente, ni a sí mismo.
 *   2. Solo puede OTORGAR permisos que él mismo ya tiene — nunca puede
 *      regalar algo que no posee. Quitarle un permiso a su equipo sí lo
 *      puede hacer siempre, tenga él ese permiso o no, porque reducir
 *      privilegios ajenos nunca es una escalada.
 *
 * Un usuario sin fila en `trabajadores` (p. ej. un cliente) nunca tiene
 * permisos — y, a propósito, ni siquiera se consultan `roles`/`permisos`/
 * `rol_permisos` en ese caso. Esto no es solo una optimización: como estas
 * claves se comparten en cada visita autenticada (`HandleInertiaRequests`),
 * el camino de "no es trabajador" tiene que quedar resuelto sin tocar esas
 * tablas para no romper flujos que son exclusivamente de cliente (checkout,
 * mi-cuenta, etc.).
 */
class PermisoService
{
    public const ROL_SUPER_ADMIN = 'Super Administrador';

    public const ROL_ADMINISTRADOR = 'Administrador';

    public const ROL_CLIENTE = 'Cliente';

    /** @var array<int, int|null> */
    private array $memoRolId = [];

    /** @var array<int, array<int, string>> */
    private array $memoClaves = [];

    /** @var array<int, string|null> */
    private array $memoNombreRol = [];

    public function esSuperAdmin(User $user): bool
    {
        return $this->nombreRolDe($user) === self::ROL_SUPER_ADMIN;
    }

    /**
     * Claves de permiso que este usuario tiene efectivamente. Un Super
     * Administrador recibe el catálogo completo (bypass); los demás,
     * exactamente lo asignado a su rol.
     *
     * @return array<int, string>
     */
    public function clavesDe(User $user): array
    {
        if (array_key_exists($user->id, $this->memoClaves)) {
            return $this->memoClaves[$user->id];
        }

        $idRol = $this->idRolDeTrabajador($user);

        if ($idRol === null) {
            return $this->memoClaves[$user->id] = [];
        }

        if ($this->esSuperAdmin($user)) {
            return $this->memoClaves[$user->id] = Permiso::query()->orderBy('clave')->pluck('clave')->all();
        }

        return $this->memoClaves[$user->id] = DB::table('rol_permisos')
            ->join('permisos', 'permisos.id_permiso', '=', 'rol_permisos.fk_permiso')
            ->where('rol_permisos.fk_rol', $idRol)
            ->orderBy('permisos.clave')
            ->pluck('permisos.clave')
            ->unique()
            ->values()
            ->all();
    }

    public function tiene(User $user, string $clave): bool
    {
        return in_array($clave, $this->clavesDe($user), true);
    }

    /**
     * ¿Puede entrar a /admin/roles? Super Administrador (todos los roles) o
     * Administrador (solo su equipo, ver `rolesGestionablesPor`).
     */
    public function puedeGestionarRoles(User $user): bool
    {
        return $this->esSuperAdmin($user) || $this->nombreRolDe($user) === self::ROL_ADMINISTRADOR;
    }

    /**
     * Roles cuyos permisos este usuario puede editar desde /admin/roles.
     * Super Administrador: todos. Administrador: su equipo operativo
     * (nunca Super Administrador, nunca Administrador —ni a sí mismo ni a
     * otro—, nunca Cliente). Cualquier otro: ninguno.
     */
    public function rolesGestionablesPor(User $user): Collection
    {
        if ($this->esSuperAdmin($user)) {
            return Rol::query()->orderBy('id_rol')->get();
        }

        if ($this->nombreRolDe($user) === self::ROL_ADMINISTRADOR) {
            return Rol::query()
                ->whereNotIn('nombre', [self::ROL_SUPER_ADMIN, self::ROL_ADMINISTRADOR, self::ROL_CLIENTE])
                ->orderBy('id_rol')
                ->get();
        }

        return collect();
    }

    /**
     * ¿Puede este usuario OTORGAR esta clave a otro rol? Un Super
     * Administrador puede otorgar cualquiera; cualquier otro (p. ej.
     * Administrador delegando a su equipo) solo puede otorgar lo que él
     * mismo ya tiene — nunca puede regalar un permiso que no posee.
     * Quitar un permiso (no otorgarlo) no pasa por aquí: eso siempre se
     * permite, ver `RolController`.
     */
    public function puedeOtorgar(User $user, string $clave): bool
    {
        return $this->esSuperAdmin($user) || $this->tiene($user, $clave);
    }

    private function nombreRolDe(User $user): ?string
    {
        if (array_key_exists($user->id, $this->memoNombreRol)) {
            return $this->memoNombreRol[$user->id];
        }

        $idRol = $this->idRolDeTrabajador($user);

        if ($idRol === null) {
            return $this->memoNombreRol[$user->id] = null;
        }

        return $this->memoNombreRol[$user->id] = DB::table('roles')->where('id_rol', $idRol)->value('nombre');
    }

    private function idRolDeTrabajador(User $user): ?int
    {
        if (array_key_exists($user->id, $this->memoRolId)) {
            return $this->memoRolId[$user->id];
        }

        return $this->memoRolId[$user->id] = DB::table('trabajadores')
            ->where('fk_user', $user->id)
            ->where('activo', true)
            ->value('fk_rol');
    }
}
