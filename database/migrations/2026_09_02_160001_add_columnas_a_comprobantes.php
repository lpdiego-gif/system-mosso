<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `comprobantes` pasa de ser solo el registro de correlativo (serie/numero)
 * a guardar el snapshot inmutable de la emisión: los totales/monto en letras
 * que se usaron para armar el PDF/XML, y los campos de la fase de envío a
 * SUNAT (nullable — todavía no hay firma real ni envío, ver ComprobanteService
 * y MEMORIA_PROYECTO.md). `estado_sunat` default 'no_enviado' es el único
 * estado real que existe hoy.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('comprobantes')) {
            return;
        }

        Schema::table('comprobantes', function (Blueprint $table) {
            if (! Schema::hasColumn('comprobantes', 'moneda')) {
                $table->char('moneda', 3)->default('PEN')->after('numero');
            }
            if (! Schema::hasColumn('comprobantes', 'op_gravadas')) {
                $table->decimal('op_gravadas', 10, 2)->default(0)->after('fecha_emision');
            }
            if (! Schema::hasColumn('comprobantes', 'op_exoneradas')) {
                $table->decimal('op_exoneradas', 10, 2)->default(0)->after('op_gravadas');
            }
            if (! Schema::hasColumn('comprobantes', 'op_inafectas')) {
                $table->decimal('op_inafectas', 10, 2)->default(0)->after('op_exoneradas');
            }
            if (! Schema::hasColumn('comprobantes', 'descuento_global')) {
                $table->decimal('descuento_global', 10, 2)->default(0)->after('op_inafectas');
            }
            if (! Schema::hasColumn('comprobantes', 'igv')) {
                $table->decimal('igv', 10, 2)->default(0)->after('descuento_global');
            }
            if (! Schema::hasColumn('comprobantes', 'total')) {
                $table->decimal('total', 10, 2)->default(0)->after('igv');
            }
            if (! Schema::hasColumn('comprobantes', 'total_letras')) {
                $table->string('total_letras')->nullable()->after('total');
            }
            if (! Schema::hasColumn('comprobantes', 'xml_path')) {
                $table->string('xml_path')->nullable()->after('total_letras');
            }
            if (! Schema::hasColumn('comprobantes', 'hash')) {
                $table->string('hash', 100)->nullable()->after('xml_path');
            }
            if (! Schema::hasColumn('comprobantes', 'qr_data')) {
                $table->text('qr_data')->nullable()->after('hash');
            }
            if (! Schema::hasColumn('comprobantes', 'estado_sunat')) {
                $table->string('estado_sunat', 20)->nullable()->default('no_enviado')->after('qr_data');
            }
            if (! Schema::hasColumn('comprobantes', 'observacion_sunat')) {
                $table->string('observacion_sunat')->nullable()->after('estado_sunat');
            }
            if (! Schema::hasColumn('comprobantes', 'correo_enviado_en')) {
                $table->timestamp('correo_enviado_en')->nullable()->after('observacion_sunat');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('comprobantes')) {
            return;
        }

        Schema::table('comprobantes', function (Blueprint $table) {
            foreach ([
                'moneda', 'op_gravadas', 'op_exoneradas', 'op_inafectas', 'descuento_global',
                'igv', 'total', 'total_letras', 'xml_path', 'hash', 'qr_data',
                'estado_sunat', 'observacion_sunat', 'correo_enviado_en',
            ] as $columna) {
                if (Schema::hasColumn('comprobantes', $columna)) {
                    $table->dropColumn($columna);
                }
            }
        });
    }
};
