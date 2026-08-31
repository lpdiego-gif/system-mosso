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
        if (Schema::hasTable('permisos')) {
            return;
        }

        Schema::create('permisos', function (Blueprint $table) {
            $table->increments('id_permiso');
            $table->string('clave', 80)->unique();
            $table->string('descripcion', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permisos');
    }
};
