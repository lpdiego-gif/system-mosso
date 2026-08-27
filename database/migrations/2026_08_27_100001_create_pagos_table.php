<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La tabla `pagos` ya existe en la base de datos de negocio (creada fuera de
 * Laravel, igual que el resto del esquema histórico). Esta migración sólo la
 * crea cuando falta — para levantar un entorno nuevo desde cero y para la base
 * sqlite en memoria de los tests — sin chocar con la instalación real.
 *
 * Registra cada intento de cobro de un pedido. `id_transaccion_culqi` es UNIQUE
 * para que un webhook o un doble submit no procesen dos veces la misma
 * transacción de Culqi.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pagos')) {
            return;
        }

        Schema::create('pagos', function (Blueprint $table) {
            $table->increments('id_pago');
            $table->unsignedInteger('fk_pedido');
            $table->unsignedInteger('fk_forma_pago');
            $table->decimal('monto', 10, 2);
            $table->char('moneda', 3)->default('PEN');
            $table->enum('estado', ['pendiente', 'autorizado', 'pagado', 'fallido', 'reembolsado'])
                ->default('pendiente');
            $table->string('id_transaccion_culqi', 60)->nullable()->unique();
            $table->string('referencia', 100)->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->timestamps();

            $table->index('fk_pedido', 'fk_pagos_pedido_idx');
            $table->index('fk_forma_pago', 'fk_pagos_forma_pago_idx');
        });
    }

    public function down(): void
    {
        // No-op: la tabla es parte del esquema de negocio, no se elimina desde aquí.
    }
};
