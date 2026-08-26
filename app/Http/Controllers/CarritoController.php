<?php

namespace App\Http\Controllers;

use App\Models\CarritoDetalle;
use App\Services\CarritoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CarritoController extends Controller
{
    public function __construct(private CarritoService $carrito) {}

    public function index(Request $request): Response
    {
        $carrito = $this->carrito->resolverCarrito($request);
        $items   = $this->carrito->obtenerItems($carrito);

        return Inertia::render('carrito/index', [
            'items' => $items->values(),
            'total' => round($items->sum('subtotal'), 2),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'producto_id' => 'required|integer|exists:productos,id_producto',
            'cantidad'    => 'required|integer|min:1|max:99',
        ]);

        $carrito = $this->carrito->resolverCarrito($request);
        $this->carrito->agregarProducto($carrito, $request->producto_id, $request->cantidad);

        if ($request->expectsJson()) {
            return response()->json(['cantidad' => $this->carrito->contarItems($request)]);
        }

        return back()->with('success', 'Producto agregado al carrito.');
    }

    public function update(Request $request, CarritoDetalle $detalle): RedirectResponse
    {
        $request->validate(['cantidad' => 'required|integer|min:1|max:99']);

        $carrito = $this->carrito->resolverCarrito($request);
        abort_if($detalle->fk_carrito !== $carrito->id_carrito, 403);

        $detalle->update(['cantidad' => $request->cantidad]);

        return back();
    }

    public function destroy(Request $request, CarritoDetalle $detalle): RedirectResponse
    {
        $carrito = $this->carrito->resolverCarrito($request);
        abort_if($detalle->fk_carrito !== $carrito->id_carrito, 403);

        $detalle->delete();

        return back();
    }
}
