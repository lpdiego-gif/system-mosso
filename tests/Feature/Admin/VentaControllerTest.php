<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * `roles`/`trabajadores` ya las crean las migraciones reales (RefreshDatabase
 * las deja listas en sqlite); el resto del esquema de negocio se arma acá,
 * mismo patrón que CheckoutTest/ComprobanteServiceTest.
 */
class VentaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('clientes', function (Blueprint $t) {
            $t->id('id_cliente');
            $t->unsignedBigInteger('fk_persona')->nullable();
            $t->unsignedBigInteger('fk_user')->nullable();
            $t->string('correo');
            $t->string('razon_social')->nullable();
            $t->string('ruc')->nullable();
            $t->timestamps();
        });
        Schema::create('personas', function (Blueprint $t) {
            $t->id('id_persona');
            $t->unsignedBigInteger('fk_tipo_documento')->nullable();
            $t->string('num_documento')->nullable();
            $t->string('nombres')->nullable();
            $t->string('apellido_paterno')->nullable();
            $t->string('apellido_materno')->nullable();
            $t->string('telefono')->nullable();
            $t->timestamps();
        });
        Schema::create('pedidos', function (Blueprint $t) {
            $t->id('id_pedido');
            $t->unsignedBigInteger('fk_cliente');
            $t->decimal('subtotal', 10, 2)->default(0);
            $t->decimal('descuento_total', 10, 2)->default(0);
            $t->decimal('igv', 10, 2)->default(0);
            $t->decimal('total', 10, 2)->default(0);
            $t->timestamp('fecha_pedido')->useCurrent();
        });
        Schema::create('tipo_comprobante', function (Blueprint $t) {
            $t->id('id_tipo_comprobante');
            $t->string('nombre');
        });
        Schema::create('comprobantes', function (Blueprint $t) {
            $t->id('id_comprobante');
            $t->unsignedBigInteger('fk_pedido');
            $t->unsignedBigInteger('fk_tipo_comprobante');
            $t->unsignedBigInteger('fk_empresa')->nullable();
            $t->string('serie', 10);
            $t->string('numero', 20);
            $t->timestamp('fecha_emision');
            $t->decimal('total', 10, 2)->default(0);
            $t->string('estado_sunat', 20)->nullable()->default('no_enviado');
            $t->timestamp('correo_enviado_en')->nullable();
        });

        DB::table('tipo_comprobante')->insert([
            ['id_tipo_comprobante' => 1, 'nombre' => 'Boleta'],
            ['id_tipo_comprobante' => 2, 'nombre' => 'Factura'],
        ]);

        // 3 comprobantes: 2 boletas (fechas distintas) + 1 factura.
        $idPersona = DB::table('personas')->insertGetId(['nombres' => 'Ana', 'apellido_paterno' => 'Diaz', 'created_at' => now(), 'updated_at' => now()]);
        $idCliente = DB::table('clientes')->insertGetId(['fk_persona' => $idPersona, 'correo' => 'ana@test.com', 'created_at' => now(), 'updated_at' => now()]);
        $idClienteFactura = DB::table('clientes')->insertGetId(['correo' => 'empresa@test.com', 'razon_social' => 'ACME SAC', 'created_at' => now(), 'updated_at' => now()]);

        foreach ([
            ['fk_cliente' => $idCliente, 'fk_tipo_comprobante' => 1, 'serie' => 'B001', 'numero' => '1', 'fecha' => '2026-01-10', 'total' => 100],
            ['fk_cliente' => $idCliente, 'fk_tipo_comprobante' => 1, 'serie' => 'B001', 'numero' => '2', 'fecha' => '2026-02-10', 'total' => 200],
            ['fk_cliente' => $idClienteFactura, 'fk_tipo_comprobante' => 2, 'serie' => 'F001', 'numero' => '1', 'fecha' => '2026-02-15', 'total' => 300],
        ] as $fila) {
            $idPedido = DB::table('pedidos')->insertGetId(['fk_cliente' => $fila['fk_cliente'], 'total' => $fila['total'], 'fecha_pedido' => $fila['fecha']]);
            DB::table('comprobantes')->insert([
                'fk_pedido' => $idPedido, 'fk_tipo_comprobante' => $fila['fk_tipo_comprobante'],
                'serie' => $fila['serie'], 'numero' => $fila['numero'], 'fecha_emision' => $fila['fecha'], 'total' => $fila['total'],
            ]);
        }
    }

    private function actingAsSuperAdmin(): User
    {
        $user = User::factory()->create();
        $idRol = DB::table('roles')->insertGetId(['nombre' => 'Super Administrador']);
        DB::table('trabajadores')->insert([
            'fk_persona' => 1, 'fk_user' => $user->id, 'fk_rol' => $idRol,
            'fecha_ingreso' => now()->toDateString(), 'activo' => true,
        ]);
        $this->actingAs($user);

        return $user;
    }

    public function test_data_responde_paginado(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->getJson('/admin/ventas/data')->assertOk();

        $response->assertJsonCount(3, 'data');
        $this->assertSame(3, $response->json('meta.total'));
    }

    public function test_data_filtra_por_tipo_de_comprobante(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->getJson('/admin/ventas/data?tipo=2')->assertOk();

        $response->assertJsonCount(1, 'data');
        $this->assertSame('Factura', $response->json('data.0.tipo'));
    }

    public function test_data_filtra_por_rango_de_fechas(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->getJson('/admin/ventas/data?desde=2026-02-01&hasta=2026-02-28')->assertOk();

        $response->assertJsonCount(2, 'data');
    }

    public function test_trabajador_sin_permiso_ventas_ver_no_puede_entrar(): void
    {
        $user = User::factory()->create();
        // Rol sin ningún permiso asignado (a diferencia de "Administrador"/
        // "Vendedor", que sí reciben ventas.* por el seeder real de permisos).
        $idRol = DB::table('roles')->insertGetId(['nombre' => 'Rol De Prueba Sin Permisos']);
        DB::table('trabajadores')->insert([
            'fk_persona' => 1, 'fk_user' => $user->id, 'fk_rol' => $idRol,
            'fecha_ingreso' => now()->toDateString(), 'activo' => true,
        ]);
        $this->actingAs($user);

        // El middleware `permiso:` no hace abort(403): flashea un toast de
        // error y redirige (ver EnsurePermiso, MEMORIA_PROYECTO.md).
        $this->get('/admin/ventas/data')->assertRedirect('/dashboard');
    }
}
