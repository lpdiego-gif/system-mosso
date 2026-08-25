<?php

namespace App\Services;

use App\Models\Carrito;
use App\Models\CarritoDetalle;
use App\Models\Cliente;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CarritoService
{
    /**
     * Obtiene o crea el carrito para el usuario actual (cliente o invitado).
     * Para invitados genera un token UUID y lo encola como cookie (30 días).
     */
    public function resolverCarrito(Request $request): Carrito
    {
        if ($request->user()) {
            $cliente = Cliente::where('fk_user', $request->user()->id)->first();
            if ($cliente) {
                return Carrito::firstOrCreate(
                    ['fk_cliente' => $cliente->id_cliente],
                );
            }
        }

        $token = $this->obtenerOGenerarToken($request);

        return Carrito::firstOrCreate(
            ['token_invitado' => $token],
        );
    }

    /**
     * Cuenta los ítems del carrito activo sin crearlo si no existe.
     * Seguro para llamar desde el middleware en cada request.
     */
    public function contarItems(Request $request): int
    {
        $carrito = $this->encontrarCarrito($request);
        if (! $carrito) {
            return 0;
        }

        return (int) CarritoDetalle::where('fk_carrito', $carrito->id_carrito)
            ->sum('cantidad');
    }

    /**
     * Agrega un producto al carrito. Si ya existe, suma la cantidad.
     * Guarda el precio actual del producto como precio_unitario.
     */
    public function agregarProducto(Carrito $carrito, int $productoId, int $cantidad): void
    {
        $producto = Producto::findOrFail($productoId);

        $existente = CarritoDetalle::where('fk_carrito', $carrito->id_carrito)
            ->where('fk_producto', $productoId)
            ->first();

        if ($existente) {
            $existente->update(['cantidad' => $existente->cantidad + $cantidad]);
        } else {
            CarritoDetalle::create([
                'fk_carrito'      => $carrito->id_carrito,
                'fk_producto'     => $productoId,
                'cantidad'        => $cantidad,
                'precio_unitario' => $producto->precio,
            ]);
        }
    }

    /**
     * Devuelve los ítems del carrito formateados para el frontend.
     */
    public function obtenerItems(Carrito $carrito): Collection
    {
        return CarritoDetalle::where('fk_carrito', $carrito->id_carrito)
            ->with(['producto.marca'])
            ->get()
            ->map(fn (CarritoDetalle $d) => [
                'id'             => $d->id_carrito_detalle,
                'producto_id'    => $d->fk_producto,
                'nombre'         => $d->producto->nombre,
                'marca'          => $d->producto->marca?->nombre,
                'imagen'         => $d->producto->imagen_principal
                                    ? Storage::url($d->producto->imagen_principal)
                                    : null,
                'precio_unitario' => (float) $d->precio_unitario,
                'cantidad'       => $d->cantidad,
                'subtotal'       => round($d->precio_unitario * $d->cantidad, 2),
            ]);
    }

    // ------------------------------------------------------------------

    private function encontrarCarrito(Request $request): ?Carrito
    {
        if ($request->user()) {
            $cliente = Cliente::where('fk_user', $request->user()->id)->first();
            if ($cliente) {
                return Carrito::where('fk_cliente', $cliente->id_cliente)->first();
            }
            // Sin registro clientes (ej. trabajador) → cae a token de sesión
        }

        $token = $request->session()->get('cart_token');
        if (! $token) {
            return null;
        }

        return Carrito::where('token_invitado', $token)->first();
    }

    private function obtenerOGenerarToken(Request $request): string
    {
        $token = $request->session()->get('cart_token');

        if (! $token) {
            $token = Str::uuid()->toString();
            $request->session()->put('cart_token', $token);
        }

        return $token;
    }
}
