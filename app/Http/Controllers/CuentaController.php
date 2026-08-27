<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class CuentaController extends Controller
{
    /**
     * Puerta pública de login/registro. Si ya hay sesión, no tiene sentido
     * mostrar el formulario: se manda directo a donde le toque (mi-cuenta o
     * el panel admin), igual que hace LoginResponse tras un login exitoso.
     *
     * Es la ÚNICA pantalla de acceso de la app: `/login` y `/register` de
     * Fortify redirigen aquí (ver FortifyServiceProvider). Por eso recibe los
     * mismos props que antes usaba `auth/login.tsx` (`canResetPassword`,
     * `status`).
     */
    public function show(Request $request, CuentaService $cuentaService): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->hasVerifiedEmail()) {
            return redirect()->to($cuentaService->redirectPara($user));
        }

        return Inertia::render('cuenta', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
            // Cliente autenticado con el correo aún sin verificar: en vez de
            // redirigir (bucle) le mostramos el paso del código para su correo.
            'emailPendiente' => $user && ! $user->hasVerifiedEmail() ? $user->email : null,
        ]);
    }
}
