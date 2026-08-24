<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnimalController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:animales,nombre',
            ],
        ]);

        $animal = Animal::create($validated);

        return response()->json([
            'message' => 'Animal creado correctamente.',
            'animal' => $animal,
        ], 201);
    }
}