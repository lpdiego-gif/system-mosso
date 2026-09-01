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
 * `fk_cliente`/`fk_pedido`/`fk_pedido_detalle` van como `integer()` (con
 * signo, sin "unsigned") porque así están definidas `clientes.id_cliente`,
 * `pedidos.id_pedido` y `pedido_detalle.id_pedido_detalle` en el esquema de
 * negocio (confirmado con `SHOW CREATE TABLE clientes` — `int(11)` sin
 * `unsigned`, igual que usa `mascotas.fk_cliente`) — una FK debe tener
 * exactamente el mismo tipo que la columna referenciada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('devoluciones')) {
            Schema::create('devoluciones', function (Blueprint $table) {
                $table->increments('id_devolucion');
                $table->integer('fk_cliente');
                $table->integer('fk_pedido');

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
                $table->integer('fk_pedido_detalle');
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
