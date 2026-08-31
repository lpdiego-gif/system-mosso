<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `roles.*`, `menus.*`, `menu_cuenta.*` y `funciones.*` dejaron de ser
 * permisos delegables: esas cuatro pantallas (Roles y Permisos, Menú del
 * portal, Menú de Mi Cuenta, Funciones) ahora las protege el middleware
 * `super_admin` directamente (ver EnsureSuperAdmin), no `permiso:<clave>`.
 * No tendría sentido dejarlas en el catálogo de /admin/roles: nadie más que
 * el Super Administrador puede tenerlas, así que un interruptor que nunca
 * se puede prender solo confundiría. Al borrar estas filas de `permisos`,
 * `rol_permisos` se limpia en cascada (ver
 * `2026_08_31_080002_create_rol_permisos_table.php`) — por ejemplo, quita
 * el `roles.ver`/`roles.editar` que el rol Administrador tenía de más
 * desde el reparto de permisos por defecto.
 */
return new class extends Migration
{
    private const CLAVES = [
        'roles.ver', 'roles.editar',
        'menus.ver', 'menus.crear', 'menus.editar', 'menus.eliminar',
        'menu_cuenta.ver', 'menu_cuenta.crear', 'menu_cuenta.editar', 'menu_cuenta.eliminar',
        'funciones.ver', 'funciones.editar',
    ];

    public function up(): void
    {
        DB::table('permisos')->whereIn('clave', self::CLAVES)->delete();
    }

    public function down(): void
    {
        $permisos = array_map(fn (string $clave) => ['clave' => $clave, 'descripcion' => null], self::CLAVES);

        foreach ($permisos as $permiso) {
            if (! DB::table('permisos')->where('clave', $permiso['clave'])->exists()) {
                DB::table('permisos')->insert($permiso);
            }
        }
    }
};
