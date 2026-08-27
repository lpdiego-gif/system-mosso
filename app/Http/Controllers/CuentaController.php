<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CuentaController extends Controller
{
    /**
     * Puerta pública de login/registro. Si ya hay sesión, no tiene sentido
     * mostrar el formulario: se manda directo a donde le toque (mi-cuenta o
     * el panel admin), igual que hace LoginResponse tras un login exitoso.
     */
    public function show(Request $request, CuentaService $cuentaService): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            return redirect()->to($cuentaService->redirectPara($user));
        }

        return Inertia::render('cuenta');
    }
}
