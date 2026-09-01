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
 *
 * Usa `increments()`/`unsignedInteger()` (en vez de `id()`/`foreignId()`,
 * que generan BIGINT) porque las tablas del esquema de negocio (`clientes`,
 * `pedidos`, `pedido_detalle`) usan INT UNSIGNED — mismo criterio que
 * `mascotas`/`puntos_cliente`/`pagos`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('devoluciones')) {
            Schema::create('devoluciones', function (Blueprint $table) {
                $table->increments('id_devolucion');
                $table->unsignedInteger('fk_cliente');
                $table->unsignedInteger('fk_pedido');

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

                $table->foreign('fk_cliente')->references('id_cliente')->on('clientes')->onDelete('cascade');
                $table->foreign('fk_pedido')->references('id_pedido')->on('pedidos')->onDelete('cascade');

                $table->index(['fk_cliente', 'created_at']);
                $table->index('estado');
            });
        }

        if (! Schema::hasTable('devolucion_detalle')) {
            Schema::create('devolucion_detalle', function (Blueprint $table) {
                $table->increments('id_devolucion_detalle');
                $table->unsignedInteger('fk_devolucion');
                $table->unsignedInteger('fk_pedido_detalle');
                $table->unsignedInteger('cantidad');

                $table->foreign('fk_devolucion')->references('id_devolucion')->on('devoluciones')->onDelete('cascade');
                $table->foreign('fk_pedido_detalle')->references('id_pedido_detalle')->on('pedido_detalle')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('devolucion_detalle');
        Schema::dropIfExists('devoluciones');
    }
};
