<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Feature flags para la entrega por fases del proyecto: en vez de un rol de
 * superadmin que controle qué está habilitado, cada módulo grande (Puntos y
 * cupones, Mascotas, Servicios, y lo que se vaya agregando) tiene aquí un
 * interruptor propio. Mientras `activo=0`, el middleware `feature:<clave>`
 * bloquea el acceso directo a esas rutas y los menús (`menu_cuenta`/`menus`)
 * dejan de mostrar esos ítems aunque estén marcados como activos ahí —
 * `funciones` manda por encima como interruptor maestro.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('funciones')) {
            return;
        }

        Schema::create('funciones', function (Blueprint $table) {
            $table->increments('id_funcion');
            $table->string('clave', 50)->unique();
            $table->string('nombre', 100);
            $table->string('descripcion', 255)->nullable();
            $table->boolean('activo')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funciones');
    }
};
