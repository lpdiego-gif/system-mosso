<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * El panel de control consulta directamente las tablas de negocio (productos,
     * trabajadores, pedidos, etc.), que se gestionan fuera de las migraciones de
     * Laravel (ver `base de datos/mosso.sql`). Para poder probar la ruta contra la
     * base de datos sqlite en memoria de los tests, se crean aquí versiones mínimas
     * de esas tablas.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('roles', function (Blueprint $table) {
            $table->id('id_rol');
            $table->string('nombre');
        });

        Schema::create('personas', function (Blueprint $table) {
            $table->id('id_persona');
            $table->string('nombres');
            $table->string('apellido_paterno');
        });

        Schema::create('clientes', function (Blueprint $table) {
            $table->id('id_cliente');
            $table->unsignedBigInteger('fk_persona')->nullable();
        });

        Schema::create('trabajadores', function (Blueprint $table) {
            $table->id('id_trabajador');
            $table->unsignedBigInteger('fk_rol');
            $table->boolean('activo')->default(true);
        });

        Schema::create('animales', function (Blueprint $table) {
            $table->id('id_animal');
            $table->string('nombre');
        });

        Schema::create('categorias', function (Blueprint $table) {
            $table->id('id_categoria');
            $table->unsignedBigInteger('fk_id_animal');
        });

        Schema::create('sub_categorias', function (Blueprint $table) {
            $table->id('id_subcategorias');
            $table->unsignedBigInteger('fk_id_categoria');
        });

        Schema::create('productos', function (Blueprint $table) {
            $table->id('id_producto');
            $table->string('sku');
            $table->string('nombre');
            $table->decimal('precio', 10, 2);
            $table->integer('stock')->default(0);
            $table->unsignedBigInteger('fk_estado');
            $table->unsignedBigInteger('fk_id_subcategorias')->nullable();
        });

        Schema::create('estados_pedido', function (Blueprint $table) {
            $table->id('id_estado_pedido');
            $table->string('nombre');
        });

        Schema::create('pedidos', function (Blueprint $table) {
            $table->id('id_pedido');
            $table->unsignedBigInteger('fk_cliente')->nullable();
            $table->unsignedBigInteger('fk_estado_pedido')->nullable();
            $table->decimal('total', 10, 2);
            $table->timestamp('fecha_pedido')->useCurrent();
        });

        Schema::create('pedido_detalle', function (Blueprint $table) {
            $table->id('id_pedido_detalle');
            $table->unsignedBigInteger('fk_pedido');
            $table->unsignedBigInteger('fk_producto');
            $table->integer('cantidad');
            $table->decimal('subtotal', 10, 2);
        });

        Schema::create('descuentos', function (Blueprint $table) {
            $table->id('id_descuento');
            $table->unsignedBigInteger('fk_producto');
            $table->string('tipo');
            $table->decimal('valor', 10, 2);
            $table->boolean('activo')->default(true);
            $table->dateTime('fecha_fin');
        });

        // Usada por HandleInertiaRequests para compartir el menú del portal en cada visita.
        Schema::create('menus', function (Blueprint $table) {
            $table->id('id_menu');
            $table->string('nombre');
            $table->string('tipo_enlace');
            $table->unsignedBigInteger('fk_animal')->nullable();
            $table->unsignedBigInteger('fk_tipo_animal')->nullable();
            $table->string('url')->nullable();
            $table->string('icono')->nullable();
            $table->integer('orden')->default(0);
            $table->boolean('destacado')->default(false);
            $table->boolean('activo')->default(true);
        });
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }
}
