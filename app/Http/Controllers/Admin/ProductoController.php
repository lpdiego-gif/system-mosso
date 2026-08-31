<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Catálogo e inventario de productos.
 *
 * Jerarquía del catálogo:  productos → sub_categorias → categorias → animales.
 * `productos` no tiene fk_id_animal: el animal se deriva por la subcategoría.
 * Perro/Gato usan categoría + subcategoría reales; los animales exóticos van
 * a una rama «General → General» que el servidor crea si hace falta.
 */
class ProductoController extends Controller
{
    /** Stock por debajo (o igual) de este valor se considera «bajo». */
    private const UMBRAL_STOCK_BAJO = 5;

    private const ORDENABLES = ['nombre', 'precio', 'stock', 'creado'];

    private const POR_PAGINA = [12, 24, 48, 96];

    private const STOCK_FILTROS = ['todos', 'bajo', 'sin'];

    /*
    |--------------------------------------------------------------------------
    | Listado
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $query = $this->baseQuery()
            ->when($filtros['search'], function ($q, string $s) {
                $q->where(function ($sub) use ($s) {
                    $sub->where('p.nombre', 'like', "%{$s}%")
                        ->orWhere('p.sku', 'like', "%{$s}%")
                        ->orWhere('p.codigo_barras', 'like', "%{$s}%")
                        ->orWhere('m.nombre', 'like', "%{$s}%");
                });
            })
            ->when($filtros['animal'], fn ($q, $id) => $q->where('a.id_animal', $id))
            ->when($filtros['marca'], fn ($q, $id) => $q->where('p.fk_marca', $id))
            ->when($filtros['estado'], fn ($q, $id) => $q->where('p.fk_estado', $id))
            ->when($filtros['stock'] === 'sin', fn ($q) => $q->where('p.stock', 0))
            ->when($filtros['stock'] === 'bajo', fn ($q) => $q
                ->where('p.stock', '>', 0)
                ->where('p.stock', '<=', self::UMBRAL_STOCK_BAJO));

        $this->ordenar($query, $filtros['sort'], $filtros['dir']);

        $productos = $query->paginate($filtros['perPage'])->withQueryString();

        $descuentos = $this->descuentosVigentes(
            collect($productos->items())->pluck('id_producto')->all(),
        );

        $productos->through(fn ($p) => $this->transformarFila($p, $descuentos->get($p->id_producto)));

        return Inertia::render('Admin/Productos/Index', [
            'productos' => $productos,
            'filtros' => $filtros,
            'stats' => $this->stats(),
            'opciones' => [
                'animales' => DB::table('animales')->orderBy('nombre')->get(['id_animal', 'nombre']),
                'marcas' => DB::table('marcas')->orderBy('nombre')->get(['id_marca', 'nombre']),
                'estados' => DB::table('estados_producto')->orderBy('id_estado_producto')->get(['id_estado_producto', 'nombre']),
                'porPagina' => self::POR_PAGINA,
                'stock' => self::STOCK_FILTROS,
                'umbralStockBajo' => self::UMBRAL_STOCK_BAJO,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Detalle (JSON, para el panel lateral del listado)
    |--------------------------------------------------------------------------
    */

    public function show(int $producto): JsonResponse
    {
        $fila = $this->baseQuery()->where('p.id_producto', $producto)->first();

        abort_if(! $fila, 404);

        $descuento = $this->descuentosVigentes([$producto])->get($producto);

        return response()->json($this->transformarDetalle($fila, $descuento));
    }

    /*
    |--------------------------------------------------------------------------
    | Alta
    |--------------------------------------------------------------------------
    */

