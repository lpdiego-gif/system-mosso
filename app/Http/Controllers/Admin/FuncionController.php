<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Funcion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Feature flags para la entrega por fases del proyecto: cada módulo grande
 * (Puntos y cupones, Mascotas, Servicios, ...) tiene aquí su interruptor.
 * Cuando está apagado, el middleware `feature:<clave>` bloquea el acceso a
 * sus rutas y los menús dejan de mostrar sus ítems asociados — ver
 * `MenuCuentaService`/`MenuService`.
 */
class FuncionController extends Controller
{
    /** Columnas por las que se permite ordenar desde el listado. */
    private const ORDENABLES = ['nombre', 'clave', 'activo'];

    /** Opciones de "items por página" ofrecidas en la UI. */
    private const POR_PAGINA = [10, 25, 50, 100];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $items = Funcion::query()
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('clave', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%");
                });
            })
            ->orderBy($filtros['sort'], $filtros['dir'])
            ->orderBy('id_funcion')
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Funcion $item) => $this->transformar($item));

        return Inertia::render('Admin/Funciones/Index', [
            'items' => $items,
            'filtros' => $filtros,
            'opciones' => [
                'porPagina' => self::POR_PAGINA,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Funcion::create($request->validate($this->reglas()));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Función creada correctamente.']);

        return back();
    }

    public function update(Request $request, Funcion $funcion): RedirectResponse
    {
        $funcion->update($request->validate($this->reglas($funcion)));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Función actualizada correctamente.']);

        return back();
    }

    public function destroy(Funcion $funcion): RedirectResponse
    {
        $funcion->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Función eliminada correctamente.']);

        return back();
    }

    public function toggleStatus(Funcion $funcion): RedirectResponse
    {
        $funcion->update(['activo' => ! $funcion->activo]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $funcion->activo ? 'Función activada.' : 'Función desactivada.',
        ]);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * @return array{search: string|null, sort: string, dir: string, perPage: int}
     */
    private function filtros(Request $request): array
    {
        $sort = (string) $request->string('sort');
        $dir = strtolower((string) $request->string('dir'));
        $perPage = $request->integer('perPage', 10);
        $search = trim((string) $request->string('search'));

        return [
            'search' => $search !== '' ? $search : null,
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'nombre',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'asc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function reglas(?Funcion $actual = null): array
    {
        return [
            'clave' => [
                'required', 'string', 'max:50', 'alpha_dash',
                Rule::unique('funciones', 'clave')->ignore($actual?->id_funcion, 'id_funcion'),
            ],
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'activo' => ['boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(Funcion $item): array
    {
        return [
            'id_funcion' => $item->id_funcion,
            'clave' => $item->clave,
            'nombre' => $item->nombre,
            'descripcion' => $item->descripcion,
            'activo' => (bool) $item->activo,
        ];
    }
}
