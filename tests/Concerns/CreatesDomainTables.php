<?php

namespace Tests\Concerns;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El esquema de negocio de MOSSO vive en un dump externo (`base de datos/
 * mosso.sql`), no en migraciones, así que no existe en el sqlite en memoria de
 * los tests. Este trait crea las versiones mínimas que necesita el ciclo de
 * request de casi cualquier página autenticada:
 *
 *  - `menus` + `empresa`/`direcciones`/`distritos`: HandleInertiaRequests los
 *    consulta (props compartidos `menu` y `empresa`) en CADA respuesta Inertia
 *    completa, aunque el test no toque el mega menú ni el footer.
 *  - `trabajadores` / `clientes`: todo login pasa por CuentaService::tipoDe()
 *    para decidir el redirect y para gatear la 2FA. `clientes` vacía además
 *    evita que CarritoService (otro prop compartido) toque `carritos`.
 *
 * Es el mismo patrón que ya usa DashboardTest, extraído para reutilizarlo.
 */
trait CreatesDomainTables
{
    protected function createDomainTables(): void
    {
        if (! Schema::hasTable('empresa')) {
            Schema::create('empresa', function (Blueprint $table) {
                $table->id('id_empresa');
                $table->string('nombre_comercial')->nullable();
                $table->string('logo')->nullable();
                $table->string('correo')->nullable();
                $table->string('telefono')->nullable();
                $table->unsignedBigInteger('fk_direccion')->nullable();
            });
        }

        if (! Schema::hasTable('distritos')) {
            Schema::create('distritos', function (Blueprint $table) {
                $table->id('id_distrito');
                $table->string('nombre')->nullable();
                $table->unsignedBigInteger('fk_provincia')->nullable();
            });
        }

        if (! Schema::hasTable('direcciones')) {
            Schema::create('direcciones', function (Blueprint $table) {
                $table->id('id_direccion');
                $table->string('direccion')->nullable();
                $table->unsignedBigInteger('fk_distrito')->nullable();
            });
        }

        if (! Schema::hasTable('menus')) {
            Schema::create('menus', function (Blueprint $table) {
                $table->id('id_menu');
                $table->string('nombre')->nullable();
                $table->string('icono')->nullable();
                $table->string('tipo_enlace')->nullable();
                $table->unsignedBigInteger('fk_animal')->nullable();
                $table->unsignedBigInteger('fk_tipo_animal')->nullable();
                $table->string('url')->nullable();
                $table->integer('orden')->default(0);
                $table->boolean('destacado')->default(false);
                $table->boolean('activo')->default(true);
            });
        }

        if (! Schema::hasTable('trabajadores')) {
            Schema::create('trabajadores', function (Blueprint $table) {
                $table->id('id_trabajador');
                $table->unsignedBigInteger('fk_user')->nullable();
                $table->unsignedBigInteger('fk_rol')->nullable();
                $table->boolean('activo')->default(true);
            });
        }

        if (! Schema::hasTable('clientes')) {
            Schema::create('clientes', function (Blueprint $table) {
                $table->id('id_cliente');
                $table->unsignedBigInteger('fk_persona')->nullable();
                $table->unsignedBigInteger('fk_user')->nullable();
                $table->string('correo')->nullable();
                $table->timestamps();
            });
        }
    }
}
