<?php

namespace App\Http\Controllers;

use App\Services\ZonasEnvioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * `distritos` es el catálogo NACIONAL completo del Perú por UBIGEO (~1891
 * filas, sembradas por `UbigeoSeeder`) — ya NO es un CRUD libre de nombres.
 * Este panel solo activa/edita el costo de envío de un distrito que ya
 * existe en el catálogo; nunca crea ni borra filas de `distritos`. Por eso
 * `store`/`update` terminan siendo, en el fondo, la misma operación (fijar
 * costo_envio + activo=1 sobre una fila existente) — se mantienen separados
 * solo por claridad de permisos/UI (modal "Nuevo distrito" vs. "Editar").
 */
class DistritoController extends Controller
{
    public function index(): Response
    {
        $activos = DB::table('distritos')->where('activo', true)->count();
        $configurados = DB::table('distritos')
            ->where('activo', false)
            ->whereNotNull('costo_envio')
            ->count();
        $tarifaPromedio = (float) DB::table('distritos')
            ->where('activo', true)
            ->avg('costo_envio');

        return Inertia::render('trabajador/distrito', [
            'departamentos' => DB::table('departamentos')
                ->select('id_departamento', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'provincias' => DB::table('provincias')
                ->select('id_provincia', 'nombre', 'fk_departamento')
                ->orderBy('nombre')
                ->get(),
            'resumen' => [
                'activos' => $activos,
                'configurados' => $configurados,
                'catalogo' => DB::table('distritos')->count(),
                'tarifa_promedio' => round($tarifaPromedio, 2),
            ],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $departamento = $request->query('departamento');
        $provincia = $request->query('provincia');
        // activos | inactivos | configurados (inactivo con tarifa) | sin_tarifa | todos
        $estado = $request->query('estado', 'todos');
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $page = max(1, (int) $request->query('page', 1));
        $sort = $request->query('sort', 'nombre');
        $direction = $request->query('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $sortable = ['id_distrito', 'nombre', 'costo_envio', 'activo', 'provincia', 'departamento'];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'nombre';
        }

        $query = DB::table('distritos as d')
            ->join('provincias as p', 'p.id_provincia', '=', 'd.fk_provincia')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->select([
                'd.id_distrito',
                'd.nombre',
                'd.ubigeo',
                'd.costo_envio',
                'd.activo',
                'd.fk_provincia',
                'p.nombre as provincia',
                'dep.id_departamento',
                'dep.nombre as departamento',
            ]);

        if ($search !== '') {
            $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like) {
                $q->where('d.nombre', 'like', $like)
                    ->orWhere('p.nombre', 'like', $like)
                    ->orWhere('dep.nombre', 'like', $like);
            });
        }

        if ($provincia) {
            $query->where('d.fk_provincia', (int) $provincia);
        } elseif ($departamento) {
            $query->where('dep.id_departamento', (int) $departamento);
        }

        if ($estado === 'activos') {
            $query->where('d.activo', true);
        } elseif ($estado === 'inactivos') {
            $query->where('d.activo', false);
        } elseif ($estado === 'configurados') {
            $query->where('d.activo', false)->whereNotNull('d.costo_envio');
        } elseif ($estado === 'sin_tarifa') {
            $query->whereNull('d.costo_envio');
        }

        $sortColumn = match ($sort) {
            'provincia' => 'p.nombre',
            'departamento' => 'dep.nombre',
            default => 'd.'.$sort,
        };

        $total = (clone $query)->count(DB::raw('DISTINCT d.id_distrito'));

        $rows = $query
            ->orderBy($sortColumn, $direction)
            ->forPage($page, $perPage)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) max(1, ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * "Nuevo distrito": el modal elige, vía cascada Departamento → Provincia →
     * Distrito, una fila EXISTENTE del catálogo nacional y le fija un costo de
     * envío. Nunca inserta una fila nueva en `distritos`.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_distrito' => ['required', 'integer', Rule::exists('distritos', 'id_distrito')],
            'costo_envio' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ]);

        $previo = DB::table('distritos')->where('id_distrito', $data['id_distrito'])->first();
        $yaEraZona = $previo && (bool) $previo->activo;

        DB::table('distritos')->where('id_distrito', $data['id_distrito'])->update([
            'costo_envio' => $data['costo_envio'],
            'activo' => true,
        ]);

