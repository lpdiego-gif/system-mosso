<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
            ],

            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],

            'fk_id_animal' => [
                'required',
                'integer',
                'exists:animales,id_animal',
            ],
        ]);

        $categoria = Categoria::create($validated);

        return response()->json([
            'message' => 'Categoría creada correctamente.',
            'categoria' => $categoria,
        ], 201);
    }
}
