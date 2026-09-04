<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * `provincias` forma parte del catálogo geográfico del Perú por UBIGEO
 * (departamento → provincia → distrito). A diferencia de `distritos` —que
 * está atado a la logística de reparto y solo se activa/edita— la provincia
 * es un dato puramente geográfico, así que este panel sí es un CRUD
 * completo: se pueden crear, editar y eliminar filas.
 *
 * Regla de integridad: una provincia con distritos asociados no se puede
 * borrar (la FK `distritos.fk_provincia` lo impediría de todos modos, pero
 * lo validamos antes para dar un mensaje claro).
 */
class ProvinciaController extends Controller
{
    /** Columnas de la tabla `provincias` que la UI puede pedir ordenar. */
    private const SORTABLE = ['id_provincia', 'nombre', 'ubigeo', 'departamento', 'distritos'];

    public function index(): Response
    {
        return Inertia::render('provincia', [
            'departamentos' => DB::table('departamentos')
                ->select('id_departamento', 'nombre', 'ubigeo')
                ->orderBy('nombre')
                ->get(),
            'resumen' => [
                'provincias' => DB::table('provincias')->count(),
                'departamentos' => DB::table('departamentos')->count(),
                'distritos' => DB::table('distritos')->count(),
                'sin_distritos' => DB::table('provincias as p')
                    ->leftJoin('distritos as d', 'd.fk_provincia', '=', 'p.id_provincia')
                    ->whereNull('d.id_distrito')
                    ->count(),
            ],
        ]);
    }

    /**
     * Endpoint JSON consumido por axios: listado filtrado, ordenado y
     * paginado. No navega vía Inertia, así los filtros no recargan la página.
     */
    public function data(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $departamento = $request->query('departamento');
        $conDistritos = $request->query('distritos', 'todos'); // con|sin|todos
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $page = max(1, (int) $request->query('page', 1));
        $sort = $request->query('sort', 'nombre');
        $direction = $request->query('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        if (! in_array($sort, self::SORTABLE, true)) {
            $sort = 'nombre';
        }

        $query = DB::table('provincias as p')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->leftJoin('distritos as d', 'd.fk_provincia', '=', 'p.id_provincia')
            ->groupBy('p.id_provincia', 'p.nombre', 'p.ubigeo', 'p.fk_departamento', 'dep.id_departamento', 'dep.nombre')
            ->select([
                'p.id_provincia',
                'p.nombre',
                'p.ubigeo',
                'p.fk_departamento',
                'dep.id_departamento',
                'dep.nombre as departamento',
                DB::raw('COUNT(d.id_distrito) as distritos'),
            ]);

        if ($search !== '') {
            $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like) {
                $q->where('p.nombre', 'like', $like)
                    ->orWhere('p.ubigeo', 'like', $like)
                    ->orWhere('dep.nombre', 'like', $like);
            });
        }

        if ($departamento && $departamento !== 'todos') {
            $query->where('dep.id_departamento', (int) $departamento);
        }

        if ($conDistritos === 'sin') {
            $query->havingRaw('COUNT(d.id_distrito) = 0');
        } elseif ($conDistritos === 'con') {
            $query->havingRaw('COUNT(d.id_distrito) > 0');
        }

        $sortColumn = match ($sort) {
            'departamento' => 'dep.nombre',
            'distritos' => 'distritos',
            default => 'p.'.$sort,
        };

        // El GROUP BY obliga a contar sobre una subconsulta envolvente.
        $total = DB::table(DB::raw("({$query->toSql()}) as sub"))
            ->mergeBindings($query)
            ->count();

        $rows = $query
            ->orderBy($sortColumn, $direction)
            ->orderBy('p.nombre')
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

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $id = DB::table('provincias')->insertGetId([
            'nombre' => $data['nombre'],
            'ubigeo' => $data['ubigeo'],
            'fk_departamento' => $data['fk_departamento'],
        ]);

        return response()->json([
            'message' => 'Provincia registrada correctamente.',
            'id_provincia' => $id,
        ], 201);
    }

    public function update(Request $request, int $provincia): JsonResponse
    {
        $existente = DB::table('provincias')->where('id_provincia', $provincia)->first();

        if (! $existente) {
            abort(404, 'Provincia no encontrada.');
        }

        $data = $this->validated($request, $provincia);

        DB::table('provincias')->where('id_provincia', $provincia)->update([
            'nombre' => $data['nombre'],
            'ubigeo' => $data['ubigeo'],
            'fk_departamento' => $data['fk_departamento'],
        ]);

        return response()->json(['message' => 'Provincia actualizada correctamente.']);
    }

    public function destroy(int $provincia): JsonResponse
    {
        $existente = DB::table('provincias')->where('id_provincia', $provincia)->first();

        if (! $existente) {
            abort(404, 'Provincia no encontrada.');
        }

        $distritos = DB::table('distritos')->where('fk_provincia', $provincia)->count();

        if ($distritos > 0) {
            throw ValidationException::withMessages([
                'general' => "No se puede eliminar: la provincia tiene {$distritos} distrito(s) asociado(s).",
            ]);
        }

        DB::table('provincias')->where('id_provincia', $provincia)->delete();

        return response()->json(['message' => 'Provincia eliminada correctamente.']);
    }

    /**
     * Reglas compartidas por store/update. El nombre y el ubigeo se
     * normalizan (mayúsculas / sin espacios) para no romper la convención
     * del catálogo nacional sembrado.
     */
    private function validated(Request $request, ?int $ignorar = null): array
    {
        $request->merge([
            'nombre' => Str::upper(trim((string) $request->input('nombre'))),
            'ubigeo' => $request->filled('ubigeo') ? preg_replace('/\D/', '', (string) $request->input('ubigeo')) : null,
        ]);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:45'],
            'fk_departamento' => ['required', 'integer', Rule::exists('departamentos', 'id_departamento')],
            'ubigeo' => [
                'nullable',
                'string',
                'size:4',
                Rule::unique('provincias', 'ubigeo')->ignore($ignorar, 'id_provincia'),
            ],
        ], [], [
            'fk_departamento' => 'departamento',
        ]);

        // Nombre único dentro del mismo departamento (evita duplicar
        // "SAN MARTÍN" en el departamento de San Martín, por ejemplo).
        $duplicado = DB::table('provincias')
            ->where('fk_departamento', $data['fk_departamento'])
            ->where('nombre', $data['nombre'])
            ->when($ignorar, fn ($q) => $q->where('id_provincia', '!=', $ignorar))
            ->exists();

        if ($duplicado) {
            throw ValidationException::withMessages([
                'nombre' => 'Ya existe una provincia con ese nombre en el departamento seleccionado.',
            ]);
        }

        return $data;
    }
}
