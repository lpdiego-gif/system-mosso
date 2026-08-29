<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCuenta;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MenuCuentaController extends Controller
{
    /** Valores válidos de la columna enum `menu_cuenta.tipo`. */
    private const TIPOS = ['seccion_interna', 'url'];

    /**
     * Secciones reales del panel "Mi Cuenta" que existen en el código —
     * el admin solo puede elegir entre estas para un ítem `seccion_interna`,
     * nunca escribir una clave libre, porque cada una depende de una página
     * ya programada en el frontend.
     *
     * @var array<string, string>
     */
    private const CLAVES_INTERNAS = [
        'pedidos' => 'Mis pedidos',
        'direcciones' => 'Direcciones',
        'mascotas' => 'Mis mascotas',
        'puntos_cupones' => 'Puntos y cupones',
        'detalles' => 'Detalles de la cuenta',
    ];

    /** Columnas por las que se permite ordenar desde el listado. */
    private const ORDENABLES = ['nombre', 'tipo', 'orden', 'activo'];

    /** Opciones de "items por página" ofrecidas en la UI. */
    private const POR_PAGINA = [10, 25, 50, 100];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $items = MenuCuenta::query()
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('tipo', 'like', "%{$search}%");
                });
            })
            ->orderBy($filtros['sort'], $filtros['dir'])
            ->orderBy('id_menu_cuenta')
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (MenuCuenta $item) => $this->transformar($item));

        $clavesUsadas = MenuCuenta::query()
            ->where('tipo', 'seccion_interna')
            ->pluck('clave')
            ->all();

        return Inertia::render('Admin/MenuCuenta/Index', [
            'items' => $items,
            'filtros' => $filtros,
            'opciones' => [
                'tipos' => self::TIPOS,
                'porPagina' => self::POR_PAGINA,
                'clavesInternas' => self::CLAVES_INTERNAS,
                'clavesDisponibles' => array_diff(array_keys(self::CLAVES_INTERNAS), $clavesUsadas),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->normalizar($request);

        MenuCuenta::create($request->validate($this->reglas()));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sección de Mi Cuenta creada correctamente.']);

        return back();
    }

    public function update(Request $request, MenuCuenta $menuCuenta): RedirectResponse
    {
        $this->normalizar($request);

        // Una vez creado, un ítem `seccion_interna` no puede repuntarse a otra
        // clave desde el formulario — solo se puede renombrar/reordenar/ocultar.
        // La clave sólo se fija al crear el ítem.
        if ($menuCuenta->tipo === 'seccion_interna') {
            $request->merge(['clave' => $menuCuenta->clave]);
        }

        $menuCuenta->update($request->validate($this->reglas($menuCuenta)));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sección actualizada correctamente.']);

        return back();
    }

    public function destroy(MenuCuenta $menuCuenta): RedirectResponse
    {
        $menuCuenta->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sección eliminada correctamente.']);

        return back();
    }

    public function toggleStatus(MenuCuenta $menuCuenta): RedirectResponse
    {
        $menuCuenta->update(['activo' => ! $menuCuenta->activo]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $menuCuenta->activo ? 'Sección activada.' : 'Sección desactivada.',
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
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'orden',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'asc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    /**
     * Deja en `null` los campos que no aplican al tipo elegido y castea el
     * checkbox de activo, para que `required_if` y la BD reciban datos
     * coherentes.
     */
    private function normalizar(Request $request): void
    {
        $tipo = (string) $request->string('tipo');

        $request->merge([
            'clave' => $tipo === 'seccion_interna' ? $request->input('clave') : null,
            'url' => $tipo === 'url' ? $request->input('url') : null,
            'activo' => $request->boolean('activo'),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function reglas(?MenuCuenta $actual = null): array
    {
        return [
            'tipo' => ['required', Rule::in(self::TIPOS)],
            'clave' => [
                'nullable',
                'required_if:tipo,seccion_interna',
                Rule::in(array_keys(self::CLAVES_INTERNAS)),
                Rule::unique('menu_cuenta', 'clave')->ignore($actual?->id_menu_cuenta, 'id_menu_cuenta'),
            ],
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:150'],
            'url' => ['nullable', 'required_if:tipo,url', 'string', 'max:255'],
            'icono' => ['nullable', 'string', 'max:50'],
            'orden' => ['required', 'integer', 'min:0', 'max:9999'],
            'activo' => ['boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(MenuCuenta $item): array
    {
        return [
            'id_menu_cuenta' => $item->id_menu_cuenta,
            'tipo' => $item->tipo,
            'clave' => $item->clave,
            'nombre' => $item->nombre,
            'descripcion' => $item->descripcion,
            'icono' => $item->icono,
            'url' => $item->url,
            'orden' => $item->orden,
            'activo' => (bool) $item->activo,
            'destino' => $item->tipo === 'url'
                ? ($item->url ?? '—')
                : (self::CLAVES_INTERNAS[$item->clave] ?? $item->clave ?? '—'),
        ];
    }
}
