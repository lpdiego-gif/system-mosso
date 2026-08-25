<?php

namespace App\Http\Responses;

use App\Services\CuentaService;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

/**
 * A dónde va un usuario justo después de iniciar sesión. Si venía de una URL
 * protegida (ej. un trabajador intentando entrar a /admin/productos estando
 * deslogueado) respeta esa intención; si no, decide según sea trabajador o
 * cliente (ver CuentaService).
 */
class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        $intended = $request->session()->pull('url.intended');

        if ($intended) {
            return redirect()->to($intended);
        }

        $destino = app(CuentaService::class)->redirectPara($request->user());

        return redirect()->to($destino);
    }
}
