<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Configuración flexible de "delivery gratis". En vez de dejar la regla fija en
 * el código (ej. `if subtotal >= 70`), el dueño define aquí: si la promoción
 * está activa, el monto mínimo de compra y, opcionalmente, una vigencia por
 * fechas. Los distritos que participan se listan en
 * `configuracion_delivery_distritos` (si no hay ninguno, aplica a todos).
 *
 * `fecha_inicio` / `fecha_fin` usan dateTime() y no timestamp() a propósito:
 * MariaDB le pone DEFAULT CURRENT_TIMESTAMP ON UPDATE a la primera columna
 * TIMESTAMP de la tabla, lo que pisaría el valor en cada UPDATE.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('configuracion_delivery')) {
            Schema::create('configuracion_delivery', function (Blueprint $table) {
                $table->increments('id_configuracion_delivery');
                $table->boolean('activo')->default(false);
                $table->decimal('monto_minimo', 10, 2)->default(0);
                $table->dateTime('fecha_inicio')->nullable();
                $table->dateTime('fecha_fin')->nullable();
                $table->string('descripcion', 120)->nullable();
                $table->timestamps();
            });
        }

        // Fila plantilla, inactiva: el dueño sólo tiene que ajustar los valores
        // y poner activo = 1 (por BD directa mientras no exista UI de admin).
        if (DB::table('configuracion_delivery')->count() === 0) {
            DB::table('configuracion_delivery')->insert([
                'activo' => false,
                'monto_minimo' => 0,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'descripcion' => 'Configuración inicial de delivery gratis (inactiva)',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_delivery');
    }
};
