<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo geográfico por UBIGEO (INEI): `departamentos`/`provincias`/`distritos`
 * ganan una columna `ubigeo` (siempre texto — un entero perdería los ceros
 * iniciales, ej. departamento "01"). `distritos` gana además `activo`: la
 * tabla pasa a ser el catálogo NACIONAL completo (~1891 filas, ver
 * `UbigeoSeeder`), y solo los distritos con `activo = 1` son zonas de reparto
 * seleccionables en el checkout (ver `ZonasEnvioService`).
 *
 * Las columnas van NULLABLE a nivel de BD (no NOT NULL): agregar NOT NULL de
 * entrada rompería contra las filas ya existentes antes de correr el seeder.
 * En la práctica, tras `UbigeoSeeder` quedan 100% pobladas — la garantía de
 * "siempre texto, nunca null" la sostiene el seeder, no una constraint dura.
 * El índice UNIQUE sí aplica desde ya (MySQL/SQLite permiten múltiples NULL
 * en una columna UNIQUE, así que no choca con las filas todavía sin ubigeo).
 *
 * GOTCHA descubierto acá: `distritos.costo_envio` en `mosso2` es
 * `NOT NULL DEFAULT 0.00`, no nullable como se asumía. La semántica nueva
 * (NULL = nunca configurado, 0 = envío gratis) necesita que sí lo sea, así
 * que esta migración también la vuelve nullable sin default.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('departamentos') && ! Schema::hasColumn('departamentos', 'ubigeo')) {
            Schema::table('departamentos', function (Blueprint $table) {
                $table->string('ubigeo', 2)->nullable()->unique()->after('nombre');
            });
        }

        if (Schema::hasTable('provincias') && ! Schema::hasColumn('provincias', 'ubigeo')) {
            Schema::table('provincias', function (Blueprint $table) {
                $table->string('ubigeo', 4)->nullable()->unique()->after('nombre');
            });
        }

        if (Schema::hasTable('distritos')) {
            Schema::table('distritos', function (Blueprint $table) {
                if (! Schema::hasColumn('distritos', 'ubigeo')) {
                    $table->string('ubigeo', 6)->nullable()->unique()->after('nombre');
                }
                if (! Schema::hasColumn('distritos', 'activo')) {
                    $table->boolean('activo')->default(false)->after('costo_envio');
                }
            });

            // Fuera de sqlite (los tests recrean su propio esquema con `costo_envio`
            // ya nullable, ver CheckoutTest): en mosso2 hay que aflojar el NOT NULL.
            if (DB::getDriverName() !== 'sqlite') {
                Schema::table('distritos', function (Blueprint $table) {
                    $table->decimal('costo_envio', 8, 2)->nullable()->default(null)->change();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('departamentos') && Schema::hasColumn('departamentos', 'ubigeo')) {
            Schema::table('departamentos', fn (Blueprint $table) => $table->dropColumn('ubigeo'));
        }

        if (Schema::hasTable('provincias') && Schema::hasColumn('provincias', 'ubigeo')) {
            Schema::table('provincias', fn (Blueprint $table) => $table->dropColumn('ubigeo'));
        }

        if (Schema::hasTable('distritos')) {
            Schema::table('distritos', function (Blueprint $table) {
                if (Schema::hasColumn('distritos', 'ubigeo')) {
                    $table->dropColumn('ubigeo');
                }
                if (Schema::hasColumn('distritos', 'activo')) {
                    $table->dropColumn('activo');
                }
            });
        }
    }
};
