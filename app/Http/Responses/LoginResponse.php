<?php

namespace App\Http\Responses;

use App\Services\CuentaService;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

/**
 * A dónde va un usuario justo después de iniciar sesión. Prioridad:
 *   1. `redirect` del propio formulario -- lo usa el modal de acceso
 *      (ModalAcceso) cuando se abre desde una acción puntual, ej. "Proceder
 *      al pago" en el carrito estando deslogueado: en vez de navegar a
 *      /checkout (que un guest no puede ver) y perder el modal, el botón
 *      abre el modal ahí mismo con `redirectTo="/checkout"`, y ese valor
 *      viaja como campo oculto hasta este punto.
 *   2. La URL protegida de la que venía (ej. un trabajador entrando a
 *      /admin/productos estando deslogueado) -- lo pone el middleware de
 *      Laravel en la sesión.
 *   3. Según sea trabajador o cliente (ver CuentaService).
 *
 * `redirect` llega en un POST normal, así que cualquiera podría mandar lo
 * que quiera ahí -- `esRutaLocalSegura()` exige que sea una ruta relativa
 * local (no un host externo) para no abrir una redirección abierta tras el
 * login.
 */
class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        $redirect = $request->string('redirect')->toString();

        if ($this->esRutaLocalSegura($redirect)) {
            return redirect()->to($redirect);
        }

        $intended = $request->session()->pull('url.intended');

        if ($intended) {
            return redirect()->to($intended);
        }

        $destino = app(CuentaService::class)->redirectPara($request->user());

        return redirect()->to($destino);
    }

    /**
     * Solo rutas relativas propias: empiezan con "/" pero no "//" (eso es una
     * URL protocol-relative a otro host) ni contienen un esquema ("://").
     */
    private function esRutaLocalSegura(string $ruta): bool
    {
        return $ruta !== ''
            && str_starts_with($ruta, '/')
            && ! str_starts_with($ruta, '//')
            && ! str_contains($ruta, '://');
    }
}
