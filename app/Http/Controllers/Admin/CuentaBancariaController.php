<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CuentaBancaria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Cuentas bancarias de la empresa (se muestran en el PDF del comprobante).
 * Registro único de empresa -> siempre se opera sobre la primera fila de
 * `empresa` (igual criterio que EmpresaController).
 */
class CuentaBancariaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $this->validado($request);
        $data['fk_empresa'] = $this->fkEmpresaOFallar();
        $data['orden'] = (int) DB::table('cuentas_bancarias')->where('fk_empresa', $data['fk_empresa'])->max('orden') + 1;

        $cuenta = CuentaBancaria::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuenta bancaria agregada.']);

        return response()->json(['message' => 'Cuenta bancaria agregada.', 'cuenta' => $cuenta]);
    }

    public function update(Request $request, CuentaBancaria $cuentaBancaria): JsonResponse
    {
        $cuentaBancaria->update($this->validado($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuenta bancaria actualizada.']);

        return response()->json(['message' => 'Cuenta bancaria actualizada.']);
    }

    public function toggleActivo(CuentaBancaria $cuentaBancaria): JsonResponse
    {
        $cuentaBancaria->update(['activo' => ! $cuentaBancaria->activo]);

        return response()->json(['message' => $cuentaBancaria->activo ? 'Cuenta activada.' : 'Cuenta desactivada.', 'activo' => $cuentaBancaria->activo]);
    }

    /**
     * Sube o baja una cuenta en el orden (intercambia `orden` con la vecina).
     */
    public function mover(Request $request, CuentaBancaria $cuentaBancaria): JsonResponse
    {
        $direccion = $request->validate(['direccion' => ['required', Rule::in(['arriba', 'abajo'])]])['direccion'];

        $vecina = CuentaBancaria::where('fk_empresa', $cuentaBancaria->fk_empresa)
            ->when(
                $direccion === 'arriba',
                fn ($q) => $q->where('orden', '<', $cuentaBancaria->orden)->orderByDesc('orden'),
                fn ($q) => $q->where('orden', '>', $cuentaBancaria->orden)->orderBy('orden'),
            )
            ->first();

        if ($vecina) {
            DB::transaction(function () use ($cuentaBancaria, $vecina) {
                $ordenOriginal = $cuentaBancaria->orden;
                $cuentaBancaria->update(['orden' => $vecina->orden]);
                $vecina->update(['orden' => $ordenOriginal]);
            });
        }

        return response()->json(['message' => 'Orden actualizado.']);
    }

    public function destroy(CuentaBancaria $cuentaBancaria): JsonResponse
    {
        $cuentaBancaria->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuenta bancaria eliminada.']);

        return response()->json(['message' => 'Cuenta bancaria eliminada.']);
    }

    private function validado(Request $request): array
    {
        return $request->validate([
            'banco' => ['required', 'string', 'max:60'],
            'moneda' => ['required', 'string', 'in:PEN,USD'],
            'tipo_cuenta' => ['required', 'string', 'max:30'],
            'numero_cuenta' => ['required', 'string', 'max:30'],
            'cci' => ['nullable', 'string', 'max:30'],
            'titular' => ['nullable', 'string', 'max:150'],
        ]);
    }

    private function fkEmpresaOFallar(): int
    {
        $id = DB::table('empresa')->value('id_empresa');

        abort_if($id === null, 422, 'Primero registra los datos de la empresa.');

        return $id;
    }
}
