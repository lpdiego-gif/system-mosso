<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `tipo_documento` existía vacía (0 filas) a pesar de que `personas.fk_tipo_documento`
 * es NOT NULL y de que TrabajadorController::buscarDocumento() ya asume
 * "id_tipo_documento = 1 es DNI" en un comentario. La sembramos en ese mismo
 * orden para que ese supuesto se vuelva cierto y cualquier formulario que
 * cree una `persona` (Detalles de mi cuenta, alta de trabajador, etc.) tenga
 * opciones reales que elegir.
 */
return new class extends Migration
{
    public function up(): void
    {
        // `tipo_documento` es una tabla del dump externo; no existe en el sqlite
        // de los tests (que solo corre estas migraciones).
        if (! Schema::hasTable('tipo_documento') || DB::table('tipo_documento')->count() > 0) {
            return;
        }

        DB::table('tipo_documento')->insert([
            ['nombre' => 'DNI'],
            ['nombre' => 'CE'],
            ['nombre' => 'Pasaporte'],
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('tipo_documento')) {
            return;
        }

        DB::table('tipo_documento')->whereIn('nombre', ['DNI', 'CE', 'Pasaporte'])->delete();
    }
};
