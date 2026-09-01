<?php

namespace App\Http\Controllers;

use App\Models\CarritoDetalle;
use App\Models\Pedido;
use App\Models\Producto;
use App\Services\CarritoService;
use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MiCuentaPedidosController extends Controller
{
    public function index(Request $request, CuentaService $cuentaService): Response
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        $pedidos = DB::table('pedidos as p')
            ->join('estados_pedido as ep', 'ep.id_estado_pedido', '=', 'p.fk_estado_pedido')
            ->where('p.fk_cliente', $clienteId)
            ->select(
                'p.id_pedido',
                'ep.nombre as estado',
                'p.subtotal',
                'p.descuento_total',
                'p.igv',
                'p.total',
                'p.fecha_pedido',
            )
            ->orderByDesc('p.fecha_pedido')
            ->get()
            // DB::table() no aplica los casts del modelo Pedido: los decimales
            // llegan como string desde MySQL y el frontend hace .toFixed()
            // sobre ellos, lo que rompía el render (pantalla en blanco).
            ->map(function ($p) {
                $p->subtotal = (float) $p->subtotal;
                $p->descuento_total = (float) $p->descuento_total;
                $p->igv = (float) $p->igv;
                $p->total = (float) $p->total;

                return $p;
            });

        return Inertia::render('mi-cuenta-pedidos', [
            'pedidos' => $pedidos,
        ]);
    }

    /**
     * El cliente cancela/elimina un pedido que quedó "Pendiente de pago"
     * (por ejemplo, si abandonó el pago o ya no quiere continuar). Solo se
     * permite mientras no exista un pago confirmado -- mismo criterio que
     * usa CheckoutService::descartarPedidosPendientes() al reintentar el
     * checkout, así que es seguro: nunca borra un pedido ya pagado.
     */
    public function cancelar(Request $request, CuentaService $cuentaService, Pedido $pedido): RedirectResponse
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');
        abort_unless($pedido->fk_cliente === $clienteId, 403);

        $yaPagado = $pedido->pago && $pedido->pago->estado === 'pagado';

        if ($yaPagado) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Este pedido ya fue pagado, no se puede eliminar. Si quieres devolverlo, usa "Cambios y devoluciones".',
            ]);

            return back();
        }

        $pedido->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pedido eliminado correctamente.',
        ]);

        return redirect()->route('mi-cuenta.pedidos');
    }

    /**
     * "Ir a pagar" de un pedido "Pendiente de pago": el checkout siempre
     * cobra sobre el carrito ACTUAL del cliente (nunca sobre el pedido en
     * sí), así que aquí reemplazamos el carrito por los mismos productos y
     * cantidades del pedido antes de mandarlo a /checkout. El pedido
     * pendiente anterior se descarta solo cuando complete un nuevo intento
     * de pago (ver CheckoutService::descartarPedidosPendientes()).
     */
    public function reintentarPago(Request $request, CuentaService $cuentaService, CarritoService $carritoService, Pedido $pedido): RedirectResponse
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');
        abort_unless($pedido->fk_cliente === $clienteId, 403);

        $yaPagado = $pedido->pago && $pedido->pago->estado === 'pagado';

        if ($yaPagado) {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Este pedido ya fue pagado.']);

            return redirect()->route('checkout.confirmacion', $pedido->id_pedido);
        }

        $carrito = $carritoService->resolverCarrito($request);

        // Se reemplaza el carrito por los productos de este pedido (no se
        // mezclan con lo que ya hubiera en el carrito, para no confundir el
        // total a pagar).
        CarritoDetalle::where('fk_carrito', $carrito->id_carrito)->delete();

        $huboProductosFaltantes = false;

        foreach ($pedido->detalles as $detalle) {
            $producto = Producto::find($detalle->fk_producto);

            if (! $producto) {
                $huboProductosFaltantes = true;

                continue;
            }

            $carritoService->agregarProducto($carrito, $detalle->fk_producto, $detalle->cantidad);
        }

        if ($huboProductosFaltantes) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'Algunos productos de tu pedido ya no están disponibles y no se agregaron al carrito.',
            ]);
        }

        return redirect()->route('checkout.show');
    }
}
