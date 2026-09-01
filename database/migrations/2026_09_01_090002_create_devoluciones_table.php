<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Solicitudes de cambio/devolución hechas por el cliente desde
 * "Cambios y devoluciones" (footer del Portal Web). Se piden datos típicos
 * de este tipo de formularios: pedido de origen, tipo de solicitud, motivo,
 * detalle y un dato de contacto para coordinar. No hay un modelo previo de
 * referencia en el proyecto — tabla creada de cero.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('devoluciones')) {
            Schema::create('devoluciones', function (Blueprint $table) {
                $table->id('id_devolucion');
                $table->foreignId('fk_cliente')->constrained('clientes', 'id_cliente')->cascadeOnDelete();
                $table->foreignId('fk_pedido')->constrained('pedidos', 'id_pedido')->cascadeOnDelete();

                $table->enum('tipo', ['cambio', 'devolucion']);
                $table->enum('motivo', [
                    'producto_defectuoso',
                    'producto_dañado',
                    'no_es_lo_que_pedi',
                    'talla_o_tamaño_incorrecto',
                    'llego_incompleto',
                    'ya_no_lo_necesito',
                    'otro',
                ]);
                $table->text('detalle');

                $table->string('telefono_contacto', 20);
                $table->string('email_contacto', 150)->nullable();

                $table->enum('estado', ['pendiente', 'en_revision', 'aprobada', 'rechazada', 'completada'])
                    ->default('pendiente');
                $table->text('nota_admin')->nullable();
                $table->timestamp('atendido_en')->nullable();

                $table->timestamps();

                $table->index(['fk_cliente', 'created_at']);
                $table->index('estado');
            });
        }

        if (! Schema::hasTable('devolucion_detalle')) {
            Schema::create('devolucion_detalle', function (Blueprint $table) {
                $table->id('id_devolucion_detalle');
                $table->foreignId('fk_devolucion')->constrained('devoluciones', 'id_devolucion')->cascadeOnDelete();
                $table->foreignId('fk_pedido_detalle')->constrained('pedido_detalle', 'id_pedido_detalle')->cascadeOnDelete();
                $table->unsignedInteger('cantidad');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('devolucion_detalle');
        Schema::dropIfExists('devoluciones');
    }
};
