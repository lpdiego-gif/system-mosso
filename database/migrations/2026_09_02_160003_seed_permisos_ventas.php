<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Permisos del apartado admin "Ventas" (comprobantes electrónicos). Mismo
 * patrón idempotente que 2026_09_01_090000_seed_permisos_pedidos_devoluciones_reclamos.
 * "Vendedor" ya gestiona pedidos, así que también ve/gestiona sus comprobantes
 * (reenviar por correo); las acciones SUNAT de fase futura (firma real, envío,
 * anulación) quedarán detrás del mismo `ventas.gestionar` cuando existan.
 */
return new class extends Migration
{
    public function up(): void
    {
        $permisos = [
            ['clave' => 'ventas.ver', 'descripcion' => 'Ver el listado y detalle de comprobantes (Ventas)'],
            ['clave' => 'ventas.gestionar', 'descripcion' => 'Reenviar comprobantes y gestionar su envío a SUNAT'],
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
            $this->asignar($administrador, ['ventas.ver', 'ventas.gestionar']);
        }

        if ($vendedor) {
            $this->asignar($vendedor, ['ventas.ver', 'ventas.gestionar']);
        }
    }

    public function down(): void
    {
        DB::table('permisos')->whereIn('clave', ['ventas.ver', 'ventas.gestionar'])->delete();
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
