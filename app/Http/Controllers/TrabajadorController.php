<?php

namespace App\Http\Controllers;

use App\Http\Requests\Trabajador\StoreTrabajadorRequest;
use App\Http\Requests\Trabajador\UpdateTrabajadorRequest;
use App\Services\ReniecService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TrabajadorController extends Controller
{
    /**
     * Vista principal (Inertia). Los datos de la tabla se cargan aparte via data()
     * para permitir filtros/paginación sin recargar la página.
     */
    public function index(): Response
    {
        return Inertia::render('trabajador/trabajadores', [
            'roles' => DB::table('roles')
                ->select('id_rol', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'tiposDocumento' => DB::table('tipo_documento')
                ->select('id_tipo_documento', 'nombre')
                ->orderBy('id_tipo_documento')
                ->get(),
            'departamentos' => DB::table('departamentos')
                ->select('id_departamento', 'nombre')
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Endpoint JSON consumido por axios: listado filtrado, ordenado y paginado.
     * Nunca navega via Inertia -> no hay recarga de página con los filtros.
     */
    public function data(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $rol = $request->query('rol');
        $estado = $request->query('estado'); // 'activo' | 'inactivo' | null
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $page = max(1, (int) $request->query('page', 1));
        $sort = $request->query('sort', 'id_trabajador');
        $direction = $request->query('direction', 'desc') === 'asc' ? 'asc' : 'desc';

        $sortable = [
            'id_trabajador', 'nombres', 'num_documento', 'fecha_ingreso', 'activo', 'rol',
        ];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'id_trabajador';
        }

        $query = DB::table('trabajadores as t')
            ->join('personas as p', 'p.id_persona', '=', 't.fk_persona')
            ->join('users as u', 'u.id', '=', 't.fk_user')
            ->join('roles as r', 'r.id_rol', '=', 't.fk_rol')
            ->leftJoin('direcciones as d', 'd.id_direccion', '=', 't.fk_direccion')
            ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->select([
                't.id_trabajador',
                't.fecha_ingreso',
                't.activo',
                'p.id_persona',
                'p.num_documento',
                'p.nombres',
                'p.apellido_paterno',
                'p.apellido_materno',
                'p.telefono',
                'u.id as id_user',
                'u.name as user_name',
                'u.email',
                'r.id_rol',
                'r.nombre as rol',
                'd.direccion',
                'dist.nombre as distrito',
            ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $search) . '%';
                $q->where('p.num_documento', 'like', $like)
                    ->orWhere('p.nombres', 'like', $like)
                    ->orWhere('p.apellido_paterno', 'like', $like)
                    ->orWhere('p.apellido_materno', 'like', $like)
                    ->orWhere('u.email', 'like', $like)
                    ->orWhereRaw("CONCAT(p.nombres,' ',p.apellido_paterno,' ',p.apellido_materno) LIKE ?", [$like]);
            });
        }

        if ($rol !== null && $rol !== '' && $rol !== 'todos') {
            $query->where('t.fk_rol', (int) $rol);
        }

        if ($estado === 'activo') {
            $query->where('t.activo', 1);
        } elseif ($estado === 'inactivo') {
            $query->where('t.activo', 0);
        }

        $sortColumn = match ($sort) {
            'nombres' => 'p.nombres',
            'num_documento' => 'p.num_documento',
            'rol' => 'r.nombre',
            default => 't.' . $sort,
        };

        $total = (clone $query)->count(DB::raw('DISTINCT t.id_trabajador'));

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
     * Datos completos de un trabajador (incluye ids de ubicación) para precargar el formulario de edición.
     */
    public function edit(int $id): JsonResponse
    {
        $trabajador = DB::table('trabajadores as t')
            ->join('personas as p', 'p.id_persona', '=', 't.fk_persona')
            ->join('users as u', 'u.id', '=', 't.fk_user')
            ->leftJoin('direcciones as d', 'd.id_direccion', '=', 't.fk_direccion')
            ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->leftJoin('provincias as prov', 'prov.id_provincia', '=', 'dist.fk_provincia')
            ->where('t.id_trabajador', $id)
            ->select([
                't.id_trabajador', 't.fk_rol', 't.fecha_ingreso',
                'p.fk_tipo_documento', 'p.num_documento', 'p.nombres', 'p.apellido_paterno',
                'p.apellido_materno', 'p.telefono', 'p.fecha_nacimiento',
                'u.email',
                'd.direccion', 'd.referencia',
                'dist.id_distrito as fk_distrito',
                'prov.id_provincia as fk_provincia',
                'prov.fk_departamento',
            ])
            ->first();

        if (! $trabajador) {
            abort(404, 'Trabajador no encontrado.');
        }

        return response()->json($trabajador);
    }

    public function provincias(int $departamento): JsonResponse
    {
        return response()->json(
            DB::table('provincias')
                ->where('fk_departamento', $departamento)
                ->select('id_provincia', 'nombre')
                ->orderBy('nombre')
                ->get()
        );
    }

    public function distritos(int $provincia): JsonResponse
    {
        return response()->json(
            DB::table('distritos')
                ->where('fk_provincia', $provincia)
                ->select('id_distrito', 'nombre')
                ->orderBy('nombre')
                ->get()
        );
    }

    /**
     * Busca una persona por número de documento: primero en la base local,
     * luego (si es DNI) en RENIEC. Indica si ya existe un trabajador para esa persona.
     */
    public function buscarDocumento(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fk_tipo_documento' => ['required', 'integer', 'exists:tipo_documento,id_tipo_documento'],
            'num_documento' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9]+$/'],
        ]);

        $numDocumento = trim($validated['num_documento']);

        $persona = DB::table('personas')
            ->where('num_documento', $numDocumento)
            ->where('fk_tipo_documento', $validated['fk_tipo_documento'])
            ->first();

        if ($persona) {
            $trabajadorExistente = DB::table('trabajadores')
                ->where('fk_persona', $persona->id_persona)
                ->exists();

            return response()->json([
                'origen' => 'local',
                'ya_es_trabajador' => $trabajadorExistente,
                'persona' => $persona,
            ]);
        }

        // Solo se consulta RENIEC para DNI (asumido id_tipo_documento = 1) y con 8 dígitos.
        $esDni = (int) $validated['fk_tipo_documento'] === 1;

        // if ($esDni && preg_match('/^\d{8}$/', $numDocumento)) {
        //     try {
        //         $datos = app(ReniecService::class)->consultarDni($numDocumento);

        //         if ($datos) {
        //             return response()->json([
        //                 'origen' => 'reniec',
        //                 'ya_es_trabajador' => false,
        //                 'persona' => $datos,
        //             ]);
        //         }
        //     } catch (Throwable $e) {
        //         report($e);
        //         // Falla silenciosa: se permite continuar con registro manual.
        //     }
        // }

        return response()->json([
            'origen' => 'nuevo',
            'ya_es_trabajador' => false,
            'persona' => null,
        ]);
    }

    public function store(StoreTrabajadorRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $trabajador = DB::transaction(function () use ($data) {
                // 1) Persona: reutilizar si ya existe (por num_documento), bloqueada con lockForUpdate.
                $persona = DB::table('personas')
                    ->where('num_documento', $data['num_documento'])
                    ->where('fk_tipo_documento', $data['fk_tipo_documento'])
                    ->lockForUpdate()
                    ->first();

                if ($persona) {
                    $yaEsTrabajador = DB::table('trabajadores')
                        ->where('fk_persona', $persona->id_persona)
                        ->lockForUpdate()
                        ->exists();

                    if ($yaEsTrabajador) {
                        throw ValidationException::withMessages([
                            'num_documento' => 'Ya existe un trabajador registrado con este número de documento.',
                        ]);
                    }

                    $idPersona = $persona->id_persona;

                    DB::table('personas')->where('id_persona', $idPersona)->update([
                        'nombres' => $data['nombres'],
                        'apellido_paterno' => $data['apellido_paterno'],
                        'apellido_materno' => $data['apellido_materno'] ?? null,
                        'telefono' => $data['telefono'],
                        'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                        'updated_at' => now(),
                    ]);
                } else {
                    $idPersona = DB::table('personas')->insertGetId([
                        'fk_tipo_documento' => $data['fk_tipo_documento'],
                        'num_documento' => $data['num_documento'],
                        'nombres' => $data['nombres'],
                        'apellido_paterno' => $data['apellido_paterno'],
                        'apellido_materno' => $data['apellido_materno'] ?? null,
                        'telefono' => $data['telefono'],
                        'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 2) Dirección (opcional).
                $idDireccion = null;
                if (! empty($data['direccion']) && ! empty($data['fk_distrito'])) {
                    $idDireccion = DB::table('direcciones')->insertGetId([
                        'direccion' => $data['direccion'],
                        'referencia' => $data['referencia'] ?? null,
                        'fk_distrito' => $data['fk_distrito'],
                    ]);
                }

                // 3) Usuario del sistema.
                $idUser = DB::table('users')->insertGetId([
                    'name' => trim($data['nombres'] . ' ' . $data['apellido_paterno'] . ' ' . ($data['apellido_materno'] ?? '')),
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // 4) Trabajador.
                $idTrabajador = DB::table('trabajadores')->insertGetId([
                    'fk_persona' => $idPersona,
                    'fk_user' => $idUser,
                    'fk_rol' => $data['fk_rol'],
                    'fk_direccion' => $idDireccion,
                    'fecha_ingreso' => $data['fecha_ingreso'],
                    'activo' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return DB::table('trabajadores')->where('id_trabajador', $idTrabajador)->first();
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'general' => 'No se pudo registrar el trabajador. Intenta nuevamente.',
            ]);
        }

        return response()->json([
            'message' => 'Trabajador registrado correctamente.',
            'trabajador' => $trabajador,
        ], 201);
    }

    public function update(UpdateTrabajadorRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();

        $trabajador = DB::table('trabajadores')->where('id_trabajador', $id)->first();

        if (! $trabajador) {
            abort(404, 'Trabajador no encontrado.');
        }

        try {
            DB::transaction(function () use ($data, $trabajador) {
                $persona = DB::table('personas')
                    ->where('id_persona', $trabajador->fk_persona)
                    ->lockForUpdate()
                    ->first();

                // Si cambia el número de documento, validar que no choque con otra persona.
                if ($data['num_documento'] !== $persona->num_documento
                    || (int) $data['fk_tipo_documento'] !== (int) $persona->fk_tipo_documento) {
                    $duplicado = DB::table('personas')
                        ->where('num_documento', $data['num_documento'])
                        ->where('fk_tipo_documento', $data['fk_tipo_documento'])
                        ->where('id_persona', '!=', $persona->id_persona)
                        ->exists();

                    if ($duplicado) {
                        throw ValidationException::withMessages([
                            'num_documento' => 'Ese número de documento ya pertenece a otra persona registrada.',
                        ]);
                    }
                }

                DB::table('personas')->where('id_persona', $persona->id_persona)->update([
                    'fk_tipo_documento' => $data['fk_tipo_documento'],
                    'num_documento' => $data['num_documento'],
                    'nombres' => $data['nombres'],
                    'apellido_paterno' => $data['apellido_paterno'],
                    'apellido_materno' => $data['apellido_materno'] ?? null,
                    'telefono' => $data['telefono'],
                    'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                    'updated_at' => now(),
                ]);

                // Email único (excluyendo al propio usuario) ya validado en el FormRequest.
                $userUpdate = [
                    'name' => trim($data['nombres'] . ' ' . $data['apellido_paterno'] . ' ' . ($data['apellido_materno'] ?? '')),
                    'email' => $data['email'],
                    'updated_at' => now(),
                ];

                if (! empty($data['password'])) {
                    $userUpdate['password'] = Hash::make($data['password']);
                }

                DB::table('users')->where('id', $trabajador->fk_user)->update($userUpdate);

                // Dirección: crear/actualizar/limpiar según lo enviado.
                $idDireccion = $trabajador->fk_direccion;

                if (! empty($data['direccion']) && ! empty($data['fk_distrito'])) {
                    if ($idDireccion) {
                        DB::table('direcciones')->where('id_direccion', $idDireccion)->update([
                            'direccion' => $data['direccion'],
                            'referencia' => $data['referencia'] ?? null,
                            'fk_distrito' => $data['fk_distrito'],
                        ]);
                    } else {
                        $idDireccion = DB::table('direcciones')->insertGetId([
                            'direccion' => $data['direccion'],
                            'referencia' => $data['referencia'] ?? null,
                            'fk_distrito' => $data['fk_distrito'],
                        ]);
                    }
                } else {
                    $idDireccion = null;
                }

                DB::table('trabajadores')->where('id_trabajador', $trabajador->id_trabajador)->update([
                    'fk_rol' => $data['fk_rol'],
                    'fk_direccion' => $idDireccion,
                    'fecha_ingreso' => $data['fecha_ingreso'],
                    'updated_at' => now(),
                ]);
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'general' => 'No se pudo actualizar el trabajador. Intenta nuevamente.',
            ]);
        }

        return response()->json([
            'message' => 'Trabajador actualizado correctamente.',
        ]);
    }

    /**
     * Activa/inactiva al trabajador. Un trabajador inactivo no puede iniciar sesión
     * (ver App\Listeners\CheckTrabajadorActivo).
     */
    public function toggleEstado(Request $request, int $id): JsonResponse
    {
        $trabajador = DB::table('trabajadores')->where('id_trabajador', $id)->first();

        if (! $trabajador) {
            abort(404, 'Trabajador no encontrado.');
        }

        if ($trabajador->fk_user === $request->user()->id) {
            throw ValidationException::withMessages([
                'general' => 'No puedes desactivar tu propia cuenta.',
            ]);
        }

        $nuevoEstado = $trabajador->activo ? 0 : 1;

        DB::transaction(function () use ($id, $nuevoEstado) {
            DB::table('trabajadores')->where('id_trabajador', $id)->lockForUpdate()->update([
                'activo' => $nuevoEstado,
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => $nuevoEstado ? 'Trabajador activado.' : 'Trabajador desactivado.',
            'activo' => (bool) $nuevoEstado,
        ]);
    }

    /**
     * Elimina al trabajador y su acceso al sistema. La persona (historial) se conserva.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $trabajador = DB::table('trabajadores')->where('id_trabajador', $id)->first();

        if (! $trabajador) {
            abort(404, 'Trabajador no encontrado.');
        }

        if ($trabajador->fk_user === $request->user()->id) {
            throw ValidationException::withMessages([
                'general' => 'No puedes eliminar tu propia cuenta.',
            ]);
        }

        // Se elimina el usuario; fk_trabajadores_user tiene ON DELETE CASCADE
        // por lo que el registro de trabajadores se elimina automáticamente.
        DB::table('users')->where('id', $trabajador->fk_user)->delete();

        return response()->json([
            'message' => 'Trabajador eliminado correctamente.',
        ]);
    }
}