    public function create(): Response
    {
        return Inertia::render('Admin/Productos/Create', $this->lookupsFormulario());
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validar($request);

        $animal = DB::table('animales')->where('id_animal', $data['fk_id_animal'])->first();

        if (! $animal) {
            return back()->withErrors(['fk_id_animal' => 'El animal seleccionado no existe.'])->withInput();
        }

        $subcategoriaId = $this->resolverSubcategoria($animal, $data, $request);

        if ($subcategoriaId instanceof RedirectResponse) {
            return $subcategoriaId;
        }

        $etapaId = $this->resolverEtapa($request, (int) $data['fk_id_animal']);

        $sku = $this->generarSku($animal->nombre, (int) $data['fk_marca'], $data['nombre']);

        // Mismo SKU exacto ⇒ no se duplica el producto, solo se suma stock.
        $existente = DB::table('productos')->where('sku', $sku)->first();

        if ($existente) {
            DB::table('productos')->where('id_producto', $existente->id_producto)->update([
                'stock' => $existente->stock + $data['stock'],
                'codigo_barras' => $existente->codigo_barras ?: ($data['codigo_barras'] ?: null),
                'updated_at' => now(),
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'El producto ya existía: se sumó el stock ingresado.']);

            return redirect()->route('admin.productos.index');
        }

        $imagen = $request->hasFile('imagen_principal')
            ? $request->file('imagen_principal')->store('productos', 'public')
            : null;

        DB::table('productos')->insert([
            'sku' => $sku,
            'codigo_barras' => $data['codigo_barras'] ?: null,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?: null,
            'fk_marca' => $data['fk_marca'],
            'fk_unidad_medida' => $data['fk_unidad_medida'],
            'fk_id_subcategorias' => $subcategoriaId,
            'fk_etapa_vida' => $etapaId,
            'precio' => $data['precio'],
            'stock' => $data['stock'],
            'imagen_principal' => $imagen,
            'fk_estado' => $data['fk_estado'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto registrado correctamente.']);

        return redirect()->route('admin.productos.index');
    }

    /*
    |--------------------------------------------------------------------------
    | Edición
    |--------------------------------------------------------------------------
    */

    public function edit(int $producto): Response
    {
        $fila = $this->baseQuery()->where('p.id_producto', $producto)->first();

        abort_if(! $fila, 404);

        $categorias = $fila->id_animal
            ? DB::table('categorias')->where('fk_id_animal', $fila->id_animal)->orderBy('nombre')->get(['id_categoria', 'nombre', 'fk_id_animal'])
            : collect();

        $subcategorias = $fila->id_categoria
            ? DB::table('sub_categorias')->where('fk_id_categoria', $fila->id_categoria)->orderBy('nom_sub_categoria')->get(['id_subcategorias', 'nom_sub_categoria', 'fk_id_categoria'])
            : collect();

        $etapas = $fila->id_animal
            ? DB::table('etapas_vida')->where('fk_animal', $fila->id_animal)->orderBy('edad_min_meses')->get(['id_etapa_vida', 'nombre', 'edad_min_meses', 'edad_max_meses'])
            : collect();

        return Inertia::render('Admin/Productos/Edit', [
            ...$this->lookupsFormulario(),
            'categorias' => $categorias,
            'subcategorias' => $subcategorias,
            'etapas' => $etapas,
            'producto' => [
                'id_producto' => $fila->id_producto,
                'sku' => $fila->sku,
                'codigo_barras' => $fila->codigo_barras,
                'nombre' => $fila->nombre,
                'descripcion' => $fila->descripcion,
                'fk_id_animal' => $fila->id_animal ? (string) $fila->id_animal : '',
                'fk_id_categoria' => $fila->id_categoria ? (string) $fila->id_categoria : '',
                'fk_id_subcategorias' => $fila->id_subcategorias ? (string) $fila->id_subcategorias : '',
                'fk_etapa_vida' => $fila->fk_etapa_vida ? (string) $fila->fk_etapa_vida : '',
                'fk_marca' => (string) $fila->fk_marca,
                'fk_unidad_medida' => (string) $fila->fk_unidad_medida,
                'fk_estado' => (string) $fila->fk_estado,
                'precio' => (string) $fila->precio,
                'stock' => (string) $fila->stock,
                'imagen_url' => Producto::urlImagen($fila->imagen_principal),
            ],
        ]);
    }

    public function update(Request $request, int $producto): RedirectResponse
    {
        $actual = DB::table('productos')->where('id_producto', $producto)->first();

        abort_if(! $actual, 404);

        $data = $this->validar($request, $producto);

        $animal = DB::table('animales')->where('id_animal', $data['fk_id_animal'])->first();

        if (! $animal) {
            return back()->withErrors(['fk_id_animal' => 'El animal seleccionado no existe.'])->withInput();
        }

        $subcategoriaId = $this->resolverSubcategoria($animal, $data, $request);

        if ($subcategoriaId instanceof RedirectResponse) {
            return $subcategoriaId;
        }

        $etapaId = $this->resolverEtapa($request, (int) $data['fk_id_animal']);

        $imagen = $actual->imagen_principal;

        if ($request->boolean('eliminar_imagen') && $imagen) {
            Storage::disk('public')->delete($imagen);
            $imagen = null;
        }

        if ($request->hasFile('imagen_principal')) {
            if ($imagen) {
                Storage::disk('public')->delete($imagen);
            }
            $imagen = $request->file('imagen_principal')->store('productos', 'public');
        }

        DB::table('productos')->where('id_producto', $producto)->update([
            'codigo_barras' => $data['codigo_barras'] ?: null,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?: null,
            'fk_marca' => $data['fk_marca'],
            'fk_unidad_medida' => $data['fk_unidad_medida'],
            'fk_id_subcategorias' => $subcategoriaId,
            'fk_etapa_vida' => $etapaId,
            'precio' => $data['precio'],
            'stock' => $data['stock'],
            'imagen_principal' => $imagen,
            'fk_estado' => $data['fk_estado'],
            'updated_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto actualizado correctamente.']);

        return redirect()->route('admin.productos.index');
    }

    public function destroy(int $producto): RedirectResponse
    {
        $existe = DB::table('productos')->where('id_producto', $producto)->first();

        abort_if(! $existe, 404);

        $enPedidos = DB::table('pedido_detalle')->where('fk_producto', $producto)->exists();
        $enCupones = DB::table('cupones')->where('fk_producto_regalo', $producto)->exists();

        if ($enPedidos || $enCupones) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el producto tiene pedidos o cupones asociados. Desactívalo en su lugar.',
            ]);

            return back();
        }

        if ($existe->imagen_principal) {
            Storage::disk('public')->delete($existe->imagen_principal);
        }

        // ON DELETE CASCADE limpia descuentos, carrito_detalle y producto_imagenes.
        DB::table('productos')->where('id_producto', $producto)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Producto eliminado correctamente.']);

        return back();
    }

