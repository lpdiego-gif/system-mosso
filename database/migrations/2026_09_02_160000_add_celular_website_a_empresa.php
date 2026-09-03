<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('empresa')) {
            return;
        }

        Schema::table('empresa', function (Blueprint $table) {
            if (! Schema::hasColumn('empresa', 'celular')) {
                $table->string('celular', 20)->nullable()->after('telefono');
            }
            if (! Schema::hasColumn('empresa', 'website')) {
                $table->string('website', 150)->nullable()->after('celular');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('empresa')) {
            return;
        }

        Schema::table('empresa', function (Blueprint $table) {
            foreach (['celular', 'website'] as $columna) {
                if (Schema::hasColumn('empresa', $columna)) {
                    $table->dropColumn($columna);
                }
            }
        });
    }
};
