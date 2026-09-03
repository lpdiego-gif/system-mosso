<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo geográfico de referencia (departamentos/provincias/distritos),
 * usado para cascadas de selects: el modal "Nuevo distrito" del panel admin
 * y el formulario de /mi-cuenta/direcciones. No expone nada sensible, así
 * que basta con `auth` (ver rutas).
 */
class UbigeoController extends Controller
{
    public function provincias(Request $request): JsonResponse
    {
        $departamento = (int) $request->query('departamento');

        return response()->json(
            DB::table('provincias')
                ->where('fk_departamento', $departamento)
                ->select('id_provincia', 'nombre')
                ->orderBy('nombre')
                ->get()
        );
    }

    /**
     * Incluye `activo`/`costo_envio`: el modal "Nuevo distrito" del admin los
     * usa para precargar el formulario si el distrito elegido ya tenía datos
     * cargados, y /mi-cuenta/direcciones los usa para avisar si el distrito
     * elegido no tiene envío disponible.
     */
    public function distritos(Request $request): JsonResponse
    {
        $provincia = (int) $request->query('provincia');

        return response()->json(
            DB::table('distritos')
                ->where('fk_provincia', $provincia)
                ->select('id_distrito', 'nombre', 'activo', 'costo_envio')
                ->orderBy('nombre')
                ->get()
        );
    }
}
