<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * "Mis pedidos" del cliente (/mi-cuenta/pedidos): eliminar un pedido pendiente
 * y "Ir a pagar" (reintentarPago). El esquema de negocio no vive en
 * migraciones de Laravel, así que se recrean en sqlite las tablas mínimas que
 * tocan estas rutas — mismo patrón que CheckoutTest. `menu_cuenta`/`funciones`
 * sí existen y quedan sembradas por sus migraciones.
 */
class MiCuentaPedidosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Props compartidos que HandleInertiaRequests consulta en cada respuesta.
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
            $t->string('correo')->nullable();
            $t->string('telefono')->nullable();
            $t->unsignedBigInteger('fk_direccion')->nullable();
        });

        Schema::create('personas', function (Blueprint $t) {
            $t->id('id_persona');
            $t->string('num_documento')->nullable();
            $t->string('nombres')->nullable();
            $t->string('apellido_paterno')->nullable();
            $t->string('apellido_materno')->nullable();
            $t->string('telefono')->nullable();
            $t->timestamps();
        });
        Schema::create('clientes', function (Blueprint $t) {
            $t->id('id_cliente');
            $t->unsignedBigInteger('fk_persona')->nullable();
            $t->unsignedBigInteger('fk_user');
            $t->string('correo')->nullable();
            $t->string('razon_social')->nullable();
            $t->string('ruc')->nullable();
            $t->timestamps();
        });

        Schema::create('marcas', function (Blueprint $t) {
            $t->id('id_marca');
            $t->string('nombre');
            $t->string('logo')->nullable();
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
            $t->timestamp('created_at')->nullable();
        });

        Schema::create('estados_pedido', function (Blueprint $t) {
            $t->id('id_estado_pedido');
            $t->string('nombre');
        });
        Schema::create('pedidos', function (Blueprint $t) {
            $t->id('id_pedido');
            $t->unsignedBigInteger('fk_cliente');
            $t->unsignedBigInteger('fk_direccion_envio')->nullable();
            $t->unsignedBigInteger('fk_tipo_entrega')->nullable();
            $t->unsignedBigInteger('fk_forma_pago')->nullable();
            $t->unsignedBigInteger('fk_estado_pedido');
            $t->decimal('subtotal', 10, 2)->default(0);
            $t->decimal('descuento_total', 10, 2)->default(0);
            $t->decimal('igv', 10, 2)->default(0);
            $t->decimal('total', 10, 2)->default(0);
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
        });
        // `pagos` la crea su propia migración (2026_08_27_100001) — no recrear.
        Schema::create('comprobantes', function (Blueprint $t) {
            $t->id('id_comprobante');
            $t->unsignedBigInteger('fk_pedido');
        });

        DB::table('estados_pedido')->insert([
            ['id_estado_pedido' => 1, 'nombre' => 'Pendiente de pago'],
            ['id_estado_pedido' => 2, 'nombre' => 'Pagado'],
        ]);
    }

    private function actingAsCliente(): array
    {
        $user = User::factory()->create();
        $clienteId = DB::table('clientes')->insertGetId([
            'fk_user' => $user->id,
            'correo' => $user->email,
        ]);
        $this->actingAs($user);

        return [$user, $clienteId];
    }

    private function crearProducto(string $nombre = 'Croquetas', float $precio = 50): int
    {
        return DB::table('productos')->insertGetId([
            'sku' => strtoupper(substr(md5($nombre), 0, 8)),
            'nombre' => $nombre,
            'precio' => $precio,
            'stock' => 100,
            'fk_estado' => 1,
        ]);
    }

    private function crearPedidoPendiente(int $clienteId): int
    {
        return DB::table('pedidos')->insertGetId([
            'fk_cliente' => $clienteId,
            'fk_estado_pedido' => 1,
            'total' => 100,
            'fecha_pedido' => now(),
        ]);
    }

    public function test_reintentar_pago_reemplaza_el_carrito_con_los_productos_del_pedido(): void
    {
        [, $clienteId] = $this->actingAsCliente();
        $productoA = $this->crearProducto('Producto A', 30);
        $productoB = $this->crearProducto('Producto B', 20);

        $pedidoId = $this->crearPedidoPendiente($clienteId);
        DB::table('pedido_detalle')->insert([
            ['fk_pedido' => $pedidoId, 'fk_producto' => $productoA, 'cantidad' => 2, 'precio_unitario' => 30, 'subtotal' => 60],
            ['fk_pedido' => $pedidoId, 'fk_producto' => $productoB, 'cantidad' => 1, 'precio_unitario' => 20, 'subtotal' => 20],
        ]);

        // El carrito ya tiene algo distinto: debe quedar reemplazado, no sumado.
        $carritoId = DB::table('carritos')->insertGetId(['fk_cliente' => $clienteId]);
        DB::table('carrito_detalle')->insert([
            'fk_carrito' => $carritoId, 'fk_producto' => $this->crearProducto('Viejo', 5), 'cantidad' => 9, 'precio_unitario' => 5,
        ]);

        $response = $this->post("/mi-cuenta/pedidos/{$pedidoId}/reintentar-pago");

        $response->assertRedirect(route('checkout.show'));
        $this->assertDatabaseMissing('carrito_detalle', ['fk_carrito' => $carritoId, 'cantidad' => 9]);
        $this->assertDatabaseHas('carrito_detalle', ['fk_carrito' => $carritoId, 'fk_producto' => $productoA, 'cantidad' => 2]);
        $this->assertDatabaseHas('carrito_detalle', ['fk_carrito' => $carritoId, 'fk_producto' => $productoB, 'cantidad' => 1]);
    }

    public function test_reintentar_pago_de_un_pedido_sin_lineas_no_toca_el_carrito(): void
    {
        [, $clienteId] = $this->actingAsCliente();

        $carritoId = DB::table('carritos')->insertGetId(['fk_cliente' => $clienteId]);
        DB::table('carrito_detalle')->insert([
            'fk_carrito' => $carritoId, 'fk_producto' => $this->crearProducto('Actual', 15), 'cantidad' => 3, 'precio_unitario' => 15,
        ]);

        $pedidoId = $this->crearPedidoPendiente($clienteId); // sin pedido_detalle

        $response = $this->post("/mi-cuenta/pedidos/{$pedidoId}/reintentar-pago");

        $response->assertRedirect(route('mi-cuenta.pedidos'));
        // El carrito del cliente quedó intacto.
        $this->assertDatabaseHas('carrito_detalle', ['fk_carrito' => $carritoId, 'cantidad' => 3]);
    }

    public function test_reintentar_pago_de_un_pedido_de_otro_cliente_da_403(): void
    {
        [, $clienteId] = $this->actingAsCliente();
        $otroClienteId = DB::table('clientes')->insertGetId([
            'fk_user' => User::factory()->create()->id,
            'correo' => 'otro@example.com',
        ]);

        $pedidoAjeno = $this->crearPedidoPendiente($otroClienteId);

        $this->post("/mi-cuenta/pedidos/{$pedidoAjeno}/reintentar-pago")->assertForbidden();
    }

    public function test_cancelar_borra_el_pedido_pendiente_y_sus_dependencias(): void
    {
        [, $clienteId] = $this->actingAsCliente();
        $producto = $this->crearProducto();
        $pedidoId = $this->crearPedidoPendiente($clienteId);

        DB::table('pedido_detalle')->insert([
            'fk_pedido' => $pedidoId, 'fk_producto' => $producto, 'cantidad' => 1, 'precio_unitario' => 50, 'subtotal' => 50,
        ]);
        DB::table('pagos')->insert(['fk_pedido' => $pedidoId, 'fk_forma_pago' => 1, 'estado' => 'pendiente', 'monto' => 50]);

        $this->delete("/mi-cuenta/pedidos/{$pedidoId}")->assertRedirect(route('mi-cuenta.pedidos'));

        $this->assertDatabaseMissing('pedidos', ['id_pedido' => $pedidoId]);
        $this->assertDatabaseMissing('pedido_detalle', ['fk_pedido' => $pedidoId]);
        $this->assertDatabaseMissing('pagos', ['fk_pedido' => $pedidoId]);
    }

    public function test_cancelar_no_borra_un_pedido_ya_pagado(): void
    {
        [, $clienteId] = $this->actingAsCliente();
        $pedidoId = $this->crearPedidoPendiente($clienteId);
        DB::table('pedidos')->where('id_pedido', $pedidoId)->update(['fk_estado_pedido' => 2]);
        DB::table('pagos')->insert(['fk_pedido' => $pedidoId, 'fk_forma_pago' => 1, 'estado' => 'pagado', 'monto' => 100]);

        $this->delete("/mi-cuenta/pedidos/{$pedidoId}");

        $this->assertDatabaseHas('pedidos', ['id_pedido' => $pedidoId]);
    }
}
