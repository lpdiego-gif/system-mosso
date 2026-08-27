<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('puntos_cliente')) {
            return;
        }

        Schema::create('puntos_cliente', function (Blueprint $table) {
            $table->increments('id_punto');
            $table->unsignedInteger('fk_cliente');
            $table->unsignedInteger('fk_pedido')->nullable();
            $table->enum('tipo', ['acumulacion', 'canje_descuento', 'canje_producto', 'vencimiento']);
            $table->integer('monto');
            $table->timestamp('fecha')->useCurrent();
            $table->date('fecha_vencimiento')->nullable();
            $table->string('descripcion', 255)->nullable();

            $table->foreign('fk_cliente')->references('id_cliente')->on('clientes')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puntos_cliente');
    }
};
