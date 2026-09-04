<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CuentaBancaria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
        $fkEmpresa = $this->fkEmpresaOFallar();
        $data = $this->validado($request, $fkEmpresa);
        $data['fk_empresa'] = $fkEmpresa;
        $data['activo'] = true;
        $data['orden'] = (int) DB::table('cuentas_bancarias')->where('fk_empresa', $fkEmpresa)->max('orden') + 1;

        $cuenta = CuentaBancaria::create($data)->fresh();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuenta bancaria agregada.']);

        return response()->json(['message' => 'Cuenta bancaria agregada.', 'cuenta' => $cuenta]);
    }

    public function update(Request $request, CuentaBancaria $cuentaBancaria): JsonResponse
    {
        $cuentaBancaria->update($this->validado($request, $cuentaBancaria->fk_empresa, $cuentaBancaria->id_cuenta_bancaria));

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

    /**
     * Reglas de una cuenta bancaria. `$ignorar` excluye la propia fila del
     * chequeo de duplicados (número de cuenta repetido en la misma empresa).
     */
    private function validado(Request $request, int $fkEmpresa, ?int $ignorar = null): array
    {
        $request->merge([
            'banco' => trim(strip_tags((string) $request->input('banco'))),
            'numero_cuenta' => preg_replace('/[^\dxX-]/', '', (string) $request->input('numero_cuenta')),
            'cci' => $request->filled('cci') ? preg_replace('/\D/', '', (string) $request->input('cci')) : null,
            'titular' => $request->filled('titular') ? trim(strip_tags((string) $request->input('titular'))) : null,
        ]);

        $data = $request->validate([
            'banco' => ['required', 'string', 'min:2', 'max:60'],
            'moneda' => ['required', 'string', Rule::in(['PEN', 'USD'])],
            'tipo_cuenta' => ['required', 'string', Rule::in(['Corriente', 'Ahorros', 'Maestra', 'Sueldo', 'Detracciones'])],
            'numero_cuenta' => ['required', 'string', 'regex:/^[\dxX-]{8,30}$/'],
            'cci' => ['nullable', 'string', 'regex:/^\d{20}$/'],
            'titular' => ['nullable', 'string', 'max:150'],
        ], [
            'numero_cuenta.regex' => 'El número de cuenta solo admite dígitos y guiones (entre 8 y 30 caracteres).',
            'cci.regex' => 'El CCI (código de cuenta interbancario) debe tener exactamente 20 dígitos.',
            'tipo_cuenta.in' => 'Tipo de cuenta no válido.',
        ]);

        $duplicada = DB::table('cuentas_bancarias')
            ->where('fk_empresa', $fkEmpresa)
            ->where('numero_cuenta', $data['numero_cuenta'])
            ->when($ignorar, fn ($q) => $q->where('id_cuenta_bancaria', '!=', $ignorar))
            ->exists();

        if ($duplicada) {
            throw ValidationException::withMessages([
                'numero_cuenta' => 'Ya registraste una cuenta con ese número.',
            ]);
        }

        return $data;
    }

    private function fkEmpresaOFallar(): int
    {
        $id = DB::table('empresa')->value('id_empresa');

        abort_if($id === null, 422, 'Primero registra los datos de la empresa.');

        return $id;
    }
}
