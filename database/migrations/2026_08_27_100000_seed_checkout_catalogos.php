<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Los catálogos que necesita el checkout (`tipo_entregas`, `tipo_comprobante`,
 * `estados_pedido`, `forma_pagos`) existían en el esquema pero estaban vacíos
 * (0 filas) en la base real. Se siembran con valores estándar para Perú.
 *
 * Idempotente: sólo inserta lo que falta (comparando por `nombre`), nunca
 * borra ni pisa filas existentes — si el negocio ya cargó sus propios valores
 * antes de correr esta migración, se respetan.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->sembrar('tipo_entregas', [
            ['nombre' => 'Envío a domicilio', 'requiere_direccion' => 1],
            ['nombre' => 'Retiro en tienda', 'requiere_direccion' => 0],
        ]);

        $this->sembrar('tipo_comprobante', [
            ['nombre' => 'Boleta'],
            ['nombre' => 'Factura'],
        ]);

        $this->sembrar('estados_pedido', [
            ['nombre' => 'Pendiente de pago'],
            ['nombre' => 'Pagado'],
            ['nombre' => 'En preparación'],
            ['nombre' => 'Enviado'],
            ['nombre' => 'Entregado'],
            ['nombre' => 'Cancelado'],
        ]);

        $this->sembrar('forma_pagos', [
            ['nombre' => 'Tarjeta (Culqi)'],
        ]);
    }

    public function down(): void
    {
        // No-op: no se borran catálogos por si ya hay pedidos que los referencian.
    }

    /**
     * @param  array<int, array<string, mixed>>  $filas
     */
    private function sembrar(string $tabla, array $filas): void
    {
        if (! Schema::hasTable($tabla)) {
            return;
        }

        foreach ($filas as $fila) {
            $existe = DB::table($tabla)->where('nombre', $fila['nombre'])->exists();

            if (! $existe) {
                DB::table($tabla)->insert($fila);
            }
        }
    }
};
