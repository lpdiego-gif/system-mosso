<?php

namespace App\Http\Controllers;

use App\Http\Requests\Checkout\IniciarCheckoutRequest;
use App\Models\Cliente;
use App\Models\Pago;
use App\Models\Pedido;
use App\Services\CheckoutService;
use App\Services\CuentaService;
use App\Services\CulqiService;
use App\Services\DeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Checkout ("Proceder al pago"): recopila datos del comprador, comprobante,
 * entrega y receptor, crea el pedido en "Pendiente de pago" y procesa el cobro
 * con Culqi. Todo lo crítico (precios, stock, envío, totales) se recalcula en
 * el servidor — nunca se confía en lo que envía React.
 */
class CheckoutController extends Controller
{
    public function __construct(
        private CheckoutService $checkout,
        private DeliveryService $delivery,
        private CulqiService $culqi,
        private CuentaService $cuenta,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $cliente = $this->cliente($request);
        $resumen = $this->checkout->resumenCarrito($cliente);

        if (empty($resumen['items'])) {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Tu carrito está vacío.']);

            return redirect()->route('carrito.index');
        }

        $persona = $cliente->fk_persona
            ? DB::table('personas')->where('id_persona', $cliente->fk_persona)
                ->select('fk_tipo_documento', 'num_documento', 'nombres', 'apellido_paterno', 'apellido_materno', 'telefono')
                ->first()
            : null;

        return Inertia::render('checkout/index', [
            'resumen' => $resumen,
            'comprador' => [
                'correo' => $cliente->correo,
                'persona' => $persona,
                'datos_completos' => $this->checkout->datosCompletos($cliente),
            ],
            'facturacion' => [
                'razon_social' => $cliente->razon_social,
                'ruc' => $cliente->ruc,
            ],
            'tiposDocumento' => DB::table('tipo_documento')->select('id_tipo_documento', 'nombre')->orderBy('id_tipo_documento')->get(),
            'tipoEntregas' => DB::table('tipo_entregas')->select('id_tipo_entrega', 'nombre', 'requiere_direccion')->orderBy('id_tipo_entrega')->get(),
            'direcciones' => $this->direccionesDe($cliente->id_cliente),
            'departamentos' => DB::table('departamentos')->select('id_departamento', 'nombre')->orderBy('nombre')->get(),
            'provincias' => DB::table('provincias')->select('id_provincia', 'nombre', 'fk_departamento')->orderBy('nombre')->get(),
            'distritos' => DB::table('distritos')->select('id_distrito', 'nombre', 'fk_provincia', 'costo_envio')->orderBy('nombre')->get(),
            'empresa' => $this->empresa(),
            'igvIncluido' => true,
            'culqiPublicKey' => $this->culqi->publicKey(),
            'culqiConfigurado' => $this->culqi->configurado(),
        ]);
    }

    /**
     * Cotiza el costo de envío para un distrito, usando el subtotal REAL del
     * carrito del cliente (no un valor enviado por el cliente).
     */
    public function envio(Request $request, int $distrito): JsonResponse
    {
        $cliente = $this->cliente($request);
        $resumen = $this->checkout->resumenCarrito($cliente);
        $base = $resumen['subtotal'] - $resumen['descuento_total'];

        return response()->json($this->delivery->cotizar($distrito, $base));
    }

    public function iniciar(IniciarCheckoutRequest $request): JsonResponse
    {
        $cliente = $request->cliente();
        $pedido = $this->checkout->crearPedidoPendiente($cliente, $request->validated());
        $pago = Pago::where('fk_pedido', $pedido->id_pedido)->firstOrFail();

        return response()->json([
            'pedido_id' => $pedido->id_pedido,
            'monto' => (float) $pago->monto,
            'monto_centimos' => (int) round($pago->monto * 100),
            'referencia' => $pago->referencia,
            'culqi_public_key' => $this->culqi->publicKey(),
            'email' => $cliente->correo,
        ]);
    }

