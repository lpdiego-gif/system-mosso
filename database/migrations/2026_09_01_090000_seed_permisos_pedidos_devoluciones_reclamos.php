<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Permisos delegables para los nuevos apartados del panel admin: Pedidos,
 * Cambios y devoluciones, y Libro de reclamaciones. Sigue el mismo patrón
 * idempotente que 2026_08_31_090000_seed_permisos.php (solo inserta lo que
 * falte) y le da a "Administrador" el catálogo completo, igual que hace
 * 2026_08_31_100000_seed_rol_permisos_defaults.php con los permisos que ya
 * existían. A "Vendedor" se le da lectura/gestión de pedidos y devoluciones
 * (atención al cliente), pero no reclamos (queda para Administrador, por
 * ser un libro con implicancias legales/INDECOPI).
 */
return new class extends Migration
{
    public function up(): void
    {
        $permisos = [
            ['clave' => 'pedidos.ver', 'descripcion' => 'Ver el listado y detalle de pedidos'],
            ['clave' => 'pedidos.gestionar', 'descripcion' => 'Cambiar el estado de un pedido'],

            ['clave' => 'devoluciones.ver', 'descripcion' => 'Ver las solicitudes de cambio y devolución'],
            ['clave' => 'devoluciones.gestionar', 'descripcion' => 'Cambiar el estado de una solicitud de cambio o devolución'],

            ['clave' => 'reclamos.ver', 'descripcion' => 'Ver el libro de reclamaciones'],
            ['clave' => 'reclamos.gestionar', 'descripcion' => 'Cambiar el estado de un reclamo o queja'],
        ];

        foreach ($permisos as $permiso) {
            $existe = DB::table('permisos')->where('clave', $permiso['clave'])->exists();

            if (! $existe) {
                DB::table('permisos')->insert($permiso);
            }
        }

        $administrador = DB::table('roles')->where('nombre', 'Administrador')->value('id_rol');
        $vendedor = DB::table('roles')->where('nombre', 'Vendedor')->value('id_rol');

        if ($administrador) {
            $this->asignar($administrador, [
                'pedidos.ver', 'pedidos.gestionar',
                'devoluciones.ver', 'devoluciones.gestionar',
                'reclamos.ver', 'reclamos.gestionar',
            ]);
        }

        if ($vendedor) {
            $this->asignar($vendedor, [
                'pedidos.ver', 'pedidos.gestionar',
                'devoluciones.ver', 'devoluciones.gestionar',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('permisos')->whereIn('clave', [
            'pedidos.ver', 'pedidos.gestionar',
            'devoluciones.ver', 'devoluciones.gestionar',
            'reclamos.ver', 'reclamos.gestionar',
        ])->delete();
    }

    /**
     * @param  array<int, string>  $claves
     */
    private function asignar(int $idRol, array $claves): void
    {
        $idsPermisos = DB::table('permisos')->whereIn('clave', $claves)->pluck('id_permiso');

        foreach ($idsPermisos as $idPermiso) {
            DB::table('rol_permisos')->insertOrIgnore([
                'fk_rol' => $idRol,
                'fk_permiso' => $idPermiso,
            ]);
        }
    }
};
