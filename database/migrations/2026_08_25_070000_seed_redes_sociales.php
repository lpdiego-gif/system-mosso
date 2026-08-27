<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `redes_sociales` existía vacía (0 filas) aunque `servicio_redes.fk_red` la
 * referencia. La sembramos con las redes más comunes para que el formulario
 * de administración de Servicios tenga opciones reales que elegir, igual que
 * se hizo con `tipo_documento` en 2026_08_25_060000_seed_tipo_documento.
 */
return new class extends Migration
{
    public function up(): void
    {
        // `redes_sociales` es una tabla del dump externo; no existe en el sqlite
        // de los tests.
        if (! Schema::hasTable('redes_sociales') || DB::table('redes_sociales')->count() > 0) {
            return;
        }

        DB::table('redes_sociales')->insert([
            ['nombre' => 'Facebook'],
            ['nombre' => 'Instagram'],
            ['nombre' => 'TikTok'],
            ['nombre' => 'WhatsApp'],
            ['nombre' => 'YouTube'],
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('redes_sociales')) {
            return;
        }

        DB::table('redes_sociales')
            ->whereIn('nombre', ['Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'YouTube'])
            ->delete();
    }
};