    /**
     * Crea una Order de Culqi para el pedido. Necesaria para pagar con Yape
     * (Culqi Checkout Custom no habilita Yape sin una `order`).
     */
    public function orden(Request $request, Pedido $pedido): JsonResponse
    {
        $cliente = $this->cliente($request);
        abort_unless($pedido->fk_cliente === $cliente->id_cliente, 403);

        $pago = Pago::where('fk_pedido', $pedido->id_pedido)->firstOrFail();

        if ($pago->estado === 'pagado') {
            return response()->json(['message' => 'Este pedido ya fue pagado.'], 409);
        }

        $persona = $cliente->fk_persona
            ? DB::table('personas')->where('id_persona', $cliente->fk_persona)->first()
            : null;

        $resultado = $this->culqi->crearOrden(
            montoCentimos: (int) round($pago->monto * 100),
            descripcion: "Pedido #{$pedido->id_pedido} - MOSSO",
            cliente: [
                'first_name' => $persona->nombres ?? 'Cliente',
                'last_name' => $persona->apellido_paterno ?? 'MOSSO',
                'phone_number' => $persona->telefono ?? '000000000',
                'email' => $cliente->correo,
            ],
            orderNumber: "MOSSO-{$pedido->id_pedido}-".time(),
            metadata: ['pedido' => (string) $pedido->id_pedido, 'referencia' => (string) $pago->referencia],
        );

        if (! $resultado['ok']) {
            return response()->json(['message' => $resultado['mensaje'] ?? 'No se pudo iniciar el pago con Yape.'], 502);
        }

        return response()->json(['order_id' => $resultado['id']]);
    }

    public function pagar(Request $request, Pedido $pedido): RedirectResponse
    {
        $cliente = $this->cliente($request);
        abort_unless($pedido->fk_cliente === $cliente->id_cliente, 403);

        $data = $request->validate([
            'culqi_token' => ['required_without:culqi_order_id', 'prohibits:culqi_order_id', 'nullable', 'string', 'max:120'],
            'culqi_order_id' => ['required_without:culqi_token', 'nullable', 'string', 'max:120'],
            'comprobante' => ['nullable', 'in:boleta,factura'],
        ]);

        $pago = Pago::where('fk_pedido', $pedido->id_pedido)->firstOrFail();

        $reclamo = $this->checkout->reclamarParaCobro($pedido);

        if ($reclamo === 'ya_pagado') {
            return redirect()->route('checkout.confirmacion', $pedido->id_pedido);
        }

        if ($reclamo === 'en_proceso') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Ya hay un pago en proceso para este pedido. Espera un momento.']);

            return back();
        }

        // Verifica stock ANTES de confirmar el pago: si falta, se libera el pago.
        $faltante = $this->checkout->stockInsuficiente($pedido);

        if ($faltante !== null) {
            $this->checkout->marcarPagoFallido($pedido);
            Inertia::flash('toast', ['type' => 'error', 'message' => $faltante]);

            return back();
        }

        // Rama tarjeta: se crea el cargo. Rama Yape: se verifica que la orden
        // (ya pagada en el checkout de Culqi) esté en estado `paid`.
        if (! empty($data['culqi_token'])) {
            $resultado = $this->culqi->cobrar(
                token: $data['culqi_token'],
                montoCentimos: (int) round($pago->monto * 100),
                email: $cliente->correo,
                descripcion: "Pedido #{$pedido->id_pedido} - MOSSO",
                metadata: ['pedido' => (string) $pedido->id_pedido, 'referencia' => (string) $pago->referencia],
            );

            if (! $resultado['ok']) {
                $this->checkout->marcarPagoFallido($pedido);
                Inertia::flash('toast', ['type' => 'error', 'message' => $resultado['mensaje'] ?? 'No se pudo procesar el pago.']);

                return back();
            }

            $transaccionId = $resultado['id'];
        } else {
            $orden = $this->culqi->obtenerOrden($data['culqi_order_id']);

            if (! $orden['ok'] || $orden['state'] !== 'paid') {
                $this->checkout->marcarPagoFallido($pedido);
                Inertia::flash('toast', ['type' => 'error', 'message' => 'El pago con Yape no se completó. Intenta nuevamente.']);

                return back();
            }

            $transaccionId = $data['culqi_order_id'];
        }

        try {
            $this->checkout->confirmarPago($pedido, $transaccionId, $data['comprobante'] ?? null);
        } catch (ValidationException $e) {
            // Culqi ya cobró pero el stock cambió en el último instante: se avisa
            // al cliente y queda registrado para revisión/devolución manual.
            Log::critical('Checkout: cobro exitoso pero no se pudo confirmar el pedido', [
                'pedido' => $pedido->id_pedido,
                'transaccion_culqi' => $transaccionId,
                'motivo' => $e->getMessage(),
            ]);

            Inertia::flash('toast', ['type' => 'error', 'message' => 'Tu pago se registró pero hubo un problema con el stock. Nuestro equipo se pondrá en contacto contigo.']);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Pago confirmado! Tu pedido está en camino.']);

        return redirect()->route('checkout.confirmacion', $pedido->id_pedido);
    }

