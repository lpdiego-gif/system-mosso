<?php

namespace App\Listeners;

use App\Services\CarritoService;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Request as RequestFacade;

/**
 * Se ejecuta justo después de una autenticación exitosa (login normal,
 * passkey, o el 2° paso del autorregistro de cliente -- todos disparan
 * Illuminate\Auth\Events\Login). Si el usuario armó un carrito como
 * invitado antes de iniciar sesión, lo fusiona con el carrito de su cuenta
 * de cliente para que no lo vea "vacío" justo después de loguearse.
 *
 * Auto-descubierto por Laravel al escuchar Login, igual que
 * CheckTrabajadorActivo -- no requiere registro manual.
 */
class FusionarCarritoInvitado
{
    public function __construct(private CarritoService $carritoService) {}

    public function handle(Login $event): void
    {
        $request = RequestFacade::instance();

        if (! $request->hasSession()) {
            return;
        }

        $this->carritoService->fusionarCarritoInvitado($request, $event->user);
    }
}
