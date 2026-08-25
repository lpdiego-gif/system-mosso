<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusquedaController extends Controller
{
    public function __invoke(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $productos = Producto::query()
            ->when($q !== '', fn ($query) => $query->where('nombre', 'like', "%{$q}%"))
            ->limit(40)
            ->get();

        return Inertia::render('buscar', [
            'query' => $q,
            'productos' => $productos,
        ]);
    }
}