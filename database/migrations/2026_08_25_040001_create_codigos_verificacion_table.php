<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Códigos de verificación de correo para el registro de clientes (2° paso del
 * registro: correo + contraseña -> código de 6 dígitos). Un registro por email,
 * igual que `password_reset_tokens`; reenviar un código simplemente reemplaza el
 * anterior (updateOrInsert).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('codigos_verificacion', function (Blueprint $table) {
            $table->string('email', 255)->primary();
            $table->string('codigo', 6);
            $table->unsignedTinyInteger('intentos')->default(0);
            // dateTime, no timestamp: MariaDB trata la 1ra columna TIMESTAMP de una tabla
            // como DEFAULT/ON UPDATE current_timestamp() implícito si no se especifica lo
            // contrario, lo que pisaba expira_en en cada UPDATE (ej. al incrementar intentos).
            $table->dateTime('expira_en');
            $table->dateTime('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codigos_verificacion');
    }
};