    public function confirmacion(Request $request, Pedido $pedido): Response|RedirectResponse
    {
        $cliente = $this->cliente($request);
        abort_unless($pedido->fk_cliente === $cliente->id_cliente, 403);

        $pedido->load(['detalles.producto.marca', 'tipoEntrega', 'estadoPedido', 'pago', 'comprobante.tipoComprobante', 'recojoTercero', 'direccionEnvio']);

        if (! $pedido->pago || $pedido->pago->estado !== 'pagado') {
            return redirect()->route('checkout.show');
        }

        $direccion = null;
        if ($pedido->fk_direccion_envio) {
            $direccion = DB::table('direcciones as d')
                ->join('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
                ->where('d.id_direccion', $pedido->fk_direccion_envio)
                ->select('d.direccion', 'd.referencia', 'dist.nombre as distrito')
                ->first();
        }

        return Inertia::render('checkout/confirmacion', [
            'pedido' => [
                'id' => $pedido->id_pedido,
                'fecha' => $pedido->fecha_pedido?->toDateTimeString(),
                'subtotal' => (float) $pedido->subtotal,
                'descuento_total' => (float) $pedido->descuento_total,
                'igv' => (float) $pedido->igv,
                'total' => (float) $pedido->total,
                'costo_envio' => round((float) $pedido->total - ((float) $pedido->subtotal - (float) $pedido->descuento_total), 2),
                'tipo_entrega' => $pedido->tipoEntrega?->nombre,
                'estado' => $pedido->estadoPedido?->nombre,
                'items' => $pedido->detalles->map(fn ($d) => [
                    'nombre' => $d->producto?->nombre,
                    'marca' => $d->producto?->marca?->nombre,
                    'imagen' => $d->producto?->imagen_principal ? Storage::url($d->producto->imagen_principal) : null,
                    'cantidad' => $d->cantidad,
                    'precio_final' => (float) $d->precio_unitario - (float) $d->descuento_unitario,
                    'subtotal' => (float) $d->subtotal,
                ])->values(),
            ],
            'comprobante' => $pedido->comprobante ? [
                'tipo' => $pedido->comprobante->tipoComprobante?->nombre,
                'serie' => $pedido->comprobante->serie,
                'numero' => $pedido->comprobante->numero,
            ] : null,
            'pago' => [
                'transaccion' => $pedido->pago->id_transaccion_culqi,
                'monto' => (float) $pedido->pago->monto,
            ],
            'direccion' => $direccion,
            'receptor' => $pedido->recojoTercero ? [
                'nombres' => $pedido->recojoTercero->nombres,
                'apellidos' => $pedido->recojoTercero->apellidos,
                'telefono' => $pedido->recojoTercero->telefono,
            ] : null,
            'empresa' => $this->empresa(),
        ]);
    }

    // --------------------------------------------------------------- Internos

    private function cliente(Request $request): Cliente
    {
        $clienteId = $this->cuenta->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Necesitas una cuenta de cliente para comprar.');

        return Cliente::findOrFail($clienteId);
    }

    private function direccionesDe(int $clienteId): Collection
    {
        return DB::table('cliente_direcciones as cd')
            ->join('direcciones as d', 'd.id_direccion', '=', 'cd.fk_direccion')
            ->join('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->join('provincias as p', 'p.id_provincia', '=', 'dist.fk_provincia')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->where('cd.fk_cliente', $clienteId)
            ->select([
                'cd.id_cliente_direccion', 'cd.alias', 'cd.es_principal',
                'd.id_direccion', 'd.direccion', 'd.referencia',
                'dist.id_distrito', 'dist.nombre as distrito', 'dist.costo_envio',
                'p.nombre as provincia', 'dep.nombre as departamento',
            ])
            ->orderByDesc('cd.es_principal')
            ->orderBy('cd.id_cliente_direccion')
            ->get();
    }

    private function empresa(): ?object
    {
        return DB::table('empresa as e')
            ->leftJoin('direcciones as d', 'd.id_direccion', '=', 'e.fk_direccion')
            ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->select([
                'e.nombre_comercial', 'e.razon_social', 'e.ruc', 'e.correo', 'e.telefono',
                'd.direccion', 'd.referencia', 'dist.nombre as distrito',
            ])
            ->first();
    }
}
