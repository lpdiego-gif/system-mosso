<?php

namespace Tests\Feature;

use App\Models\Comprobante;
use App\Services\ComprobanteService;
use DOMDocument;
use DOMXPath;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * El esquema de negocio no vive en migraciones (ver CheckoutTest); acá se
 * recrean solo las tablas mínimas que toca ComprobanteService::datos()/
 * generarXml() para un pedido de 2 ítems + envío.
 */
class ComprobanteServiceTest extends TestCase
{
    use RefreshDatabase;

    private int $idPedido;

    private int $idComprobante;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('departamentos', function (Blueprint $t) {
            $t->id('id_departamento');
            $t->string('nombre');
            $t->string('ubigeo', 2)->nullable();
        });
        Schema::create('provincias', function (Blueprint $t) {
            $t->id('id_provincia');
            $t->string('nombre');
            $t->string('ubigeo', 4)->nullable();
            $t->unsignedBigInteger('fk_departamento');
        });
        Schema::create('distritos', function (Blueprint $t) {
            $t->id('id_distrito');
            $t->string('nombre');
            $t->string('ubigeo', 6)->nullable();
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
        Schema::create('tipo_documento', function (Blueprint $t) {
            $t->id('id_tipo_documento');
            $t->string('nombre');
        });
        Schema::create('clientes', function (Blueprint $t) {
            $t->id('id_cliente');
            $t->unsignedBigInteger('fk_persona')->nullable();
            $t->unsignedBigInteger('fk_user')->nullable();
            $t->string('correo');
            $t->string('razon_social')->nullable();
            $t->string('ruc')->nullable();
            $t->timestamps();
        });

        Schema::create('unidades_medida', function (Blueprint $t) {
            $t->id('id_unidad_medida');
            $t->string('nombre');
            $t->string('abreviatura');
            $t->string('codigo_sunat', 3)->nullable();
        });
        Schema::create('marcas', function (Blueprint $t) {
            $t->id('id_marca');
            $t->string('nombre');
        });
        Schema::create('productos', function (Blueprint $t) {
            $t->id('id_producto');
            $t->string('sku');
            $t->string('codigo_barras')->nullable();
            $t->string('nombre');
            $t->decimal('precio', 10, 2);
            $t->integer('stock')->default(0);
            $t->unsignedBigInteger('fk_marca')->nullable();
            $t->unsignedBigInteger('fk_unidad_medida')->nullable();
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

        Schema::create('tipo_comprobante', function (Blueprint $t) {
            $t->id('id_tipo_comprobante');
            $t->string('nombre');
        });
        Schema::create('pedidos', function (Blueprint $t) {
            $t->id('id_pedido');
            $t->unsignedBigInteger('fk_cliente');
            $t->unsignedBigInteger('fk_direccion_envio')->nullable();
            $t->unsignedBigInteger('fk_tipo_entrega')->default(1);
            $t->unsignedBigInteger('fk_forma_pago')->default(1);
            $t->unsignedBigInteger('fk_estado_pedido')->default(2);
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
        // `comprobantes` la crea de verdad la migración real
        // 2026_09_02_160001_add_columnas_a_comprobantes -- pero esa migración
        // sale temprano si `comprobantes` no existe (Schema::hasTable), así
        // que acá SÍ hay que declarar la tabla base completa a mano.
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

        // -------------------------------------------------------- datos

        DB::table('tipo_documento')->insert(['id_tipo_documento' => 1, 'nombre' => 'DNI']);
        DB::table('tipo_comprobante')->insert([
            ['id_tipo_comprobante' => 1, 'nombre' => 'Boleta'],
            ['id_tipo_comprobante' => 2, 'nombre' => 'Factura'],
        ]);

        DB::table('departamentos')->insert(['id_departamento' => 1, 'nombre' => 'Lima', 'ubigeo' => '15']);
        DB::table('provincias')->insert(['id_provincia' => 1, 'nombre' => 'Lima', 'ubigeo' => '1501', 'fk_departamento' => 1]);
        DB::table('distritos')->insert(['id_distrito' => 1, 'nombre' => 'Miraflores', 'ubigeo' => '150122', 'costo_envio' => 15, 'activo' => true, 'fk_provincia' => 1]);
        $idDireccionEmpresa = DB::table('direcciones')->insertGetId(['direccion' => 'Av. Empresa 100', 'fk_distrito' => 1]);
        $idEmpresa = DB::table('empresa')->insertGetId([
            'ruc' => '20123456789', 'razon_social' => 'MOSSO SAC', 'nombre_comercial' => 'MOSSO',
            'correo' => 'contacto@mosso.test', 'telefono' => '014561234', 'fk_direccion' => $idDireccionEmpresa,
        ]);

        $idPersona = DB::table('personas')->insertGetId([
            'fk_tipo_documento' => 1, 'num_documento' => '70123456', 'nombres' => 'Ana',
            'apellido_paterno' => 'Diaz', 'apellido_materno' => 'Lopez', 'telefono' => '987654321',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $idCliente = DB::table('clientes')->insertGetId([
            'fk_persona' => $idPersona, 'correo' => 'ana@test.com', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $idUnidad = DB::table('unidades_medida')->insertGetId(['nombre' => 'Unidad', 'abreviatura' => 'unid', 'codigo_sunat' => 'NIU']);
        $idProd1 = DB::table('productos')->insertGetId(['sku' => 'SKU-1', 'codigo_barras' => '111', 'nombre' => 'Producto Uno', 'precio' => 45.90, 'stock' => 10, 'fk_unidad_medida' => $idUnidad, 'fk_estado' => 1]);
        $idProd2 = DB::table('productos')->insertGetId(['sku' => 'SKU-2', 'codigo_barras' => '222', 'nombre' => 'Producto Dos', 'precio' => 34.90, 'stock' => 10, 'fk_unidad_medida' => $idUnidad, 'fk_estado' => 1]);

        $idDireccionEnvio = DB::table('direcciones')->insertGetId(['direccion' => 'Jr. Cliente 200', 'fk_distrito' => 1]);

        // 2 items (uno con descuento_unitario) + envío S/15 -> total debe cuadrar.
        $costoEnvio = 15.00;
        $subtotal = round(45.90 * 2 + 34.90 * 1, 2);
        $descuentoTotal = 5.00;
        $base = $subtotal - $descuentoTotal;
        $igv = round($base - $base / 1.18, 2);
        $total = round($base + $costoEnvio, 2);

        $this->idPedido = DB::table('pedidos')->insertGetId([
            'fk_cliente' => $idCliente, 'fk_direccion_envio' => $idDireccionEnvio,
            'subtotal' => $subtotal, 'descuento_total' => $descuentoTotal, 'igv' => $igv, 'total' => $total,
            'fecha_pedido' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('pedido_detalle')->insert([
            ['fk_pedido' => $this->idPedido, 'fk_producto' => $idProd1, 'cantidad' => 2, 'precio_unitario' => 45.90, 'descuento_unitario' => 0, 'subtotal' => 45.90 * 2],
            ['fk_pedido' => $this->idPedido, 'fk_producto' => $idProd2, 'cantidad' => 1, 'precio_unitario' => 34.90, 'descuento_unitario' => 5.00, 'subtotal' => 34.90 - 5.00],
        ]);

        $this->idComprobante = DB::table('comprobantes')->insertGetId([
            'fk_pedido' => $this->idPedido, 'fk_tipo_comprobante' => 1, 'fk_empresa' => $idEmpresa,
            'serie' => 'B001', 'numero' => '00000001', 'fecha_emision' => now(),
        ]);
    }

    public function test_datos_calcula_bien_los_totales_y_cuadran_con_el_pedido(): void
    {
        $comprobante = Comprobante::find($this->idComprobante);
        $datos = app(ComprobanteService::class)->datos($comprobante);

        $pedido = DB::table('pedidos')->where('id_pedido', $this->idPedido)->first();

        $this->assertCount(3, $datos['items']); // 2 productos + línea de envío
        $this->assertSame((float) $pedido->total, (float) $datos['totales']['total']);
        $this->assertEqualsWithDelta(
            (float) $datos['totales']['op_gravadas'] + (float) $datos['totales']['igv'],
            (float) $datos['totales']['total'],
            0.05,
        );
        $this->assertStringContainsString('SOLES', $datos['totales']['total_letras']);
        $this->assertSame('03', $datos['comprobante']['tipo']); // Boleta
        $this->assertSame('1', $datos['receptor']['tipo_doc']); // DNI
    }

    public function test_generar_xml_produce_un_xml_ubl_bien_formado_con_los_nodos_clave(): void
    {
        $comprobante = Comprobante::find($this->idComprobante);
        $xml = app(ComprobanteService::class)->generarXml($comprobante);

        $doc = new DOMDocument;
        $this->assertTrue($doc->loadXML($xml), 'El XML generado no es válido/bien formado.');

        $xpath = new DOMXPath($doc);
        $xpath->registerNamespace('cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
        $xpath->registerNamespace('cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
        $xpath->registerNamespace('ds', 'http://www.w3.org/2000/09/xmldsig#');

        $this->assertSame('B001-00000001', $xpath->query('//cbc:ID')->item(0)->nodeValue);
        $this->assertSame('03', $xpath->query('//cbc:InvoiceTypeCode')->item(0)->nodeValue);
        $this->assertSame('20123456789', $xpath->query('//cac:AccountingSupplierParty//cbc:ID')->item(0)->nodeValue);
        $this->assertGreaterThan(0, $xpath->query('//cac:TaxTotal')->length);

        $pedido = DB::table('pedidos')->where('id_pedido', $this->idPedido)->first();
        $this->assertSame(
            number_format((float) $pedido->total, 2, '.', ''),
            $xpath->query('//cbc:PayableAmount')->item(0)->nodeValue,
        );

        // Firma XML-DSig presente (certificado de desarrollo -- NO es una firma
        // real de SUNAT, ver ComprobanteService).
        $this->assertSame(1, $xpath->query('//ds:Signature')->length);
        $this->assertNotEmpty($xpath->query('//ds:DigestValue')->item(0)->nodeValue);
        $this->assertNotEmpty($xpath->query('//ds:SignatureValue')->item(0)->nodeValue);

        $comprobante->refresh();
        $this->assertNotNull($comprobante->hash);
        $this->assertNotNull($comprobante->qr_data);
        $this->assertSame('no_enviado', $comprobante->estado_sunat);
    }
}
