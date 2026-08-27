<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mascotas')) {
            return;
        }

        Schema::create('mascotas', function (Blueprint $table) {
            $table->increments('id_mascota');
            $table->unsignedInteger('fk_cliente');
            $table->string('nombre', 60);
            $table->unsignedInteger('fk_animal');
            $table->date('fecha_nacimiento')->nullable();
            $table->year('ultimo_anio_cumple_premiado')->nullable();
            $table->timestamp('created_at')->useCurrent()->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate()->nullable();

            $table->foreign('fk_cliente')->references('id_cliente')->on('clientes')->onDelete('cascade');
            $table->foreign('fk_animal')->references('id_animal')->on('animales')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mascotas');
    }
};
