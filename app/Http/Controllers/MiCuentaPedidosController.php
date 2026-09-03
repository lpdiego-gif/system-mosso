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
            ->leftJoin('comprobantes as c', 'c.fk_pedido', '=', 'p.id_pedido')
            ->where('p.fk_cliente', $clienteId)
            ->select(
                'p.id_pedido',
                'ep.nombre as estado',
                'p.subtotal',
                'p.descuento_total',
                'p.igv',
                'p.total',
                'p.fecha_pedido',
                'c.id_comprobante',
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

        // Se borran primero pago/comprobante/detalle/receptor a mano, sin
        // asumir que la FK en BD tenga ON DELETE CASCADE (las tablas del
        // dump original no pasan por migraciones de Laravel, así que no
        // hay garantía) -- así $pedido->delete() nunca falla por una
        // restricción de llave foránea.
        DB::transaction(function () use ($pedido) {
            $pedido->pago?->delete();
            $pedido->comprobante?->delete();
            $pedido->recojoTercero?->delete();
            $pedido->detalles()->delete();
            $pedido->delete();
        });

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

        // Guarda: un pedido sin líneas (dato corrupto/de prueba, o uno creado
        // antes de que crearPedidoPendiente() envolviera todo en una
        // transacción) no debe vaciar el carrito del cliente para luego no
        // poner nada en su lugar -- se avisa y no se toca el carrito.
        if ($pedido->detalles()->doesntExist()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Este pedido no tiene productos asociados y no se puede pagar. Elimínalo y vuelve a comprar, o contáctanos.',
            ]);

            return redirect()->route('mi-cuenta.pedidos');
        }

        // Primero se resuelven los productos que todavía existen; el carrito
        // no se toca hasta saber que hay al menos uno que agregar (si no,
        // vaciar el carrito para dejarlo igual de vacío solo confunde).
        $porAgregar = [];
        $huboProductosFaltantes = false;

        foreach ($pedido->detalles as $detalle) {
            if (Producto::whereKey($detalle->fk_producto)->doesntExist()) {
                $huboProductosFaltantes = true;

                continue;
            }

            $porAgregar[] = $detalle;
        }

        if ($porAgregar === []) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Ninguno de los productos de este pedido sigue disponible. Elimínalo y vuelve a comprar, o contáctanos.',
            ]);

            return redirect()->route('mi-cuenta.pedidos');
        }

        $carrito = $carritoService->resolverCarrito($request);

        // Se reemplaza el carrito por los productos de este pedido (no se
        // mezclan con lo que ya hubiera en el carrito, para no confundir el
        // total a pagar).
        CarritoDetalle::where('fk_carrito', $carrito->id_carrito)->delete();

        foreach ($porAgregar as $detalle) {
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
