<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ver `2026_08_31_080000_create_roles_table.php` para el porqué. Sin claves
 * foráneas hacia `personas`/`direcciones`: esas tablas tampoco tienen
 * migración propia (llegan solo por `mosso.sql`) y no hace falta reproducir
 * todo ese grafo aquí — `PermisoService` y los tests solo necesitan que
 * `trabajadores` exista y enlace `fk_user` con `fk_rol`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('trabajadores')) {
            return;
        }

        Schema::create('trabajadores', function (Blueprint $table) {
            $table->increments('id_trabajador');
            $table->unsignedInteger('fk_persona');
            $table->foreignId('fk_user')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('fk_rol');
            $table->unsignedInteger('fk_direccion')->nullable();
            $table->date('fecha_ingreso');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('fk_rol')->references('id_rol')->on('roles');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trabajadores');
    }
};
