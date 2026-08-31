<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ver `2026_08_31_080000_create_roles_table.php` para el porqué.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rol_permisos')) {
            return;
        }

        Schema::create('rol_permisos', function (Blueprint $table) {
            $table->unsignedInteger('fk_rol');
            $table->unsignedInteger('fk_permiso');

            $table->primary(['fk_rol', 'fk_permiso']);
            $table->foreign('fk_rol')->references('id_rol')->on('roles')->cascadeOnDelete();
            $table->foreign('fk_permiso')->references('id_permiso')->on('permisos')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rol_permisos');
    }
};
