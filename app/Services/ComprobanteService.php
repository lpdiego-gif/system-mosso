<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Models\CuentaBancaria;
use App\Models\Pedido;
use App\Services\Sunat\UblComprobanteXmlBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as PdfDocument;
use Endroid\QrCode\Builder\Builder as QrBuilder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Luecano\NumeroALetras\NumeroALetras;
use RuntimeException;

/**
 * Única fuente de la data de un comprobante (Boleta/Factura): PDF, XML y el
 * correo al cliente consumen exactamente el mismo array de `datos()`, así
 * que nunca pueden mostrarse cifras distintas entre ellos.
 *
 * FASE ACTUAL: solo preparación de datos para la futura facturación
 * electrónica. NO se firma con certificado real de SUNAT/PSE, NO se envía a
 * SUNAT, NO se procesa CDR ni resumen diario ni comunicación de baja — todo
 * eso es una fase posterior (ver MEMORIA_PROYECTO.md). `estado_sunat` vive
 * siempre en 'no_enviado' por ahora.
 */
class ComprobanteService
{
    public function __construct(
        private UblComprobanteXmlBuilder $xmlBuilder,
    ) {}

    /**
     * @return array{
     *     emisor: array<string, mixed>,
     *     receptor: array<string, mixed>,
     *     comprobante: array<string, mixed>,
     *     items: array<int, array<string, mixed>>,
     *     totales: array<string, mixed>,
     * }
     */
    public function datos(Comprobante $comprobante): array
    {
        $comprobante->loadMissing(['pedido.detalles.producto.unidadMedida', 'pedido.cliente.persona', 'tipoComprobante']);
        $pedido = $comprobante->pedido;

        if (! $pedido) {
            throw new RuntimeException("El comprobante #{$comprobante->id_comprobante} no tiene pedido asociado.");
        }

        [$items, $opGravadas, $igv] = $this->armarItems($pedido);

        $total = round($opGravadas + $igv, 2);
        $totalLetras = 'SON: '.(new NumeroALetras)->toInvoice($total, 2, 'SOLES');

        $diferencia = abs($total - (float) $pedido->total);
        if ($diferencia > 0.05) {
            throw new RuntimeException(
                "El total del comprobante (S/ {$total}) no cuadra con el total del pedido #{$pedido->id_pedido} (S/ {$pedido->total})."
            );
        }

        return [
            'emisor' => $this->datosEmisor($comprobante->fk_empresa),
            'receptor' => $this->datosReceptor($pedido, $comprobante->tipoComprobante->nombre),
            'comprobante' => [
                'tipo' => $comprobante->tipoComprobante->nombre === 'Factura' ? '01' : '03',
                'tipo_nombre' => $comprobante->tipoComprobante->nombre,
                'serie' => $comprobante->serie,
                'numero' => $comprobante->numero,
                'fecha_emision' => $comprobante->fecha_emision instanceof Carbon ? $comprobante->fecha_emision : Carbon::parse($comprobante->fecha_emision),
                'moneda' => $comprobante->moneda ?: 'PEN',
                'forma_pago' => 'Contado',
                'estado_sunat' => $comprobante->estado_sunat ?? 'no_enviado',
            ],
            'items' => $items,
            'totales' => [
                'op_gravadas' => number_format($opGravadas, 2, '.', ''),
                'op_exoneradas' => '0.00',
                'op_inafectas' => '0.00',
                'descuento_global' => '0.00',
                'igv' => number_format($igv, 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
                'total_letras' => $totalLetras,
            ],
        ];
    }

    /**
     * Genera (o devuelve, si ya existe) el XML UBL 2.1 del comprobante.
     * Idempotente: si `xml_path` ya apunta a un archivo existente, no
     * regenera nada.
     */
    public function generarXml(Comprobante $comprobante): string
    {
        if ($comprobante->xml_path && Storage::disk('local')->exists($comprobante->xml_path)) {
            return Storage::disk('local')->get($comprobante->xml_path);
        }

        $datos = $this->datos($comprobante);
        $certPem = $this->certificado();

        $xml = $this->xmlBuilder->build($datos, $certPem);

        $ruta = "comprobantes/{$datos['comprobante']['serie']}-{$datos['comprobante']['numero']}.xml";
        Storage::disk('local')->put($ruta, $xml);

        $hash = $this->extraerDigestValue($xml);
        $qrData = $this->qrTexto($datos, $hash);

        $comprobante->update([
            'xml_path' => $ruta,
            'hash' => $hash,
            'qr_data' => $qrData,
            'op_gravadas' => $datos['totales']['op_gravadas'],
            'op_exoneradas' => $datos['totales']['op_exoneradas'],
            'op_inafectas' => $datos['totales']['op_inafectas'],
            'descuento_global' => $datos['totales']['descuento_global'],
            'igv' => $datos['totales']['igv'],
            'total' => $datos['totales']['total'],
            'total_letras' => $datos['totales']['total_letras'],
        ]);

        return $xml;
    }

    /**
     * Construye el PDF (representación impresa) del comprobante. Genera el
     * XML primero si hace falta -- el PDF necesita el `hash`/`qr_data` que
     * deja ese paso. Quien llama decide si lo transmite (`->stream()`) o
     * obtiene los bytes (`->output()`, para adjuntar en un correo).
     */
    public function construirPdf(Comprobante $comprobante): PdfDocument
    {
        $this->generarXml($comprobante);
        $datos = $this->datos($comprobante);

        return Pdf::loadView('pdf.comprobante', [
            'datos' => $datos,
            'cuentasBancarias' => $this->cuentasBancariasDe($comprobante->fk_empresa),
            'logoDataUri' => $this->logoDataUri($datos['emisor']['logo'] ?? null),
            'qrDataUri' => $this->qrDataUri($comprobante->fresh()->qr_data ?? ''),
        ])->setPaper('a4', 'portrait');
    }

    private function cuentasBancariasDe(int $fkEmpresa): Collection
    {
        return CuentaBancaria::where('fk_empresa', $fkEmpresa)->activas()->get()->groupBy('banco');
    }

    private function logoDataUri(?string $logo): ?string
    {
        if (! $logo) {
            return null;
        }

        $path = Storage::disk('public')->path($logo);

        if (! file_exists($path)) {
            return null;
        }

        $mime = mime_content_type($path) ?: 'image/png';

        return "data:{$mime};base64,".base64_encode(file_get_contents($path));
    }

    private function qrDataUri(string $texto): ?string
    {
        if ($texto === '') {
            return null;
        }

        return (new QrBuilder(writer: new PngWriter, data: $texto, size: 160, margin: 4))
            ->build()
            ->getDataUri();
    }

    /**
     * Formato de texto del QR que usa SUNAT en sus comprobantes:
     * ruc|tipo|serie|numero|igv|total|fecha|tipoDocReceptor|numDocReceptor|hash
     */
    public function qrTexto(array $datos, string $hash): string
    {
        return implode('|', [
            $datos['emisor']['ruc'],
            $datos['comprobante']['tipo'],
            $datos['comprobante']['serie'],
            $datos['comprobante']['numero'],
            $datos['totales']['igv'],
            $datos['totales']['total'],
            $datos['comprobante']['fecha_emision']->format('Y-m-d'),
            $datos['receptor']['tipo_doc'],
            $datos['receptor']['num_doc'],
            $hash,
        ]);
    }

    private function certificado(): string
    {
        $ruta = (string) config('services.sunat.cert_path');

        if (! file_exists($ruta)) {
            throw new RuntimeException(
                "No existe el certificado de comprobantes en {$ruta}. Corre `php artisan comprobante:cert-dev`."
            );
        }

        return file_get_contents($ruta);
    }

    private function extraerDigestValue(string $xml): string
    {
        $doc = new \DOMDocument;
        $doc->loadXML($xml);
        $xpath = new \DOMXPath($doc);
        $xpath->registerNamespace('ds', 'http://www.w3.org/2000/09/xmldsig#');

        return (string) $xpath->query('//ds:DigestValue')->item(0)?->nodeValue;
    }

    /**
     * @return array{0: array<int, array<string, mixed>>, 1: float, 2: float} [items, op_gravadas, igv]
     */
    private function armarItems(Pedido $pedido): array
    {
        $items = [];
        $opGravadas = 0.0;
        $igv = 0.0;

        foreach ($pedido->detalles as $detalle) {
            $producto = $detalle->producto;
            $precioListaConIgv = (float) $detalle->precio_unitario;
            $descuentoUnitConIgv = (float) $detalle->descuento_unitario;
            $precioNetoConIgv = round($precioListaConIgv - $descuentoUnitConIgv, 2);

            $valorUnitario = round($precioNetoConIgv / 1.18, 4);
            $valorVentaLinea = round($valorUnitario * (int) $detalle->cantidad, 2);
            $igvLinea = round($valorVentaLinea * 0.18, 2);

            $items[] = [
                'codigo' => $producto?->codigo_barras ?: $producto?->sku ?: (string) $detalle->fk_producto,
                'descripcion' => $producto?->nombre ?? 'Producto',
                'unidad' => $producto?->codigoUnidadSunat() ?? 'NIU',
                'cantidad' => (int) $detalle->cantidad,
                'precio_unitario' => number_format($precioListaConIgv, 2, '.', ''),
                'descuento_unitario' => number_format($descuentoUnitConIgv, 2, '.', ''),
                'descuento_linea' => number_format($descuentoUnitConIgv * (int) $detalle->cantidad, 2, '.', ''),
                'valor_unitario' => number_format($valorUnitario, 4, '.', ''),
                'valor_venta_linea' => number_format($valorVentaLinea, 2, '.', ''),
                'igv_linea' => number_format($igvLinea, 2, '.', ''),
                'total_linea' => number_format($valorVentaLinea + $igvLinea, 2, '.', ''),
                'tip_afectacion' => '10',
            ];

            $opGravadas += $valorVentaLinea;
            $igv += $igvLinea;
        }

        // El envío (si lo hubo) es parte de la venta gravada y tiene que
        // aparecer en el comprobante: si no se itemiza, `total` nunca cuadra
        // con `pedidos.total` (que sí lo incluye). Mismo cálculo que ya usa
        // CheckoutController::confirmacion() para mostrar el costo de envío.
        $costoEnvioConIgv = round((float) $pedido->total - ((float) $pedido->subtotal - (float) $pedido->descuento_total), 2);

        if ($costoEnvioConIgv > 0.005) {
            $valorUnitario = round($costoEnvioConIgv / 1.18, 4);
            $igvLinea = round($valorUnitario * 0.18, 2);

            $items[] = [
                'codigo' => 'ENVIO',
                'descripcion' => 'Servicio de envío',
                'unidad' => 'NIU',
                'cantidad' => 1,
                'precio_unitario' => number_format($costoEnvioConIgv, 2, '.', ''),
                'descuento_unitario' => '0.00',
                'descuento_linea' => '0.00',
                'valor_unitario' => number_format($valorUnitario, 4, '.', ''),
                'valor_venta_linea' => number_format($valorUnitario, 2, '.', ''),
                'igv_linea' => number_format($igvLinea, 2, '.', ''),
                'total_linea' => number_format($valorUnitario + $igvLinea, 2, '.', ''),
                'tip_afectacion' => '10',
            ];

            $opGravadas += $valorUnitario;
            $igv += $igvLinea;
        }

        return [$items, round($opGravadas, 2), round($igv, 2)];
    }

    /**
     * @return array<string, mixed>
     */
    private function datosEmisor(int $fkEmpresa): array
    {
        $empresa = DB::table('empresa as e')
            ->leftJoin('direcciones as d', 'd.id_direccion', '=', 'e.fk_direccion')
            ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->leftJoin('provincias as prov', 'prov.id_provincia', '=', 'dist.fk_provincia')
            ->leftJoin('departamentos as dep', 'dep.id_departamento', '=', 'prov.fk_departamento')
            ->where('e.id_empresa', $fkEmpresa)
            ->select([
                'e.ruc', 'e.razon_social', 'e.nombre_comercial', 'e.logo', 'e.correo',
                'e.telefono', 'e.celular', 'e.website',
                'd.direccion', 'dist.nombre as distrito', 'dist.ubigeo',
                'prov.nombre as provincia', 'dep.nombre as departamento',
            ])
            ->first();

        if (! $empresa) {
            throw new RuntimeException('No se encontró la empresa emisora (fk_empresa inválido).');
        }

        return [
            'ruc' => $empresa->ruc,
            'razon_social' => $empresa->razon_social,
            'nombre_comercial' => $empresa->nombre_comercial,
            'direccion_linea' => $empresa->direccion,
            'ubigeo' => $empresa->ubigeo,
            'distrito' => $empresa->distrito,
            'provincia' => $empresa->provincia,
            'departamento' => $empresa->departamento,
            'pais' => 'PE',
            'telefono' => $empresa->telefono,
            'celular' => $empresa->celular,
            'email' => $empresa->correo,
            'website' => $empresa->website,
            'logo' => $empresa->logo,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function datosReceptor(Pedido $pedido, string $tipoComprobanteNombre): array
    {
        $cliente = $pedido->cliente;
        $persona = $cliente?->persona;

        $direccion = null;
        if ($pedido->fk_direccion_envio) {
            $direccion = DB::table('direcciones')->where('id_direccion', $pedido->fk_direccion_envio)->value('direccion');
        }

        if ($tipoComprobanteNombre === 'Factura') {
            return [
                'tipo_doc' => '6',
                'num_doc' => $cliente?->ruc ?: '00000000000',
                'nombre' => $cliente?->razon_social ?: 'CLIENTE VARIOS',
                'direccion' => $direccion,
            ];
        }

        if ($persona && filled($persona->num_documento)) {
            $tipoDocumento = DB::table('tipo_documento')->where('id_tipo_documento', $persona->fk_tipo_documento)->value('nombre');

            // Catálogo N°06 SUNAT (Tipo de Documento de Identidad). `tipo_documento`
            // interno (DNI=1, CE=2, Pasaporte=3) NO son los códigos SUNAT.
            $codigoSunat = match ($tipoDocumento) {
                'CE' => '4',
                'Pasaporte' => '7',
                default => '1', // DNI
            };

            return [
                'tipo_doc' => $codigoSunat,
                'num_doc' => $persona->num_documento,
                'nombre' => trim("{$persona->nombres} {$persona->apellido_paterno} {$persona->apellido_materno}"),
                'direccion' => $direccion,
            ];
        }

        return [
            'tipo_doc' => '0',
            'num_doc' => '00000000',
            'nombre' => 'CLIENTE VARIOS',
            'direccion' => $direccion,
        ];
    }
}
