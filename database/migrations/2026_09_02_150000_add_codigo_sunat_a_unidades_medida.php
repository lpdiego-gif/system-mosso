<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Preparación del modelo de datos para la futura facturación electrónica
 * (SUNAT): `unidades_medida` gana `codigo_sunat`, el código de unidad de
 * medida del Catálogo N°03 de SUNAT (UN/ECE Rec. 20) que el generador de XML
 * de comprobantes va a necesitar más adelante. Esta migración SOLO agrega la
 * columna y hace el backfill de las filas ya existentes — no construye nada
 * de SUNAT/XML todavía.
 *
 * Mapeo por nombre (ver también el mapa dentro de `up()`): cualquier unidad
 * que no matcheara con claridad quedó en 'NIU' (código genérico de "unidad")
 * en vez de inventarse un código — quedan listadas en el mensaje de consola
 * para que el usuario las revise a mano si corresponde un código más
 * específico.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('unidades_medida')) {
            return;
        }

        if (! Schema::hasColumn('unidades_medida', 'codigo_sunat')) {
            Schema::table('unidades_medida', function (Blueprint $table) {
                $table->string('codigo_sunat', 3)->nullable()->after('abreviatura');
            });
        }

        // Catálogo N°03 SUNAT (UN/ECE Rec. 20), mapeo por nombre en minúsculas.
        $mapa = [
            'unidad' => 'NIU',
            'und' => 'NIU',
            'kilogramo' => 'KGM',
            'kg' => 'KGM',
            'gramo' => 'GRM',
            'litro' => 'LTR',
            'mililitro' => 'MLT',
            'caja' => 'BX',
            'paquete' => 'PK',
            'pack' => 'PK',
            'bolsa' => 'BG',
            'saco' => 'BG',
            'docena' => 'DZN',
            'ciento' => 'CEN',
            'metro' => 'MTR',
            'par' => 'PR',
            'set' => 'SET',
            'juego' => 'SET',
        ];

        $sinMatch = [];

        foreach (DB::table('unidades_medida')->whereNull('codigo_sunat')->get() as $unidad) {
            $clave = mb_strtolower(trim($unidad->nombre), 'UTF-8');
            $codigo = $mapa[$clave] ?? 'NIU';

            if (! isset($mapa[$clave])) {
                $sinMatch[] = $unidad->nombre;
            }

            DB::table('unidades_medida')->where('id_unidad_medida', $unidad->id_unidad_medida)->update([
                'codigo_sunat' => $codigo,
            ]);
        }

        if ($sinMatch !== []) {
            $lista = implode(', ', $sinMatch);
            $mensaje = "add_codigo_sunat_a_unidades_medida: unidades sin match claro en el Catálogo N°03 de SUNAT, quedaron en 'NIU' por defecto — revisar a mano si corresponde un código más específico: {$lista}";

            if (app()->runningInConsole()) {
                fwrite(STDOUT, $mensaje.PHP_EOL);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('unidades_medida') && Schema::hasColumn('unidades_medida', 'codigo_sunat')) {
            Schema::table('unidades_medida', function (Blueprint $table) {
                $table->dropColumn('codigo_sunat');
            });
        }
    }
};
