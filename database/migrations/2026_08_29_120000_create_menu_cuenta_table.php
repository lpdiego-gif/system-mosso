<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menú configurable del panel "Mi Cuenta" del cliente (pestañas de arriba +
 * tarjetas de "Accesos rápidos"), calcado del mismo patrón que la tabla
 * `menus` usa para el header público.
 *
 * `tipo` distingue dos clases de ítem:
 *  - 'seccion_interna': una de las secciones reales ya programadas (Pedidos,
 *    Direcciones, Mascotas, Puntos y cupones, Detalles). `clave` identifica
 *    cuál — el frontend mapea esa clave a su página real, así que el admin
 *    solo puede reordenar/ocultar/renombrar, nunca "inventar" una sección sin
 *    código detrás.
 *  - 'url': un enlace libre (ayuda, términos, etc.) sin necesidad de código
 *    nuevo. Usa `url` en vez de `clave`.
 *
 * `clave` es UNIQUE (ignorando NULLs, comportamiento estándar de MySQL/MariaDB)
 * para que no puedan existir dos ítems de la misma sección interna a la vez.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('menu_cuenta')) {
            return;
        }

        Schema::create('menu_cuenta', function (Blueprint $table) {
            $table->increments('id_menu_cuenta');
            $table->enum('tipo', ['seccion_interna', 'url']);
            $table->string('clave', 50)->nullable()->unique();
            $table->string('nombre', 100);
            $table->string('descripcion', 150)->nullable();
            $table->string('icono', 50)->nullable();
            $table->string('url', 255)->nullable();
            $table->unsignedInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_cuenta');
    }
};
