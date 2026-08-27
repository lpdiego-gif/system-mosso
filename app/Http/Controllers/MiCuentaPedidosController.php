<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
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
            ->get();

        return Inertia::render('mi-cuenta-pedidos', [
            'pedidos' => $pedidos,
        ]);
    }
}
