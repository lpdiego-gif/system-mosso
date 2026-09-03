<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cuentas bancarias de la empresa, mostradas en el PDF del comprobante para
 * que el cliente pueda transferir/depositar. Tabla de negocio nueva -> se crea
 * con migración Laravel (patrón seguido desde `reclamos`, no dump manual).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cuentas_bancarias')) {
            return;
        }

        Schema::create('cuentas_bancarias', function (Blueprint $table) {
            $table->id('id_cuenta_bancaria');
            // `empresa.id_empresa` es `int(11)` con signo (no unsigned) -- hay que
            // matchear el tipo exacto o el FK falla con errno 150.
            $table->integer('fk_empresa');
            $table->string('banco', 60);
            $table->char('moneda', 3);
            $table->string('tipo_cuenta', 30);
            $table->string('numero_cuenta', 30);
            $table->string('cci', 30)->nullable();
            $table->string('titular', 150)->nullable();
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();

            if (Schema::hasTable('empresa')) {
                $table->foreign('fk_empresa')->references('id_empresa')->on('empresa')->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas_bancarias');
    }
};