    public function toggleEstado(int $producto): RedirectResponse
    {
        $actual = DB::table('productos')->where('id_producto', $producto)->value('fk_estado');

        abort_if($actual === null, 404);

        $nuevo = (int) $actual === 1 ? 2 : 1;

        DB::table('productos')->where('id_producto', $producto)->update([
            'fk_estado' => $nuevo,
            'updated_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $nuevo === 1 ? 'Producto activado.' : 'Producto desactivado.',
        ]);

        return back();
    }

    public function ajustarStock(Request $request, int $producto): RedirectResponse
    {
        $actual = DB::table('productos')->where('id_producto', $producto)->value('stock');

        abort_if($actual === null, 404);

        $datos = $request->validate([
            'modo' => ['required', Rule::in(['set', 'add', 'subtract'])],
            'cantidad' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);

        $nuevo = match ($datos['modo']) {
            'add' => $actual + $datos['cantidad'],
            'subtract' => max(0, $actual - $datos['cantidad']),
            default => $datos['cantidad'],
        };

        DB::table('productos')->where('id_producto', $producto)->update([
            'stock' => $nuevo,
            'updated_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Stock actualizado a {$nuevo}."]);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Endpoints auxiliares (JSON)
    |--------------------------------------------------------------------------
    */

    public function categorias(int $animal): JsonResponse
    {
        return response()->json(
            DB::table('categorias')
                ->where('fk_id_animal', $animal)
                ->orderBy('nombre')
                ->get(['id_categoria', 'nombre', 'descripcion', 'fk_id_animal']),
        );
    }

    public function subcategorias(int $categoria): JsonResponse
    {
        return response()->json(
            DB::table('sub_categorias')
                ->where('fk_id_categoria', $categoria)
                ->orderBy('nom_sub_categoria')
                ->get(['id_subcategorias', 'nom_sub_categoria', 'fk_id_categoria']),
        );
    }

    public function etapas(int $animal): JsonResponse
    {
        return response()->json(
            DB::table('etapas_vida')
                ->where('fk_animal', $animal)
                ->orderBy('edad_min_meses')
                ->get(['id_etapa_vida', 'nombre', 'edad_min_meses', 'edad_max_meses']),
        );
    }

    /** Busca un producto por su código de barras exacto (para el escaneo del listado). */
    public function buscarCodigo(Request $request): JsonResponse
    {
        $codigo = trim((string) $request->string('codigo'));

        $id = $codigo === ''
            ? null
            : DB::table('productos')->where('codigo_barras', $codigo)->value('id_producto');

        return response()->json(['id_producto' => $id]);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function baseQuery(): Builder
    {
        return DB::table('productos as p')
            ->join('marcas as m', 'm.id_marca', '=', 'p.fk_marca')
            ->join('unidades_medida as um', 'um.id_unidad_medida', '=', 'p.fk_unidad_medida')
            ->join('estados_producto as ep', 'ep.id_estado_producto', '=', 'p.fk_estado')
            ->leftJoin('sub_categorias as sc', 'sc.id_subcategorias', '=', 'p.fk_id_subcategorias')
            ->leftJoin('categorias as c', 'c.id_categoria', '=', 'sc.fk_id_categoria')
            ->leftJoin('animales as a', 'a.id_animal', '=', 'c.fk_id_animal')
            ->leftJoin('etapas_vida as ev', 'ev.id_etapa_vida', '=', 'p.fk_etapa_vida')
            ->select([
                'p.id_producto', 'p.sku', 'p.codigo_barras', 'p.nombre', 'p.descripcion',
                'p.fk_marca', 'p.fk_unidad_medida', 'p.fk_id_subcategorias', 'p.fk_etapa_vida',
                'p.precio', 'p.stock', 'p.imagen_principal', 'p.fk_estado', 'p.created_at', 'p.updated_at',
                'a.id_animal', 'a.nombre as animal_nombre',
                'c.id_categoria', 'c.nombre as categoria_nombre',
                'sc.id_subcategorias', 'sc.nom_sub_categoria as subcategoria_nombre',
                'm.nombre as marca_nombre',
                'um.nombre as unidad_nombre', 'um.abreviatura as unidad_abreviatura',
                'ep.nombre as estado_nombre',
                'ev.nombre as etapa_nombre',
            ]);
    }

    /**
     * @return array{search: string|null, animal: int|null, marca: int|null, estado: int|null, stock: string, sort: string, dir: string, perPage: int}
     */
    private function filtros(Request $request): array
    {
        $sort = (string) $request->string('sort');
        $dir = strtolower((string) $request->string('dir'));
        $perPage = $request->integer('perPage', 24);
        $stock = (string) $request->string('stock');
        $search = trim((string) $request->string('search'));

        return [
            'search' => $search !== '' ? $search : null,
            'animal' => $request->integer('animal') ?: null,
            'marca' => $request->integer('marca') ?: null,
            'estado' => $request->integer('estado') ?: null,
            'stock' => in_array($stock, self::STOCK_FILTROS, true) ? $stock : 'todos',
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'creado',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'desc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 24,
        ];
    }

    private function ordenar(Builder $query, string $sort, string $dir): void
    {
        match ($sort) {
            'nombre' => $query->orderBy('p.nombre', $dir),
            'precio' => $query->orderBy('p.precio', $dir),
            'stock' => $query->orderBy('p.stock', $dir),
            default => $query->orderBy('p.id_producto', $dir),
        };

        $query->orderBy('p.id_producto', 'desc');
    }

    /**
     * @param  array<int, int>  $ids
     * @return Collection<int, object>
     */
    private function descuentosVigentes(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return DB::table('descuentos')
            ->whereIn('fk_producto', $ids)
            ->where('activo', 1)
            ->where('fecha_inicio', '<=', now())
            ->where('fecha_fin', '>=', now())
            ->orderByDesc('id_descuento')
            ->get()
            ->unique('fk_producto')
            ->keyBy('fk_producto');
    }

    private function precioFinal(float $precio, ?object $descuento): float
    {
        if (! $descuento) {
            return round($precio, 2);
        }

        $rebaja = $descuento->tipo === 'porcentaje'
            ? $precio * (float) $descuento->valor / 100
            : (float) $descuento->valor;

        return round(max(0, $precio - $rebaja), 2);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarFila(object $p, ?object $descuento): array
    {
        $precio = (float) $p->precio;

        return [
            'id_producto' => $p->id_producto,
            'sku' => $p->sku,
            'codigo_barras' => $p->codigo_barras,
            'nombre' => $p->nombre,
            'marca_nombre' => $p->marca_nombre,
            'animal_nombre' => $p->animal_nombre,
            'categoria_nombre' => $p->categoria_nombre,
            'subcategoria_nombre' => $p->subcategoria_nombre,
            'etapa_nombre' => $p->etapa_nombre,
            'unidad_abreviatura' => $p->unidad_abreviatura,
            'precio' => $precio,
            'precio_final' => $this->precioFinal($precio, $descuento),
            'descuento_label' => $descuento
                ? ($descuento->tipo === 'porcentaje'
                    ? '-'.rtrim(rtrim(number_format((float) $descuento->valor, 2, '.', ''), '0'), '.').'%'
                    : '-S/ '.number_format((float) $descuento->valor, 2))
                : null,
            'stock' => (int) $p->stock,
            'stock_bajo' => (int) $p->stock > 0 && (int) $p->stock <= self::UMBRAL_STOCK_BAJO,
            'activo' => (int) $p->fk_estado === 1,
            'estado_nombre' => $p->estado_nombre,
            'imagen_url' => Producto::urlImagen($p->imagen_principal),
            'creado_en' => $p->created_at,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformarDetalle(object $p, ?object $descuento): array
    {
        return [
            ...$this->transformarFila($p, $descuento),
            'descripcion' => $p->descripcion,
            'unidad_nombre' => $p->unidad_nombre,
            'actualizado_en' => $p->updated_at,
        ];
    }

    /**
     * @return array<string, Collection<int, object>>
     */
    private function lookupsFormulario(): array
    {
        return [
            'animales' => DB::table('animales')->orderBy('nombre')->get(['id_animal', 'nombre']),
            'marcas' => DB::table('marcas')->orderBy('nombre')->get(['id_marca', 'nombre']),
            'unidades' => DB::table('unidades_medida')->orderBy('nombre')->get(['id_unidad_medida', 'nombre', 'abreviatura']),
            'estados' => DB::table('estados_producto')->orderBy('id_estado_producto')->get(['id_estado_producto', 'nombre']),
        ];
    }

    private function stats(): array
    {
        return [
            'total' => DB::table('productos')->count(),
            'activos' => DB::table('productos')->where('fk_estado', 1)->count(),
            'sin_stock' => DB::table('productos')->where('stock', 0)->count(),
            'valor_inventario' => (float) DB::table('productos')
                ->selectRaw('COALESCE(SUM(precio * stock), 0) as v')->value('v'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?int $ignorarId = null): array
    {
        return $request->validate([
            'fk_id_animal' => ['required', 'integer', Rule::exists('animales', 'id_animal')],
            'fk_marca' => ['required', 'integer', Rule::exists('marcas', 'id_marca')],
            'fk_unidad_medida' => ['required', 'integer', Rule::exists('unidades_medida', 'id_unidad_medida')],
            'fk_estado' => ['required', 'integer', Rule::exists('estados_producto', 'id_estado_producto')],
            'fk_id_subcategorias' => ['nullable', 'integer', Rule::exists('sub_categorias', 'id_subcategorias')],
            'fk_etapa_vida' => ['nullable', 'integer', Rule::exists('etapas_vida', 'id_etapa_vida')],
            'codigo_barras' => [
                'nullable', 'string', 'min:6', 'max:20', 'regex:/^[0-9]+$/',
                Rule::unique('productos', 'codigo_barras')->ignore($ignorarId, 'id_producto'),
            ],
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'precio' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'imagen_principal' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'eliminar_imagen' => ['nullable', 'boolean'],
        ], [
            'codigo_barras.regex' => 'El código de barras solo puede contener dígitos.',
            'codigo_barras.unique' => 'Ese código de barras ya pertenece a otro producto.',
        ]);
    }

    /**
     * Perro/Gato: valida la subcategoría enviada. Exóticos: rama «General → General».
     *
     * @param  array<string, mixed>  $data
     * @return int|RedirectResponse
     */
    private function resolverSubcategoria(object $animal, array $data, Request $request)
    {
        $esPerroOGato = in_array(Str::lower(Str::ascii($animal->nombre)), ['perro', 'gato'], true);

        if ($esPerroOGato) {
            if (empty($data['fk_id_subcategorias'])) {
                return back()->withErrors(['fk_id_subcategorias' => 'Debes seleccionar una subcategoría.'])->withInput();
            }

            $ok = DB::table('sub_categorias as sc')
                ->join('categorias as c', 'c.id_categoria', '=', 'sc.fk_id_categoria')
                ->where('sc.id_subcategorias', $data['fk_id_subcategorias'])
                ->where('c.fk_id_animal', $data['fk_id_animal'])
                ->exists();

            if (! $ok) {
                return back()->withErrors(['fk_id_subcategorias' => 'La subcategoría no pertenece al animal seleccionado.'])->withInput();
            }

            return (int) $data['fk_id_subcategorias'];
        }

        $categoriaId = DB::table('categorias')
            ->where('fk_id_animal', $data['fk_id_animal'])
            ->whereRaw('LOWER(nombre) = ?', ['general'])
            ->value('id_categoria')
            ?? DB::table('categorias')->insertGetId([
                'nombre' => 'General',
                'descripcion' => 'Productos generales para '.$animal->nombre,
                'fk_id_animal' => $data['fk_id_animal'],
            ]);

        return DB::table('sub_categorias')
            ->where('fk_id_categoria', $categoriaId)
            ->whereRaw('LOWER(nom_sub_categoria) = ?', ['general'])
            ->value('id_subcategorias')
            ?? DB::table('sub_categorias')->insertGetId([
                'nom_sub_categoria' => 'General',
                'fk_id_categoria' => $categoriaId,
            ]);
    }

    private function resolverEtapa(Request $request, int $animalId): ?int
    {
        $etapa = $request->integer('fk_etapa_vida') ?: null;

        if (! $etapa) {
            return null;
        }

        $pertenece = DB::table('etapas_vida')
            ->where('id_etapa_vida', $etapa)
            ->where('fk_animal', $animalId)
            ->exists();

        return $pertenece ? $etapa : null;
    }

    private function generarSku(string $animal, int $marcaId, string $nombre): string
    {
        $marca = DB::table('marcas')->where('id_marca', $marcaId)->value('nombre') ?? 'MARCA';

        $prefijo = fn (string $t, int $n) => strtoupper(
            substr(preg_replace('/[^A-Za-z0-9]/', '', Str::ascii($t)) ?: 'XXX', 0, $n),
        ) ?: 'XXX';

        $nombreSku = trim(
            preg_replace('/[^A-Z0-9]+/', '-', strtoupper(Str::ascii($nombre))) ?: '',
            '-',
        );

        return substr($prefijo($animal, 3).'-'.$prefijo($marca, 3).'-'.$nombreSku, 0, 50);
    }
}
