<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MiCuentaMascotaController extends Controller
{
    public function index(Request $request, CuentaService $cuentaService): Response
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $mascotas = DB::table('mascotas as m')
            ->join('animales as a', 'a.id_animal', '=', 'm.fk_animal')
            ->where('m.fk_cliente', $clienteId)
            ->select('m.id_mascota', 'm.nombre', 'm.fk_animal', 'm.fecha_nacimiento', 'a.nombre as animal')
            ->orderBy('m.nombre')
            ->get();

        $animales = DB::table('animales')->select('id_animal', 'nombre')->orderBy('nombre')->get();

        return Inertia::render('mi-cuenta-mascotas', [
            'mascotas' => $mascotas,
            'animales' => $animales,
        ]);
    }

    public function store(Request $request, CuentaService $cuentaService): RedirectResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $animalesIds = DB::table('animales')->pluck('id_animal')->toArray();

        $data = $request->validate([
            'nombre'           => ['required', 'string', 'max:60'],
            'fk_animal'        => ['required', 'integer', Rule::in($animalesIds)],
            'fecha_nacimiento' => ['nullable', 'date', 'before_or_equal:today'],
        ]);

        DB::table('mascotas')->insert([
            'fk_cliente'       => $clienteId,
            'nombre'           => $data['nombre'],
            'fk_animal'        => $data['fk_animal'],
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Mascota registrada.']);

        return redirect()->route('mi-cuenta.mascotas.index');
    }

    public function destroy(Request $request, CuentaService $cuentaService, int $mascota): RedirectResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $deleted = DB::table('mascotas')
            ->where('id_mascota', $mascota)
            ->where('fk_cliente', $clienteId)
            ->delete();

        abort_if($deleted === 0, 404);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Mascota eliminada.']);

        return redirect()->route('mi-cuenta.mascotas.index');
    }

    private function clienteId(Request $request, CuentaService $cuentaService): int
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        return $clienteId;
    }
}
