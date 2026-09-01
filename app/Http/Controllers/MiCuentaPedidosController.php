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
}
