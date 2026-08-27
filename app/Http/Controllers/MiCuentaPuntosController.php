<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MiCuentaPuntosController extends Controller
{
    public function index(Request $request, CuentaService $cuentaService): Response
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $movimientos = DB::table('puntos_cliente')
            ->where('fk_cliente', $clienteId)
            ->select('id_punto', 'tipo', 'monto', 'fecha', 'fecha_vencimiento', 'descripcion')
            ->orderByDesc('fecha')
            ->get();

        // Saldo activo: suma movimientos no vencidos.
        $totalPuntos = $movimientos
            ->filter(fn ($m) => ! $m->fecha_vencimiento || now()->lte($m->fecha_vencimiento))
            ->sum('monto');

        $cupones = DB::table('cupones')
            ->where('fk_cliente', $clienteId)
            ->select('id_cupon', 'codigo', 'origen', 'tipo', 'valor', 'fecha_emision', 'fecha_vencimiento', 'usado')
            ->orderBy('usado')
            ->orderByDesc('fecha_emision')
            ->get();

        return Inertia::render('mi-cuenta-puntos', [
            'total_puntos' => max(0, $totalPuntos),
            'movimientos'  => $movimientos,
            'cupones'      => $cupones,
        ]);
    }

    private function clienteId(Request $request, CuentaService $cuentaService): int
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        return $clienteId;
    }
}
