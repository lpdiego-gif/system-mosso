<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega el estado "Devuelto" a `estados_pedido`. Hasta ahora, un pedido con
 * una devolución completada se quedaba marcado como "Entregado" para
 * siempre -- el estado real de la devolución solo vivía en `devoluciones`
 * (ver Admin\DevolucionController::actualizarEstado, que ahora sincroniza
 * el pedido cuando `tipo = 'devolucion'` y `estado = 'completada'`).
 *
 * Idempotente, mismo patrón que 2026_08_27_100000_seed_checkout_catalogos.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('estados_pedido')) {
            return;
        }

        $existe = DB::table('estados_pedido')->where('nombre', 'Devuelto')->exists();

        if (! $existe) {
            DB::table('estados_pedido')->insert(['nombre' => 'Devuelto']);
        }
    }

    public function down(): void
    {
        // No-op: no se borra el catálogo por si ya hay pedidos que lo referencian.
    }
};