        ZonasEnvioService::flush();

        return response()->json([
            'message' => $yaEraZona
                ? 'El distrito ya era una zona activa; se actualizó su tarifa.'
                : 'Distrito activado como zona de reparto.',
            'nuevo' => ! $yaEraZona,
            'distrito' => DB::table('distritos')->where('id_distrito', $data['id_distrito'])->first(),
        ], $yaEraZona ? 200 : 201);
    }

    /**
     * Activación masiva: fija la MISMA tarifa a varios distritos del catálogo y
     * los enciende como zona de reparto en una sola operación. Pensado para
     * cubrir una provincia entera de golpe. Mismo permiso que `store`
     * (`distritos.crear`) porque, igual que aquél, enciende cobertura nueva.
     */
    public function bulkActivar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
            'costo_envio' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['ids'])));

        $existen = DB::table('distritos')->whereIn('id_distrito', $ids)->count();

        if ($existen !== count($ids)) {
            throw ValidationException::withMessages([
                'ids' => 'Uno o más distritos seleccionados no existen en el catálogo.',
            ]);
        }

        $afectados = DB::table('distritos')->whereIn('id_distrito', $ids)->update([
            'costo_envio' => $data['costo_envio'],
            'activo' => true,
        ]);

        ZonasEnvioService::flush();

        return response()->json([
            'message' => $afectados === 1
                ? '1 distrito activado como zona de reparto.'
                : "{$afectados} distritos activados como zona de reparto.",
            'afectados' => $afectados,
        ]);
    }

    /**
     * Baja masiva de cobertura: apaga `activo` en varios distritos SIN tocar la
     * tarifa cargada (se puede volver a encender luego con un clic). Mismo
     * permiso que el switch por fila (`distritos.editar`).
     */
    public function bulkDesactivar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['ids'])));

        $afectados = DB::table('distritos')
            ->whereIn('id_distrito', $ids)
            ->where('activo', true)
            ->update(['activo' => false]);

        ZonasEnvioService::flush();

        return response()->json([
            'message' => $afectados === 1
                ? '1 distrito dado de baja como zona de reparto.'
                : "{$afectados} distritos dados de baja como zona de reparto.",
            'afectados' => $afectados,
        ]);
    }

    /**
     * "Editar distrito": Departamento/Provincia/Nombre son de solo lectura
     * (los fija el ubigeo) — solo se pueden tocar costo_envio y el switch
     * activo. `activo` es opcional y por defecto queda en `true`: asignar un
     * costo desde este modal activa el distrito salvo que se apague el
     * switch explícitamente en la misma acción.
     */
    public function update(Request $request, int $distrito): JsonResponse
    {
        $existente = DB::table('distritos')->where('id_distrito', $distrito)->first();

        if (! $existente) {
            abort(404, 'Distrito no encontrado.');
        }

        $data = $request->validate([
            'costo_envio' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'activo' => ['nullable', 'boolean'],
        ]);

        DB::table('distritos')->where('id_distrito', $distrito)->update([
            'costo_envio' => $data['costo_envio'],
            'activo' => $data['activo'] ?? true,
        ]);

        ZonasEnvioService::flush();

        return response()->json(['message' => 'Distrito actualizado correctamente.']);
    }

    /**
     * Switch activo/inactivo por fila: apaga o enciende SIN tocar el costo
     * cargado. No se puede activar un distrito que nunca tuvo un costo
     * asignado (costo_envio null) — hay que editarlo primero.
     */
    public function toggleActivo(int $distrito): JsonResponse
    {
        $existente = DB::table('distritos')->where('id_distrito', $distrito)->first();

        if (! $existente) {
            abort(404, 'Distrito no encontrado.');
        }

        $activar = ! $existente->activo;

        if ($activar && $existente->costo_envio === null) {
            throw ValidationException::withMessages([
                'general' => 'Este distrito no tiene costo de envío configurado. Edítalo primero para asignarle uno.',
            ]);
        }

        DB::table('distritos')->where('id_distrito', $distrito)->update(['activo' => $activar]);

        ZonasEnvioService::flush();

        return response()->json([
            'message' => $activar ? 'Distrito activado.' : 'Distrito desactivado.',
            'activo' => $activar,
        ]);
    }
}
