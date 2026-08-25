<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
        $user = $request->user();

        return Inertia::render('mi-cuenta', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}
