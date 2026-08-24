<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubCategoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubCategoriaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_sub_categoria' => [
                'required',
                'string',
                'max:105',
            ],

            'fk_id_categoria' => [
                'required',
                'integer',
                'exists:categorias,id_categoria',
            ],
        ]);

        $subcategoria = SubCategoria::create($validated);

        return response()->json([
            'message' => 'Subcategoría creada correctamente.',
            'subcategoria' => $subcategoria,
        ], 201);
    }
}
