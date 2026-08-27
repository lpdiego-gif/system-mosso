<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Distritos que participan en una configuración de delivery gratis. Si una
 * `configuracion_delivery` no tiene ninguna fila aquí, la promoción aplica a
 * todos los distritos; si tiene filas, sólo a esos.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('configuracion_delivery_distritos')) {
            return;
        }

        Schema::create('configuracion_delivery_distritos', function (Blueprint $table) {
            $table->increments('id_configuracion_delivery_distrito');
            $table->unsignedInteger('fk_configuracion_delivery');
            $table->unsignedInteger('fk_distrito');

            $table->unique(
                ['fk_configuracion_delivery', 'fk_distrito'],
                'config_delivery_distrito_unique'
            );
            $table->index('fk_distrito', 'fk_config_delivery_distrito_distrito_idx');

            $table->foreign('fk_configuracion_delivery', 'fk_config_delivery_distrito_config')
                ->references('id_configuracion_delivery')
                ->on('configuracion_delivery')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_delivery_distritos');
    }
};
