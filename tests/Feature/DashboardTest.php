<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
     * de esas tablas. `roles` y `trabajadores` ya las crean las migraciones
     * (`2026_08_31_08000{0,3}_create_*_table.php`), así que no se recrean aquí.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('personas', function (Blueprint $table) {
            $table->id('id_persona');
            $table->string('nombres');
            $table->string('apellido_paterno');
        });

        Schema::create('clientes', function (Blueprint $table) {
            $table->id('id_cliente');
            $table->unsignedBigInteger('fk_persona')->nullable();
            $table->string('razon_social')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('animales', function (Blueprint $table) {
            $table->id('id_animal');
            $table->string('nombre');
        });

        Schema::create('categorias', function (Blueprint $table) {
            $table->id('id_categoria');
            $table->string('nombre')->nullable();
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

        // `devoluciones` y `reclamos` (contadores de "Requiere atención" del panel)
        // ya las crean sus migraciones — igual que `roles` y `trabajadores`.

        // `empresa` (+ dirección/distrito) la comparte HandleInertiaRequests en cada
        // visita autenticada; vacías basta, el panel solo hace leftJoin y ->first().
        Schema::create('distritos', function (Blueprint $table) {
            $table->id('id_distrito');
            $table->string('nombre');
        });

        Schema::create('direcciones', function (Blueprint $table) {
            $table->id('id_direccion');
            $table->string('direccion')->nullable();
            $table->unsignedBigInteger('fk_distrito')->nullable();
        });

        Schema::create('empresa', function (Blueprint $table) {
            $table->id('id_empresa');
            $table->string('ruc')->nullable();
            $table->string('razon_social')->nullable();
            $table->string('nombre_comercial')->nullable();
            $table->string('logo')->nullable();
            $table->string('correo')->nullable();
            $table->string('telefono')->nullable();
            $table->unsignedBigInteger('fk_direccion')->nullable();
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
        // Login único: los invitados van a /cuenta (Portal Web), no a /login.
        $response->assertRedirect(route('cuenta'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();

        // Solo un trabajador con permiso `dashboard.ver` puede ver el panel
        // (ver PermisoService) — un simple usuario autenticado, sin fila en
        // `trabajadores`, ya no basta. «Super Administrador» tiene bypass
        // total sin necesitar filas en `rol_permisos`.
        $idRol = DB::table('roles')->insertGetId(['nombre' => 'Super Administrador']);
        DB::table('trabajadores')->insert([
            'fk_persona' => 1,
            'fk_user' => $user->id,
            'fk_rol' => $idRol,
            'fecha_ingreso' => now()->toDateString(),
            'activo' => true,
        ]);

        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_periodo_query_param_is_validated_against_a_whitelist()
    {
        $user = $this->trabajadorConPanel();
        $this->actingAs($user);

        // Valor válido: se respeta.
        $this->get(route('dashboard', ['periodo' => 90]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('periodo', 90));

        // Valores fuera de la lista (o basura): caen al default de 30 días.
        foreach (['15', '0', '-7', 'abc', '9999'] as $malo) {
            $this->get(route('dashboard', ['periodo' => $malo]))
                ->assertOk()
                ->assertInertia(fn ($page) => $page->where('periodo', 30));
        }
    }

    public function test_dashboard_exposes_the_expected_prop_shape()
    {
        $user = $this->trabajadorConPanel();
        $this->actingAs($user);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('stats.ventasPeriodo')
                ->has('stats.ticketPromedio')
                ->has('stats.clientesNuevos')
                ->has('alertas.pedidosPendientes')
                ->has('alertas.devolucionesAbiertas')
                ->has('alertas.reclamosAbiertos')
                ->has('alertas.productosStockBajo')
                ->has('ventasPorDia', 30)
                ->has('clientesPorDia', 30)
                ->has('ventasPorCategoria')
                ->has('periodosDisponibles', 3)
            );
    }

    private function trabajadorConPanel(): User
    {
        $user = User::factory()->create();

        $idRol = DB::table('roles')->insertGetId(['nombre' => 'Super Administrador']);
        DB::table('trabajadores')->insert([
            'fk_persona' => 1,
            'fk_user' => $user->id,
            'fk_rol' => $idRol,
            'fecha_ingreso' => now()->toDateString(),
            'activo' => true,
        ]);

        return $user;
    }
}
