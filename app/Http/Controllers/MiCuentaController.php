<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MiCuentaController extends Controller
{
    /**
     * Escritorio de "Mi cuenta" del cliente. Pedidos/Direcciones/Detalles
     * (los otros ítems del menú) todavía no tienen página propia.
     */
    public function index(Request $request): Response
    {
        $user      = $request->user();
        $clienteId = DB::table('clientes')->where('fk_user', $user->id)->value('id_cliente');

        $resumen = [
            'total_pedidos'   => $clienteId ? DB::table('pedidos')->where('fk_cliente', $clienteId)->count() : 0,
            'total_mascotas'  => $clienteId ? DB::table('mascotas')->where('fk_cliente', $clienteId)->count() : 0,
            'total_puntos'    => $clienteId ? (int) DB::table('puntos_cliente')->where('fk_cliente', $clienteId)->sum('monto') : 0,
            'cupones_activos' => $clienteId
                ? DB::table('cupones')
                    ->where('fk_cliente', $clienteId)
                    ->where('usado', 0)
                    ->where('fecha_vencimiento', '>=', now()->toDateString())
                    ->count()
                : 0,
        ];

        return Inertia::render('mi-cuenta', [
            'user'    => ['name' => $user->name, 'email' => $user->email],
            'resumen' => $resumen,
        ]);
    }
}
