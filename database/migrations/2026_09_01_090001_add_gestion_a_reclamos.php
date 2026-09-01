<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `reclamos` solo guardaba lo que llega del formulario público (Ley N°
 * 29571). Para poder gestionarlo desde /admin/reclamos se agregan columnas
 * de seguimiento interno; no tocan la validación del formulario público.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('reclamos', 'estado')) {
            Schema::table('reclamos', function (Blueprint $table) {
                $table->enum('estado', ['pendiente', 'en_proceso', 'resuelto'])
                    ->default('pendiente')
                    ->after('pedido');
                $table->text('nota_admin')->nullable()->after('estado');
                $table->timestamp('atendido_en')->nullable()->after('nota_admin');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('reclamos', 'estado')) {
            Schema::table('reclamos', function (Blueprint $table) {
                $table->dropColumn(['estado', 'nota_admin', 'atendido_en']);
            });
        }
    }
};
