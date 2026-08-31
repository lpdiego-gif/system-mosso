<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo inicial de permisos DELEGABLES desde /admin/roles. La tabla
 * `permisos` ya existe (viene del dump `mosso.sql`, junto con `roles` y el
 * pivote `rol_permisos`), pero llegó vacía — esta migración la puebla con
 * una clave por módulo/acción (`modulo.accion`) para que la pantalla de
 * Roles y Permisos tenga algo que asignar. Idempotente: solo inserta las
 * `clave` que falten, así se puede correr de nuevo sin duplicar filas.
 *
 * Roles y Permisos, Menú del portal, Menú de Mi Cuenta y Funciones NO están
 * aquí a propósito: esas cuatro pantallas son exclusivas del Super
 * Administrador (`super_admin` middleware, ver EnsureSuperAdmin), nunca se
 * delegan a los demás roles, así que no tiene sentido que aparezcan como
 * interruptores en la matriz.
 */
return new class extends Migration
{
    public function up(): void
    {
        $permisos = [
            ['clave' => 'dashboard.ver', 'descripcion' => 'Ver el panel de control'],

            ['clave' => 'productos.ver', 'descripcion' => 'Ver el catálogo de productos'],
            ['clave' => 'productos.crear', 'descripcion' => 'Crear productos nuevos'],
            ['clave' => 'productos.editar', 'descripcion' => 'Editar productos existentes'],
            ['clave' => 'productos.eliminar', 'descripcion' => 'Eliminar productos'],

            ['clave' => 'clientes.ver', 'descripcion' => 'Ver el listado de clientes'],
            ['clave' => 'clientes.crear', 'descripcion' => 'Registrar clientes nuevos'],
            ['clave' => 'clientes.editar', 'descripcion' => 'Editar datos de clientes'],
            ['clave' => 'clientes.eliminar', 'descripcion' => 'Eliminar clientes'],

            ['clave' => 'servicios.ver', 'descripcion' => 'Ver el catálogo de servicios'],
            ['clave' => 'servicios.crear', 'descripcion' => 'Crear servicios nuevos'],
            ['clave' => 'servicios.editar', 'descripcion' => 'Editar servicios existentes'],
            ['clave' => 'servicios.eliminar', 'descripcion' => 'Eliminar servicios'],

            ['clave' => 'empresa.ver', 'descripcion' => 'Ver los datos de la empresa'],
            ['clave' => 'empresa.editar', 'descripcion' => 'Editar los datos de la empresa'],

            ['clave' => 'trabajadores.ver', 'descripcion' => 'Ver el listado de trabajadores'],
            ['clave' => 'trabajadores.crear', 'descripcion' => 'Registrar trabajadores nuevos'],
            ['clave' => 'trabajadores.editar', 'descripcion' => 'Editar datos de trabajadores'],
            ['clave' => 'trabajadores.eliminar', 'descripcion' => 'Eliminar trabajadores'],

            ['clave' => 'distritos.ver', 'descripcion' => 'Ver departamentos, provincias y distritos'],
            ['clave' => 'distritos.crear', 'descripcion' => 'Registrar distritos nuevos'],
            ['clave' => 'distritos.editar', 'descripcion' => 'Editar distritos existentes'],
            ['clave' => 'distritos.eliminar', 'descripcion' => 'Eliminar distritos'],
        ];

        foreach ($permisos as $permiso) {
            $existe = DB::table('permisos')->where('clave', $permiso['clave'])->exists();

            if (! $existe) {
                DB::table('permisos')->insert($permiso);
            }
        }
    }

    public function down(): void
    {
        DB::table('permisos')->whereIn('clave', [
            'dashboard.ver',
            'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
            'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar',
            'servicios.ver', 'servicios.crear', 'servicios.editar', 'servicios.eliminar',
            'empresa.ver', 'empresa.editar',
            'trabajadores.ver', 'trabajadores.crear', 'trabajadores.editar', 'trabajadores.eliminar',
            'distritos.ver', 'distritos.crear', 'distritos.editar', 'distritos.eliminar',
        ])->delete();
    }
};
