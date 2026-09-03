<?php

namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Libreta de direcciones del cliente. Cada dirección guardada es una fila en
 * `direcciones` (mismos campos que usa el resto del sistema: direccion,
 * referencia, fk_distrito) enlazada al cliente vía `cliente_direcciones`
 * (alias, es_principal) — así se puede reusar una `direccion` desde pedidos
 * más adelante sin duplicar el modelo.
 */
class MiCuentaDireccionController extends Controller
{
    public function index(Request $request, CuentaService $cuentaService): Response
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $direcciones = DB::table('cliente_direcciones as cd')
            ->join('direcciones as d', 'd.id_direccion', '=', 'cd.fk_direccion')
            ->join('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->join('provincias as p', 'p.id_provincia', '=', 'dist.fk_provincia')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->where('cd.fk_cliente', $clienteId)
            ->select([
                'cd.id_cliente_direccion', 'cd.alias', 'cd.es_principal',
                'd.id_direccion', 'd.direccion', 'd.referencia',
                'dist.nombre as distrito', 'p.nombre as provincia', 'dep.nombre as departamento',
            ])
            ->orderByDesc('cd.es_principal')
            ->orderBy('cd.id_cliente_direccion')
            ->get();

        return Inertia::render('mi-cuenta-direcciones', [
            'direcciones' => $direcciones,
            // Catálogo NACIONAL completo: el cliente puede registrar una dirección
            // en cualquier distrito exista o no envío. Departamentos (25) y
            // provincias (196) van de una — los distritos (~1891) se piden por
            // provincia vía GET /ubigeo/distritos para no mandar todo el catálogo.
            'departamentos' => DB::table('departamentos')->select('id_departamento', 'nombre')->orderBy('nombre')->get(),
            'provincias' => DB::table('provincias')->select('id_provincia', 'nombre', 'fk_departamento')->orderBy('nombre')->get(),
        ]);
    }

    public function store(Request $request, CuentaService $cuentaService): RedirectResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $data = $request->validate([
            'alias' => ['nullable', 'string', 'max:50'],
            'direccion' => ['required', 'string', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'fk_distrito' => ['required', 'integer', Rule::exists('distritos', 'id_distrito')],
            'es_principal' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $clienteId) {
            $idDireccion = DB::table('direcciones')->insertGetId([
                'direccion' => $data['direccion'],
                'referencia' => $data['referencia'] ?? null,
                'fk_distrito' => $data['fk_distrito'],
            ]);

            $esPrincipal = (bool) ($data['es_principal'] ?? false);

            if ($esPrincipal) {
                DB::table('cliente_direcciones')->where('fk_cliente', $clienteId)->update(['es_principal' => 0]);
            }

            // Primera dirección del cliente: siempre queda como principal, la pida o no.
            $sinDirecciones = ! DB::table('cliente_direcciones')->where('fk_cliente', $clienteId)->exists();

            DB::table('cliente_direcciones')->insert([
                'fk_cliente' => $clienteId,
                'fk_direccion' => $idDireccion,
                'alias' => $data['alias'] ?? null,
                'es_principal' => $esPrincipal || $sinDirecciones ? 1 : 0,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Dirección guardada.']);

        return redirect()->route('mi-cuenta.direcciones.index');
    }

    public function marcarPrincipal(Request $request, CuentaService $cuentaService, int $direccion): RedirectResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $clienteDireccion = DB::table('cliente_direcciones')
            ->where('fk_cliente', $clienteId)
            ->where('fk_direccion', $direccion)
            ->first();

        if (! $clienteDireccion) {
            abort(404);
        }

        DB::transaction(function () use ($clienteId, $direccion) {
            DB::table('cliente_direcciones')->where('fk_cliente', $clienteId)->update(['es_principal' => 0]);
            DB::table('cliente_direcciones')
                ->where('fk_cliente', $clienteId)
                ->where('fk_direccion', $direccion)
                ->update(['es_principal' => 1]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Dirección principal actualizada.']);

        return redirect()->route('mi-cuenta.direcciones.index');
    }

    public function destroy(Request $request, CuentaService $cuentaService, int $direccion): RedirectResponse|JsonResponse
    {
        $clienteId = $this->clienteId($request, $cuentaService);

        $clienteDireccion = DB::table('cliente_direcciones')
            ->where('fk_cliente', $clienteId)
            ->where('fk_direccion', $direccion)
            ->first();

        if (! $clienteDireccion) {
            abort(404);
        }

        DB::table('cliente_direcciones')->where('id_cliente_direccion', $clienteDireccion->id_cliente_direccion)->delete();

        // Si nadie más referencia esta dirección (otro cliente, un trabajador, un pedido...), se borra también.
        $enUso = DB::table('cliente_direcciones')->where('fk_direccion', $direccion)->exists()
            || DB::table('trabajadores')->where('fk_direccion', $direccion)->exists()
            || DB::table('servicios')->where('fk_direccion', $direccion)->exists()
            || DB::table('empresa')->where('fk_direccion', $direccion)->exists()
            || DB::table('pedidos')->where('fk_direccion_envio', $direccion)->exists();

        if (! $enUso) {
            DB::table('direcciones')->where('id_direccion', $direccion)->delete();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Dirección eliminada.']);

        return redirect()->route('mi-cuenta.direcciones.index');
    }

    private function clienteId(Request $request, CuentaService $cuentaService): int
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        return $clienteId;
    }
}
