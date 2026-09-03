<?php

namespace App\Http\Controllers;

use App\Mail\ComprobanteMail;
use App\Models\Comprobante;
use App\Services\ComprobanteService;
use App\Services\CuentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Comprobante (Boleta/Factura) de un pedido pagado: PDF (representación
 * impresa), XML (SUNAT UBL 2.1, ver ComprobanteService) y reenvío por correo.
 * El cliente dueño del pedido ve los suyos; un trabajador con `ventas.ver`
 * ve cualquiera — de ahí que la autorización se resuelva acá y no solo con
 * middleware de ruta (necesita el "OR" entre ambos casos).
 */
class ComprobanteController extends Controller
{
    public function __construct(
        private ComprobanteService $comprobantes,
        private CuentaService $cuenta,
    ) {}

    public function pdf(Request $request, Comprobante $comprobante)
    {
        $this->autorizarVer($request, $comprobante);

        return $this->comprobantes->construirPdf($comprobante)
            ->stream("{$comprobante->serie}-{$comprobante->numero}.pdf");
    }

    public function xml(Request $request, Comprobante $comprobante)
    {
        $this->autorizarVer($request, $comprobante);

        $xml = $this->comprobantes->generarXml($comprobante);

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => "attachment; filename=\"{$comprobante->serie}-{$comprobante->numero}.xml\"",
        ]);
    }

    public function reenviar(Request $request, Comprobante $comprobante): JsonResponse
    {
        $esTrabajador = $this->cuenta->esTrabajador($request->user());

        if ($esTrabajador) {
            abort_unless($request->user()->can('permiso', 'ventas.gestionar'), 403);

            $data = $request->validate([
                'email' => ['nullable', 'email', 'max:150'],
                'incluir_xml' => ['nullable', 'boolean'],
            ]);

            $comprobante->loadMissing('pedido.cliente');
            $destino = $data['email'] ?: $comprobante->pedido->cliente?->correo;
            $incluirXml = (bool) ($data['incluir_xml'] ?? false);
        } else {
            $this->autorizarVer($request, $comprobante);
            $comprobante->loadMissing('pedido.cliente');
            $destino = $comprobante->pedido->cliente?->correo;
            $incluirXml = false;
        }

        if (! $destino) {
            return response()->json(['message' => 'No hay un correo de destino para este comprobante.'], 422);
        }

        $pdfBinario = $this->comprobantes->construirPdf($comprobante)->output();
        $datos = $this->comprobantes->datos($comprobante);
        $xmlPath = $incluirXml && $comprobante->xml_path ? Storage::disk('local')->path($comprobante->xml_path) : null;

        try {
            Mail::to($destino)->send(new ComprobanteMail($datos, $pdfBinario, $xmlPath));
            $comprobante->update(['correo_enviado_en' => now()]);
        } catch (Throwable $e) {
            Log::warning('No se pudo reenviar el comprobante por correo', [
                'comprobante' => $comprobante->id_comprobante,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'No se pudo enviar el correo. Intenta nuevamente.'], 500);
        }

        return response()->json(['message' => "Comprobante reenviado a {$destino}."]);
    }

    private function autorizarVer(Request $request, Comprobante $comprobante): void
    {
        $user = $request->user();

        if ($this->cuenta->esTrabajador($user)) {
            abort_unless($user->can('permiso', 'ventas.ver'), 403);

            return;
        }

        $clienteId = $this->cuenta->clienteIdDe($user);
        $comprobante->loadMissing('pedido');

        abort_unless($clienteId !== null && $comprobante->pedido?->fk_cliente === $clienteId, 403);
    }
}
