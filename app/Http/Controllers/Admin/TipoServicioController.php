<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoServicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TipoServicioController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_servicio,nombre',
            ],
        ]);

        $tipo = TipoServicio::create($validated);

        return response()->json([
            'message' => 'Tipo de servicio creado correctamente.',
            'tipo' => $tipo,
        ], 201);
    }
}
