<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarcaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                'unique:marcas,nombre',
            ],
        ]);

        $marca = Marca::create($validated);

        return response()->json([
            'message' => 'Marca creada correctamente.',
            'marca' => $marca,
        ], 201);
    }
}
