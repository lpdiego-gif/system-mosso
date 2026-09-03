<?php

namespace Tests\Feature;

use App\Mail\ComprobanteMail;
use App\Models\User;
use App\Services\ZonasEnvioService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * El esquema de negocio no vive en migraciones de Laravel (ver
 * `base de datos/mosso.sql`), así que estos tests recrean en sqlite las tablas
 * mínimas que toca el checkout. Culqi se simula con Http::fake().
 */
class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.culqi.public_key', 'pk_test_x');
        config()->set('services.culqi.secret_key', 'sk_test_x');

        Schema::create('menus', function (Blueprint $t) {
            $t->id('id_menu');
            $t->string('nombre');
            $t->string('tipo_enlace');
            $t->unsignedBigInteger('fk_animal')->nullable();
            $t->unsignedBigInteger('fk_tipo_animal')->nullable();
            $t->string('url')->nullable();
            $t->integer('orden')->default(0);
            $t->boolean('destacado')->default(false);
            $t->boolean('activo')->default(true);
        });

        Schema::create('empresa', function (Blueprint $t) {
            $t->id('id_empresa');
            $t->string('ruc')->nullable();
            $t->string('razon_social')->nullable();
            $t->string('nombre_comercial')->nullable();
            $t->string('logo')->nullable();
            $t->string('correo')->nullable();
            $t->string('telefono')->nullable();
            $t->string('celular')->nullable();
            $t->string('website')->nullable();
            $t->unsignedBigInteger('fk_direccion')->nullable();
        });

        // `cuentas_bancarias` la crea la migración real
        // 2026_09_02_160002_create_cuentas_bancarias_table (tabla de negocio
        // NUEVA con migración Laravel de verdad, no dump manual -- a
        // diferencia de las demás tablas de este setUp(), RefreshDatabase SÍ
        // la crea sola; declararla de nuevo acá rompe con "already exists").

        Schema::create('personas', function (Blueprint $t) {
            $t->id('id_persona');
            $t->unsignedBigInteger('fk_tipo_documento')->nullable();
            $t->string('num_documento')->nullable();
            $t->string('nombres')->nullable();
            $t->string('apellido_paterno')->nullable();
            $t->string('apellido_materno')->nullable();
            $t->string('telefono')->nullable();
            $t->date('fecha_nacimiento')->nullable();
            $t->timestamps();
        });

        // `trabajadores` ya la crea la migración `2026_08_31_080003_create_trabajadores_table.php`.

        Schema::create('clientes', function (Blueprint $t) {
            $t->id('id_cliente');
            $t->unsignedBigInteger('fk_persona')->nullable();
            $t->unsignedBigInteger('fk_user')->nullable();
            $t->string('correo');
            $t->string('razon_social')->nullable();
            $t->string('ruc')->nullable();
            $t->timestamps();
        });

        Schema::create('tipo_documento', function (Blueprint $t) {
            $t->id('id_tipo_documento');
            $t->string('nombre');
        });

        Schema::create('marcas', function (Blueprint $t) {
            $t->id('id_marca');
            $t->string('nombre');
        });

        Schema::create('productos', function (Blueprint $t) {
            $t->id('id_producto');
            $t->string('sku');
            $t->string('nombre');
            $t->decimal('precio', 10, 2);
            $t->integer('stock')->default(0);
            $t->unsignedBigInteger('fk_marca')->nullable();
            $t->unsignedBigInteger('fk_estado')->default(1);
            $t->string('imagen_principal')->nullable();
            $t->timestamps();
        });

        Schema::create('descuentos', function (Blueprint $t) {
            $t->id('id_descuento');
            $t->unsignedBigInteger('fk_producto');
            $t->string('tipo');
            $t->decimal('valor', 10, 2);
            $t->dateTime('fecha_inicio');
            $t->dateTime('fecha_fin');
            $t->boolean('activo')->default(true);
        });

        Schema::create('carritos', function (Blueprint $t) {
            $t->id('id_carrito');
            $t->unsignedBigInteger('fk_cliente')->nullable();
            $t->string('token_invitado')->nullable();
            $t->timestamps();
        });

        Schema::create('carrito_detalle', function (Blueprint $t) {
            $t->id('id_carrito_detalle');
            $t->unsignedBigInteger('fk_carrito');
            $t->unsignedBigInteger('fk_producto');
            $t->integer('cantidad');
            $t->decimal('precio_unitario', 10, 2);
        });

        Schema::create('departamentos', function (Blueprint $t) {
            $t->id('id_departamento');
            $t->string('nombre');
        });
        Schema::create('provincias', function (Blueprint $t) {
            $t->id('id_provincia');
            $t->string('nombre');
            $t->unsignedBigInteger('fk_departamento');
        });
        Schema::create('distritos', function (Blueprint $t) {
            $t->id('id_distrito');
            $t->string('nombre');
            $t->string('ubigeo')->nullable();
            $t->decimal('costo_envio', 8, 2)->nullable();
            $t->boolean('activo')->default(false);
            $t->unsignedBigInteger('fk_provincia');
        });
        Schema::create('direcciones', function (Blueprint $t) {
            $t->id('id_direccion');
            $t->string('direccion');
            $t->string('referencia')->nullable();
            $t->unsignedBigInteger('fk_distrito');
        });
        Schema::create('cliente_direcciones', function (Blueprint $t) {
            $t->id('id_cliente_direccion');
            $t->unsignedBigInteger('fk_cliente');
            $t->unsignedBigInteger('fk_direccion');
            $t->string('alias')->nullable();
            $t->boolean('es_principal')->default(false);
        });

        Schema::create('tipo_entregas', function (Blueprint $t) {
            $t->id('id_tipo_entrega');
            $t->string('nombre');
            $t->boolean('requiere_direccion')->default(true);
        });
        Schema::create('tipo_comprobante', function (Blueprint $t) {
            $t->id('id_tipo_comprobante');
            $t->string('nombre');
        });
        Schema::create('estados_pedido', function (Blueprint $t) {
            $t->id('id_estado_pedido');
            $t->string('nombre');
        });
        Schema::create('forma_pagos', function (Blueprint $t) {
            $t->id('id_forma_pago');
            $t->string('nombre');
        });

        Schema::create('pedidos', function (Blueprint $t) {
            $t->id('id_pedido');
            $t->unsignedBigInteger('fk_cliente');
            $t->unsignedBigInteger('fk_direccion_envio')->nullable();
            $t->unsignedBigInteger('fk_tipo_entrega');
            $t->unsignedBigInteger('fk_forma_pago');
            $t->unsignedBigInteger('fk_estado_pedido');
            $t->decimal('subtotal', 10, 2);
            $t->decimal('descuento_total', 10, 2)->default(0);
            $t->decimal('igv', 10, 2);
            $t->decimal('total', 10, 2);
            $t->timestamp('fecha_pedido')->useCurrent();
            $t->timestamps();
        });
        Schema::create('pedido_detalle', function (Blueprint $t) {
            $t->id('id_pedido_detalle');
            $t->unsignedBigInteger('fk_pedido');
            $t->unsignedBigInteger('fk_producto');
            $t->integer('cantidad');
            $t->decimal('precio_unitario', 10, 2);
            $t->decimal('descuento_unitario', 10, 2)->default(0);
            $t->decimal('subtotal', 10, 2);
        });
        Schema::create('pedido_recojo_terceros', function (Blueprint $t) {
            $t->id('id_pedido_recojo_tercero');
            $t->unsignedBigInteger('fk_pedido');
            $t->unsignedBigInteger('fk_tipo_documento');
            $t->string('num_documento');
            $t->string('nombres');
            $t->string('apellidos');
            $t->string('telefono')->nullable();
            $t->timestamp('created_at')->nullable();
        });
        // `pagos`, `configuracion_delivery` y `configuracion_delivery_distritos`
        // las crean las migraciones nuevas (guardadas con Schema::hasTable).
        Schema::create('comprobantes', function (Blueprint $t) {
            $t->id('id_comprobante');
            $t->unsignedBigInteger('fk_pedido');
            $t->unsignedBigInteger('fk_tipo_comprobante');
            $t->unsignedBigInteger('fk_empresa');
            $t->string('serie', 10);
            $t->string('numero', 20);
            $t->char('moneda', 3)->default('PEN');
            $t->timestamp('fecha_emision')->useCurrent();
            $t->decimal('op_gravadas', 10, 2)->default(0);
            $t->decimal('op_exoneradas', 10, 2)->default(0);
            $t->decimal('op_inafectas', 10, 2)->default(0);
            $t->decimal('descuento_global', 10, 2)->default(0);
            $t->decimal('igv', 10, 2)->default(0);
            $t->decimal('total', 10, 2)->default(0);
            $t->string('total_letras')->nullable();
            $t->string('xml_path')->nullable();
            $t->string('hash', 100)->nullable();
            $t->text('qr_data')->nullable();
            $t->string('estado_sunat', 20)->nullable()->default('no_enviado');
            $t->string('observacion_sunat')->nullable();
            $t->timestamp('correo_enviado_en')->nullable();
        });
        // Catálogos base.
        DB::table('tipo_documento')->insert([['nombre' => 'DNI'], ['nombre' => 'CE'], ['nombre' => 'Pasaporte']]);
        DB::table('tipo_entregas')->insert([
            ['nombre' => 'Envío a domicilio', 'requiere_direccion' => true],
            ['nombre' => 'Retiro en tienda', 'requiere_direccion' => false],
        ]);
        DB::table('tipo_comprobante')->insert([['nombre' => 'Boleta'], ['nombre' => 'Factura']]);
        DB::table('estados_pedido')->insert([
            ['nombre' => 'Pendiente de pago'], ['nombre' => 'Pagado'], ['nombre' => 'En preparación'],
            ['nombre' => 'Enviado'], ['nombre' => 'Entregado'], ['nombre' => 'Cancelado'],
        ]);
        DB::table('forma_pagos')->insert([['nombre' => 'Tarjeta (Culqi)']]);
        DB::table('departamentos')->insert(['id_departamento' => 1, 'nombre' => 'Lima']);
        DB::table('provincias')->insert(['id_provincia' => 1, 'nombre' => 'Lima', 'fk_departamento' => 1]);
        DB::table('distritos')->insert(['id_distrito' => 1, 'nombre' => 'Miraflores', 'ubigeo' => '150122', 'costo_envio' => 15, 'activo' => true, 'fk_provincia' => 1]);
        DB::table('empresa')->insert(['id_empresa' => 1, 'nombre_comercial' => 'MOSSO', 'razon_social' => 'MOSSO SAC', 'ruc' => '20123456789']);
    }

    private function clienteConCarrito(bool $datosCompletos = true): array
    {
        $user = User::factory()->create();

        $idPersona = null;
        if ($datosCompletos) {
            $idPersona = DB::table('personas')->insertGetId([
                'fk_tipo_documento' => 1, 'num_documento' => '70123456', 'nombres' => 'Ana',
                'apellido_paterno' => 'Díaz', 'telefono' => '987654321',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $idCliente = DB::table('clientes')->insertGetId([
            'fk_persona' => $idPersona, 'fk_user' => $user->id, 'correo' => $user->email,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $idProducto = DB::table('productos')->insertGetId([
            'sku' => 'SKU1', 'nombre' => 'Alimento', 'precio' => 100, 'stock' => 5, 'fk_estado' => 1,
        ]);

        $idCarrito = DB::table('carritos')->insertGetId([
            'fk_cliente' => $idCliente, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('carrito_detalle')->insert([
            'fk_carrito' => $idCarrito, 'fk_producto' => $idProducto, 'cantidad' => 2, 'precio_unitario' => 100,
        ]);

        return compact('user', 'idCliente', 'idProducto', 'idCarrito');
    }

    public function test_guest_is_redirected_to_storefront_login(): void
    {
        $this->get('/checkout')->assertRedirect(route('cuenta'));
    }

    public function test_cliente_with_empty_cart_is_redirected_to_cart(): void
    {
        $user = User::factory()->create();
        DB::table('clientes')->insert(['fk_user' => $user->id, 'correo' => $user->email, 'created_at' => now(), 'updated_at' => now()]);

        $this->actingAs($user)->get('/checkout')->assertRedirect(route('carrito.index'));
    }

    public function test_checkout_page_renders_with_cart_summary(): void
    {
        ['user' => $user] = $this->clienteConCarrito();

        $this->actingAs($user)->get('/checkout')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('checkout/index')
                ->where('resumen.subtotal', 200)
                ->where('comprador.datos_completos', true));
    }

    public function test_happy_path_creates_paid_order_and_decrements_stock(): void
    {
        Http::fake(['*' => Http::response(['id' => 'chr_test_123', 'object' => 'charge'], 200)]);
        Mail::fake();

        ['user' => $user, 'idProducto' => $idProducto] = $this->clienteConCarrito();

        $iniciar = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta',
            'fk_tipo_entrega' => 2, // Retiro en tienda
            'receptor' => 'yo',
        ])->assertOk();

        $pedidoId = $iniciar->json('pedido_id');
        $this->assertDatabaseHas('pedidos', ['id_pedido' => $pedidoId, 'total' => 200]);
        $this->assertDatabaseHas('pagos', ['fk_pedido' => $pedidoId, 'estado' => 'pendiente']);

        $this->actingAs($user)
            ->post("/checkout/{$pedidoId}/pagar", ['culqi_token' => 'tkn_test_x', 'comprobante' => 'boleta'])
            ->assertRedirect(route('checkout.confirmacion', $pedidoId));

        $this->assertDatabaseHas('pagos', ['fk_pedido' => $pedidoId, 'estado' => 'pagado', 'id_transaccion_culqi' => 'chr_test_123']);
        $this->assertSame(3, (int) DB::table('productos')->where('id_producto', $idProducto)->value('stock'));
        $this->assertDatabaseHas('comprobantes', ['fk_pedido' => $pedidoId, 'serie' => 'B001']);
        $this->assertSame(0, (int) DB::table('carrito_detalle')->count());

        Mail::assertSent(ComprobanteMail::class, fn (ComprobanteMail $mail) => $mail->hasTo($user->email));
        $this->assertNotNull(DB::table('comprobantes')->where('fk_pedido', $pedidoId)->value('correo_enviado_en'));
    }

    public function test_un_fallo_al_enviar_el_correo_no_revierte_el_pago(): void
    {
        Http::fake(['*' => Http::response(['id' => 'chr_test_456', 'object' => 'charge'], 200)]);
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP caído (simulado)'));

        ['user' => $user, 'idProducto' => $idProducto] = $this->clienteConCarrito();

        $pedidoId = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $this->actingAs($user)
            ->post("/checkout/{$pedidoId}/pagar", ['culqi_token' => 'tkn_test_x', 'comprobante' => 'boleta'])
            ->assertRedirect(route('checkout.confirmacion', $pedidoId));

        // El pago quedó confirmado y el stock descontado pese a que el correo
        // reventó -- nunca debe revertir ni bloquear la venta (ver
        // CheckoutService::enviarComprobantePorCorreo()).
        $this->assertDatabaseHas('pagos', ['fk_pedido' => $pedidoId, 'estado' => 'pagado']);
        $this->assertSame(3, (int) DB::table('productos')->where('id_producto', $idProducto)->value('stock'));
        $this->assertNull(DB::table('comprobantes')->where('fk_pedido', $pedidoId)->value('correo_enviado_en'));
    }

    public function test_factura_without_ruc_is_rejected(): void
    {
        ['user' => $user] = $this->clienteConCarrito();

        $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'factura',
            'fk_tipo_entrega' => 2,
            'receptor' => 'yo',
        ])->assertStatus(422)->assertJsonValidationErrors(['ruc', 'razon_social']);
    }

    public function test_payment_is_idempotent(): void
    {
        Http::fake(['*' => Http::response(['id' => 'chr_once'], 200)]);
        ['user' => $user, 'idProducto' => $idProducto] = $this->clienteConCarrito();

        $pedidoId = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $this->actingAs($user)->post("/checkout/{$pedidoId}/pagar", ['culqi_token' => 't1']);
        $this->actingAs($user)->post("/checkout/{$pedidoId}/pagar", ['culqi_token' => 't2'])
            ->assertRedirect(route('checkout.confirmacion', $pedidoId));

        // El stock se descuenta una sola vez (5 - 2 = 3).
        $this->assertSame(3, (int) DB::table('productos')->where('id_producto', $idProducto)->value('stock'));
    }

    public function test_reintentar_iniciar_descarta_el_pedido_pendiente_anterior(): void
    {
        ['user' => $user] = $this->clienteConCarrito();

        $primero = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $segundo = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $this->assertNotSame($primero, $segundo);
        $this->assertDatabaseMissing('pedidos', ['id_pedido' => $primero]);
        $this->assertDatabaseHas('pedidos', ['id_pedido' => $segundo]);
        $this->assertSame(1, (int) DB::table('pedidos')->count());
    }

    public function test_no_se_puede_usar_direccion_de_otro_cliente(): void
    {
        ['user' => $user] = $this->clienteConCarrito();

        // Dirección que pertenece a OTRO cliente.
        $idDir = DB::table('direcciones')->insertGetId(['direccion' => 'Ajena 1', 'fk_distrito' => 1]);
        $otroCliente = DB::table('clientes')->insertGetId(['fk_user' => null, 'correo' => 'otro@x.com', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('cliente_direcciones')->insert(['fk_cliente' => $otroCliente, 'fk_direccion' => $idDir, 'es_principal' => 1]);

        $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta',
            'fk_tipo_entrega' => 1, // domicilio
            'direccion_modo' => 'guardada',
            'id_direccion' => $idDir,
            'receptor' => 'yo',
        ])->assertStatus(422)->assertJsonValidationErrors(['id_direccion']);
    }

    public function test_pago_con_yape_confirma_si_la_orden_esta_pagada(): void
    {
        Http::fake([
            '*/orders/ord_yape_1' => Http::response(['id' => 'ord_yape_1', 'state' => 'paid'], 200),
            '*/orders' => Http::response(['id' => 'ord_yape_1', 'state' => 'created'], 201),
        ]);

        ['user' => $user, 'idProducto' => $idProducto] = $this->clienteConCarrito();

        $pedidoId = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $this->actingAs($user)->postJson("/checkout/{$pedidoId}/orden")
            ->assertOk()->assertJson(['order_id' => 'ord_yape_1']);

        $this->actingAs($user)
            ->post("/checkout/{$pedidoId}/pagar", ['culqi_order_id' => 'ord_yape_1', 'comprobante' => 'boleta'])
            ->assertRedirect(route('checkout.confirmacion', $pedidoId));

        $this->assertDatabaseHas('pagos', ['fk_pedido' => $pedidoId, 'estado' => 'pagado', 'id_transaccion_culqi' => 'ord_yape_1']);
        $this->assertSame(3, (int) DB::table('productos')->where('id_producto', $idProducto)->value('stock'));
    }

    public function test_pago_con_yape_falla_si_la_orden_no_esta_pagada(): void
    {
        Http::fake([
            '*/orders/ord_yape_2' => Http::response(['id' => 'ord_yape_2', 'state' => 'created'], 200),
            '*/orders' => Http::response(['id' => 'ord_yape_2', 'state' => 'created'], 201),
        ]);

        ['user' => $user, 'idProducto' => $idProducto] = $this->clienteConCarrito();

        $pedidoId = $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta', 'fk_tipo_entrega' => 2, 'receptor' => 'yo',
        ])->json('pedido_id');

        $this->actingAs($user)->postJson("/checkout/{$pedidoId}/orden")->assertOk();
        $this->actingAs($user)->post("/checkout/{$pedidoId}/pagar", ['culqi_order_id' => 'ord_yape_2']);

        $this->assertDatabaseHas('pagos', ['fk_pedido' => $pedidoId, 'estado' => 'fallido']);
        $this->assertSame(5, (int) DB::table('productos')->where('id_producto', $idProducto)->value('stock'));
    }

    public function test_tipos_de_documento_como_string_son_aceptados(): void
    {
        // Cliente SIN datos completos: debe enviar los campos del comprador.
        ['user' => $user] = $this->clienteConCarrito(datosCompletos: false);

        $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta',
            'fk_tipo_documento' => '1', // string, como lo manda un <select>
            'num_documento' => '70123456',
            'nombres' => 'Ana',
            'apellido_paterno' => 'Díaz',
            'telefono' => '987654321',
            'fk_tipo_entrega' => '2', // string
            'receptor' => 'yo',
        ])->assertOk();
    }

    // ------------------------------------------- Zonas de envío por UBIGEO

    public function test_distrito_inactivo_no_aparece_en_arbol_de_zonas_envio(): void
    {
        DB::table('distritos')->insert([
            'id_distrito' => 2, 'nombre' => 'Comas', 'ubigeo' => '150110',
            'costo_envio' => 20, 'activo' => false, 'fk_provincia' => 1,
        ]);

        $idsEnArbol = collect(ZonasEnvioService::arbol())
            ->flatMap(fn ($dep) => collect($dep['provincias']))
            ->flatMap(fn ($prov) => collect($prov['distritos']))
            ->pluck('id_distrito');

        $this->assertTrue($idsEnArbol->contains(1)); // activo, del fixture base
        $this->assertFalse($idsEnArbol->contains(2)); // recién insertado, inactivo
    }

    public function test_checkout_a_domicilio_con_direccion_en_distrito_inactivo_es_rechazado(): void
    {
        ['user' => $user] = $this->clienteConCarrito();

        DB::table('distritos')->insert([
            'id_distrito' => 2, 'nombre' => 'Comas', 'ubigeo' => '150110',
            'costo_envio' => 20, 'activo' => false, 'fk_provincia' => 1,
        ]);

        $idCliente = DB::table('clientes')->where('fk_user', $user->id)->value('id_cliente');
        $idDir = DB::table('direcciones')->insertGetId(['direccion' => 'Sin envío 123', 'fk_distrito' => 2]);
        DB::table('cliente_direcciones')->insert(['fk_cliente' => $idCliente, 'fk_direccion' => $idDir, 'es_principal' => 1]);

        $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta',
            'fk_tipo_entrega' => 1, // domicilio
            'direccion_modo' => 'guardada',
            'id_direccion' => $idDir,
            'receptor' => 'yo',
        ])->assertStatus(422)->assertJsonValidationErrors(['id_direccion']);
    }

    public function test_retiro_en_tienda_funciona_aunque_no_haya_distritos_activos(): void
    {
        DB::table('distritos')->update(['activo' => false]);
        ['user' => $user] = $this->clienteConCarrito();

        $this->actingAs($user)->postJson('/checkout/iniciar', [
            'comprobante' => 'boleta',
            'fk_tipo_entrega' => 2, // retiro en tienda: la dirección no participa
            'receptor' => 'yo',
        ])->assertOk();
    }
}
