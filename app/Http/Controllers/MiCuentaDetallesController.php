<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Detalles de la cuenta": el cliente completa aquí los datos de `personas`
 * que el registro rápido (correo + contraseña) no pidió. Si su documento ya
 * existe en `personas` (p.ej. porque también es trabajador, o porque ya lo
 * había registrado antes), se reutiliza esa fila en vez de duplicarla —
 * mismo criterio que ya usa TrabajadorController::store().
 */
class MiCuentaDetallesController extends Controller
{
    public function index(Request $request, CuentaService $cuentaService): Response
    {
        $user = $request->user();
        $clienteId = $this->clienteId($request, $cuentaService);

        $persona = DB::table('clientes as c')
            ->join('personas as p', 'p.id_persona', '=', 'c.fk_persona')
            ->where('c.id_cliente', $clienteId)
            ->select('p.fk_tipo_documento', 'p.num_documento', 'p.nombres', 'p.apellido_paterno', 'p.apellido_materno', 'p.telefono', 'p.fecha_nacimiento')
            ->first();

        return Inertia::render('mi-cuenta-detalles', [
            'email' => $user->email,
            'persona' => $persona,
            'tiposDocumento' => DB::table('tipo_documento')->select('id_tipo_documento', 'nombre')->orderBy('id_tipo_documento')->get(),
        ]);
    }

    public function update(Request $request, CuentaService $cuentaService): RedirectResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $data = $request->validate([
            'fk_tipo_documento' => ['required', 'integer', Rule::exists('tipo_documento', 'id_tipo_documento')],
            'num_documento' => ['required', 'string', 'max:20'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'telefono' => ['required', 'string', 'max:20'],
            'fecha_nacimiento' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($data, $clienteId) {
            $cliente = DB::table('clientes')->where('id_cliente', $clienteId)->lockForUpdate()->first();

            $personaExistente = DB::table('personas')
                ->where('num_documento', $data['num_documento'])
                ->where('fk_tipo_documento', $data['fk_tipo_documento'])
                ->lockForUpdate()
                ->first();

            if ($personaExistente && $personaExistente->id_persona !== $cliente->fk_persona) {
                $yaEsOtroCliente = DB::table('clientes')
                    ->where('fk_persona', $personaExistente->id_persona)
                    ->where('id_cliente', '!=', $clienteId)
                    ->exists();

                if ($yaEsOtroCliente) {
                    throw ValidationException::withMessages([
                        'num_documento' => 'Ese número de documento ya está registrado en otra cuenta.',
                    ]);
                }
            }

            $camposPersona = [
                'fk_tipo_documento' => $data['fk_tipo_documento'],
                'num_documento' => $data['num_documento'],
                'nombres' => $data['nombres'],
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'] ?? null,
                'telefono' => $data['telefono'],
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                'updated_at' => now(),
            ];

            if ($personaExistente) {
                $idPersona = $personaExistente->id_persona;
                DB::table('personas')->where('id_persona', $idPersona)->update($camposPersona);
            } elseif ($cliente->fk_persona) {
                $idPersona = $cliente->fk_persona;
                DB::table('personas')->where('id_persona', $idPersona)->update($camposPersona);
            } else {
                $idPersona = DB::table('personas')->insertGetId([
                    ...$camposPersona,
                    'created_at' => now(),
                ]);
            }

            DB::table('clientes')->where('id_cliente', $clienteId)->update([
                'fk_persona' => $idPersona,
                'updated_at' => now(),
            ]);

            DB::table('users')
                ->where('id', DB::table('clientes')->where('id_cliente', $clienteId)->value('fk_user'))
                ->update([
                    'name' => trim($data['nombres'] . ' ' . $data['apellido_paterno']),
                    'updated_at' => now(),
                ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tus datos se guardaron correctamente.']);

        return redirect()->route('mi-cuenta.detalles');
    }

    private function clienteId(Request $request, CuentaService $cuentaService): int
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        return $clienteId;
    }
}
