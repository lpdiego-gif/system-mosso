<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DistritoController extends Controller
{
    /**
     * NOTA DE ESQUEMA: la tabla `distritos` no trae en el dump un índice único
     * compuesto (nombre + fk_provincia). La unicidad se valida aquí a nivel de
     * aplicación (con lockForUpdate dentro de una transacción para evitar condiciones
     * de carrera), pero se recomienda además agregar a futuro:
     *   ALTER TABLE distritos ADD UNIQUE KEY distritos_nombre_provincia_unique (nombre, fk_provincia);
     */
    public function index(): Response
    {
        return Inertia::render('trabajador/distrito', [
            'departamentos' => DB::table('departamentos')
                ->select('id_departamento', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'provincias' => DB::table('provincias')
                ->select('id_provincia', 'nombre', 'fk_departamento')
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $departamento = $request->query('departamento');
        $provincia = $request->query('provincia');
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $page = max(1, (int) $request->query('page', 1));
        $sort = $request->query('sort', 'nombre');
        $direction = $request->query('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $sortable = ['id_distrito', 'nombre', 'costo_envio', 'provincia', 'departamento'];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'nombre';
        }

        $query = DB::table('distritos as d')
            ->join('provincias as p', 'p.id_provincia', '=', 'd.fk_provincia')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->select([
                'd.id_distrito',
                'd.nombre',
                'd.costo_envio',
                'd.fk_provincia',
                'p.nombre as provincia',
                'dep.id_departamento',
                'dep.nombre as departamento',
            ]);

        if ($search !== '') {
            $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $search) . '%';
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

        $sortColumn = match ($sort) {
            'provincia' => 'p.nombre',
            'departamento' => 'dep.nombre',
            default => 'd.' . $sort,
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

    public function store(Request $request): JsonResponse
    {
        $data = $this->validado($request);

        $distrito = DB::transaction(function () use ($data) {
            $this->asegurarNombreUnico($data['nombre'], $data['fk_provincia']);

            $id = DB::table('distritos')->insertGetId([
                'nombre' => $data['nombre'],
                'costo_envio' => $data['costo_envio'],
                'fk_provincia' => $data['fk_provincia'],
            ]);

            return DB::table('distritos')->where('id_distrito', $id)->first();
        });

        return response()->json([
            'message' => 'Distrito registrado correctamente.',
            'distrito' => $distrito,
        ], 201);
    }

    public function update(Request $request, int $distrito): JsonResponse
    {
        $existente = DB::table('distritos')->where('id_distrito', $distrito)->first();

        if (! $existente) {
            abort(404, 'Distrito no encontrado.');
        }

        $data = $this->validado($request);

        DB::transaction(function () use ($data, $distrito) {
            $this->asegurarNombreUnico($data['nombre'], $data['fk_provincia'], $distrito);

            DB::table('distritos')->where('id_distrito', $distrito)->update([
                'nombre' => $data['nombre'],
                'costo_envio' => $data['costo_envio'],
                'fk_provincia' => $data['fk_provincia'],
            ]);
        });

        return response()->json([
            'message' => 'Distrito actualizado correctamente.',
        ]);
    }

    public function destroy(int $distrito): JsonResponse
    {
        $existente = DB::table('distritos')->where('id_distrito', $distrito)->first();

        if (! $existente) {
            abort(404, 'Distrito no encontrado.');
        }

        // Bloqueo preventivo: distritos referenciados por direcciones no deben eliminarse.
        $enUso = DB::table('direcciones')->where('fk_distrito', $distrito)->exists();

        if ($enUso) {
            throw ValidationException::withMessages([
                'general' => 'No se puede eliminar: este distrito está siendo usado por una o más direcciones registradas.',
            ]);
        }

        try {
            DB::table('distritos')->where('id_distrito', $distrito)->delete();
        } catch (QueryException $e) {
            // Resguardo si existiera otra FK no contemplada (error 23000 = violación de integridad referencial).
            if ($e->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'general' => 'No se puede eliminar: el distrito tiene información relacionada.',
                ]);
            }
            throw $e;
        }

        return response()->json([
            'message' => 'Distrito eliminado correctamente.',
        ]);
    }

    /**
     * Validación y saneamiento común a store/update.
     */
    private function validado(Request $request): array
    {
        $request->merge([
            'nombre' => trim(strip_tags((string) $request->input('nombre'))),
        ]);

        return $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:45', 'regex:/^[\p{L}\s.\'-]+$/u'],
            'costo_envio' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'fk_provincia' => ['required', 'integer', Rule::exists('provincias', 'id_provincia')],
        ], [
            'nombre.regex' => 'El nombre solo puede contener letras y espacios.',
            'costo_envio.max' => 'El costo de envío ingresado es demasiado alto.',
            'fk_provincia.exists' => 'La provincia seleccionada no es válida.',
        ]);
    }

    /**
     * Un distrito no puede repetir nombre dentro de la misma provincia (case-insensitive).
     * Se bloquea la fila de la provincia con lockForUpdate para evitar que dos
     * solicitudes concurrentes creen el mismo nombre a la vez.
     */
    private function asegurarNombreUnico(string $nombre, int $fkProvincia, ?int $ignorarId = null): void
    {
        DB::table('provincias')->where('id_provincia', $fkProvincia)->lockForUpdate()->first();

        $duplicado = DB::table('distritos')
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])
            ->where('fk_provincia', $fkProvincia)
            ->when($ignorarId, fn ($q) => $q->where('id_distrito', '!=', $ignorarId))
            ->exists();

        if ($duplicado) {
            throw ValidationException::withMessages([
                'nombre' => 'Ya existe un distrito con este nombre en la provincia seleccionada.',
            ]);
        }
    }
}