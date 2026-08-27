<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * El registro público de clientes solo pide correo y contraseña (con verificación
 * por código); los datos de persona (nombres, documento, teléfono) se completan
 * después. `fk_persona` deja de ser obligatorio para permitir esa cuenta "mínima".
 * Se usa DB::statement (no Blueprint::change()) para no depender de doctrine/dbal.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE `clientes` MODIFY `fk_persona` int(11) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `clientes` MODIFY `fk_persona` int(11) NOT NULL');
    }
};
