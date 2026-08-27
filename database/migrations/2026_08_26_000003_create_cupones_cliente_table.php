<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cupones')) {
            return;
        }

        Schema::create('cupones', function (Blueprint $table) {
            $table->increments('id_cupon');
            $table->string('codigo', 30)->unique();
            $table->unsignedInteger('fk_cliente')->nullable();
            $table->unsignedInteger('fk_mascota')->nullable();
            $table->enum('origen', ['cumpleanos_mascota', 'bienvenida', 'promocion_manual']);
            $table->enum('tipo', ['descuento_porcentaje', 'descuento_monto', 'envio_gratis', 'producto_gratis', 'puntos_bonus']);
            $table->decimal('valor', 10, 2)->nullable();
            $table->unsignedInteger('fk_producto_regalo')->nullable();
            $table->timestamp('fecha_emision')->useCurrent();
            $table->date('fecha_vencimiento');
            $table->boolean('usado')->default(false);
            $table->unsignedInteger('fk_pedido_uso')->nullable();

            $table->foreign('fk_cliente')->references('id_cliente')->on('clientes')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupones');
    }
};
