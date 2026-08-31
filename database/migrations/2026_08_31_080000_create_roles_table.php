<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `roles`, `permisos`, `rol_permisos` y `trabajadores` (ver las tres
 * migraciones siguientes) nunca tuvieron migración propia — llegaron al
 * proyecto vía `mosso.sql`, igual que `productos`, `clientes`, etc. Con el
 * sistema de Roles y Permisos (`/admin/roles`, `PermisoService`) apoyándose
 * en ellas, y con `RefreshDatabase` en los tests corriendo solo migraciones
 * (nunca el dump), estas tablas se vuelven necesarias en cualquier entorno
 * limpio — no solo en la base de datos de desarrollo importada. El guard
 * `Schema::hasTable` hace que esto sea un no-op donde el dump ya las creó.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('roles')) {
            return;
        }

        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id_rol');
            $table->string('nombre', 50)->unique();
            $table->string('descripcion', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
