<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Antes de esta entrega, cualquier trabajador autenticado (`auth` a secas)
 * podía entrar a cualquier ruta de /admin — no existía enforcement real por
 * rol. Para que activar el sistema de permisos (`permiso:<clave>` en
 * routes/web.php) no le quite el acceso de golpe a nadie, esta migración le
 * da a cada rol existente un punto de partida razonable, según lo que
 * describe su propia fila en `roles`:
 *
 * - Administrador: el catálogo completo (preserva el acceso total que ya
 *   tenía de facto). A diferencia de «Super Administrador», estos SÍ quedan
 *   guardados como filas en `rol_permisos` — el Super Administrador puede
 *   editarlos/reducirlos después desde /admin/roles.
 * - Vendedor: lo relacionado a ventas, clientes y catálogo (sin eliminar,
 *   sin empresa/trabajadores/menús/funciones/roles).
 * - Almacenero: control de productos (incluye eliminar, por el manejo de
 *   inventario) y lectura del resto de catálogos de apoyo.
 * - Cliente y «Super Administrador» no reciben filas aquí: Cliente no usa
 *   /admin, y Super Administrador tiene bypass total en PermisoService sin
 *   necesitar datos en `rol_permisos`.
 *
 * Idempotente: usa INSERT IGNORE sobre la clave primaria compuesta
 * (fk_rol, fk_permiso), así que correrla de nuevo no duplica nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        $administrador = DB::table('roles')->where('nombre', 'Administrador')->value('id_rol');
        $vendedor = DB::table('roles')->where('nombre', 'Vendedor')->value('id_rol');
        $almacenero = DB::table('roles')->where('nombre', 'Almacenero')->value('id_rol');

        if ($administrador) {
            $this->asignarTodo($administrador);
        }

        if ($vendedor) {
            $this->asignar($vendedor, [
                'dashboard.ver',
                'clientes.ver', 'clientes.crear', 'clientes.editar',
                'productos.ver',
                'servicios.ver',
                'distritos.ver',
            ]);
        }

        if ($almacenero) {
            $this->asignar($almacenero, [
                'dashboard.ver',
                'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
                'distritos.ver',
            ]);
        }
    }

    public function down(): void
    {
        // Intencionalmente no revierte: quitar estas filas dejaría a
        // Administrador/Vendedor/Almacenero sin ningún permiso, que es
        // exactamente el bloqueo que esta migración existe para evitar.
    }

    private function asignarTodo(int $idRol): void
    {
        $this->asignar($idRol, DB::table('permisos')->pluck('clave')->all());
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
