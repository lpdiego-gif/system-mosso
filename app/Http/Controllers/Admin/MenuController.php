<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    /** Valores válidos de la columna enum `menus.tipo_enlace`. */
    private const TIPOS_ENLACE = ['animal', 'tipo_animal', 'marca', 'tipo_servicio', 'url'];

    /** Columnas por las que se permite ordenar desde el listado. */
    private const ORDENABLES = ['nombre', 'tipo_enlace', 'orden', 'destacado', 'activo'];

    /** Opciones de "items por página" ofrecidas en la UI. */
    private const POR_PAGINA = [10, 25, 50, 100];

    /** @var array<int, string> */
    private array $animalesMap = [];

    /** @var array<int, string> */
    private array $tiposAnimalMap = [];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $this->animalesMap = DB::table('animales')->pluck('nombre', 'id_animal')->all();
        $this->tiposAnimalMap = DB::table('tipo_animales')->pluck('nombre', 'id_tipo_animal')->all();

        $menus = Menu::query()
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('tipo_enlace', 'like', "%{$search}%");
                });
            })
            ->orderBy($filtros['sort'], $filtros['dir'])
            ->orderBy('id_menu')
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Menu $menu) => $this->transformar($menu));

        return Inertia::render('Admin/Menus/Index', [
            'menus' => $menus,
            'filtros' => $filtros,
            'opciones' => [
                'tiposEnlace' => self::TIPOS_ENLACE,
                'porPagina' => self::POR_PAGINA,
                'animales' => DB::table('animales')
                    ->orderBy('nombre')
                    ->get(['id_animal', 'nombre']),
                'tiposAnimal' => DB::table('tipo_animales')
                    ->orderBy('nombre')
                    ->get(['id_tipo_animal', 'nombre']),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->normalizar($request);

        Menu::create($request->validate($this->reglas()));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menú creado correctamente.']);

        return back();
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $this->normalizar($request);

        $menu->update($request->validate($this->reglas()));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menú actualizado correctamente.']);

        return back();
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $menu->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menú eliminado correctamente.']);

        return back();
    }

    public function toggleStatus(Menu $menu): RedirectResponse
    {
        $menu->update(['activo' => ! $menu->activo]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $menu->activo ? 'Menú activado.' : 'Menú desactivado.',
        ]);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Normaliza búsqueda, orden, dirección y paginación con valores seguros
     * por defecto para que la query nunca reciba entradas inválidas.
     *
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
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'orden',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'asc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    /**
     * Deja en `null` los campos que no aplican al tipo de enlace elegido y
     * castea los checkboxes, para que `required_if` y la BD reciban datos
     * coherentes.
     */
    private function normalizar(Request $request): void
    {
        $tipo = (string) $request->string('tipo_enlace');

        $request->merge([
            'fk_animal' => $tipo === 'animal' ? $request->input('fk_animal') : null,
            'fk_tipo_animal' => $tipo === 'tipo_animal' ? $request->input('fk_tipo_animal') : null,
            'url' => $tipo === 'url' ? $request->input('url') : null,
            'destacado' => $request->boolean('destacado'),
            'activo' => $request->boolean('activo'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function reglas(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:50'],
            'tipo_enlace' => ['required', Rule::in(self::TIPOS_ENLACE)],
            'fk_animal' => ['nullable', 'required_if:tipo_enlace,animal', 'integer', Rule::exists('animales', 'id_animal')],
            'fk_tipo_animal' => ['nullable', 'required_if:tipo_enlace,tipo_animal', 'integer', Rule::exists('tipo_animales', 'id_tipo_animal')],
            'url' => ['nullable', 'required_if:tipo_enlace,url', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'orden' => ['required', 'integer', 'min:0', 'max:9999'],
            'destacado' => ['boolean'],
            'activo' => ['boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(Menu $menu): array
    {
        return [
            'id_menu' => $menu->id_menu,
            'nombre' => $menu->nombre,
            'tipo_enlace' => $menu->tipo_enlace,
            'fk_animal' => $menu->fk_animal,
            'fk_tipo_animal' => $menu->fk_tipo_animal,
            'url' => $menu->url,
            'icono' => $menu->icono,
            'orden' => $menu->orden,
            'destacado' => (bool) $menu->destacado,
            'activo' => (bool) $menu->activo,
            'destino' => $this->destino($menu),
        ];
    }

    private function destino(Menu $menu): string
    {
        return match ($menu->tipo_enlace) {
            'animal' => $this->animalesMap[$menu->fk_animal] ?? '—',
            'tipo_animal' => $this->tiposAnimalMap[$menu->fk_tipo_animal] ?? '—',
            'marca' => 'Todas las marcas',
            'tipo_servicio' => 'Sección de servicios',
            'url' => $menu->url ?? '—',
            default => '—',
        };
    }
}
