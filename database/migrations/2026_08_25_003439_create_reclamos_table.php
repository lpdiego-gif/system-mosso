<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reclamos', function (Blueprint $table) {
            $table->increments('id_reclamo');

            // Sección 1: datos de la persona que reclama.
            $table->enum('tipo_documento', ['DNI', 'CE', 'Pasaporte']);
            $table->string('num_documento', 20);
            $table->string('nombres', 100);
            $table->string('apellido_paterno', 100);
            $table->string('apellido_materno', 100)->nullable();
            $table->string('email', 150);
            $table->enum('tipo_respuesta', ['correo_electronico'])->default('correo_electronico');
            $table->string('direccion', 150);
            $table->string('distrito', 100);
            $table->string('telefono', 20);

            // Sección 2: información general del reclamo.
            $table->enum('tienda_compra', ['fisica', 'online']);
            $table->decimal('monto_reclamado', 10, 2)->nullable();
            $table->enum('tipo_bien', ['producto', 'servicio']);
            $table->text('descripcion_bien');

            // Sección 3: detalle del reclamo o queja.
            $table->enum('tipo_atencion', ['reclamo', 'queja']);
            $table->text('detalle');
            $table->text('pedido');

            // Sección 4: apoderado, solo si quien reclama es menor de edad.
            $table->boolean('es_menor_edad')->default(false);
            $table->enum('apoderado_tipo_documento', ['DNI', 'CE', 'Pasaporte'])->nullable();
            $table->string('apoderado_num_documento', 20)->nullable();
            $table->string('apoderado_nombres', 150)->nullable();
            $table->string('apoderado_apellidos', 150)->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reclamos');
    }
};
