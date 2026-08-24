<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductoController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LISTADO DE PRODUCTOS
    |--------------------------------------------------------------------------
    |
    | La relación es:
    |
    | productos
    |     ↓
    | sub_categorias
    |     ↓
    | categorias
    |     ↓
    | animales
    |
    | NO existe fk_id_animal en productos.
    |
    */

    public function index()
    {
        $productos = DB::table('productos as p')
            ->join(
                'sub_categorias as sc',
                'sc.id_subcategorias',
                '=',
                'p.fk_id_subcategorias'
            )
            ->join(
                'categorias as c',
                'c.id_categoria',
                '=',
                'sc.fk_id_categoria'
            )
            ->join(
                'animales as a',
                'a.id_animal',
                '=',
                'c.fk_id_animal'
            )
            ->join(
                'marcas as m',
                'm.id_marca',
                '=',
                'p.fk_marca'
            )
            ->join(
                'unidades_medida as um',
                'um.id_unidad_medida',
                '=',
                'p.fk_unidad_medida'
            )
            ->join(
                'estados_producto as ep',
                'ep.id_estado_producto',
                '=',
                'p.fk_estado'
            )
            ->select([
                'p.id_producto',
                'p.sku',
                'p.nombre',
                'p.descripcion',
                'p.fk_marca',
                'p.fk_unidad_medida',
                'p.fk_id_subcategorias',
                'p.precio',
                'p.stock',
                'p.imagen_principal',
                'p.fk_estado',
                'p.created_at',
                'p.updated_at',

                'a.id_animal',
                'a.nombre as animal_nombre',

                'c.id_categoria',
                'c.nombre as categoria_nombre',

                'sc.id_subcategorias',
                'sc.nom_sub_categoria as subcategoria_nombre',

                'm.nombre as marca_nombre',

                'um.nombre as unidad_nombre',
                'um.abreviatura as unidad_abreviatura',

                'ep.nombre as estado_nombre',
            ])
            ->orderByDesc('p.id_producto')
            ->get();

        return Inertia::render('Admin/Productos/Index', [
            'productos' => $productos,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FORMULARIO NUEVO PRODUCTO
    |--------------------------------------------------------------------------
    */

    public function create()
    {
        $animales = DB::table('animales')
            ->orderBy('nombre')
            ->get([
                'id_animal',
                'nombre',
            ]);

        $marcas = DB::table('marcas')
            ->orderBy('nombre')
            ->get([
                'id_marca',
                'nombre',
            ]);

        $unidades = DB::table('unidades_medida')
            ->orderBy('nombre')
            ->get([
                'id_unidad_medida',
                'nombre',
                'abreviatura',
            ]);

        $estados = DB::table('estados_producto')
            ->orderBy('id_estado_producto')
            ->get([
                'id_estado_producto',
                'nombre',
            ]);

        return Inertia::render('Admin/Productos/Create', [
            'animales' => $animales,
            'marcas' => $marcas,
            'unidades' => $unidades,
            'estados' => $estados,
            'categorias' => [],
            'subcategorias' => [],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORÍAS DE UN ANIMAL
    |--------------------------------------------------------------------------
    */

    public function categorias(int $animal)
    {
        $categorias = DB::table('categorias')
            ->where('fk_id_animal', $animal)
            ->orderBy('nombre')
            ->get([
                'id_categoria',
                'nombre',
                'descripcion',
                'fk_id_animal',
            ]);

        return response()->json($categorias);
    }

    /*
    |--------------------------------------------------------------------------
    | SUBCATEGORÍAS DE UNA CATEGORÍA
    |--------------------------------------------------------------------------
    */

    public function subcategorias(int $categoria)
    {
        $subcategorias = DB::table('sub_categorias')
            ->where('fk_id_categoria', $categoria)
            ->orderBy('nom_sub_categoria')
            ->get([
                'id_subcategorias',
                'nom_sub_categoria',
                'fk_id_categoria',
            ]);

        return response()->json($subcategorias);
    }

    /*
    |--------------------------------------------------------------------------
    | CREAR PRODUCTO
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fk_id_animal' => [
                'required',
                'integer',
                'exists:animales,id_animal',
            ],

            'fk_marca' => [
                'required',
                'integer',
                'exists:marcas,id_marca',
            ],

            'fk_unidad_medida' => [
                'required',
                'integer',
                'exists:unidades_medida,id_unidad_medida',
            ],

            'fk_estado' => [
                'required',
                'integer',
                'exists:estados_producto,id_estado_producto',
            ],

            'fk_id_subcategorias' => [
                'nullable',
                'integer',
                'exists:sub_categorias,id_subcategorias',
            ],

            'nombre' => [
                'required',
                'string',
                'max:150',
            ],

            'descripcion' => [
                'nullable',
                'string',
            ],

            'precio' => [
                'required',
                'numeric',
                'min:0',
            ],

            'stock' => [
                'required',
                'integer',
                'min:1',
            ],

            'imagen_principal' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | OBTENER ANIMAL
        |--------------------------------------------------------------------------
        */

        $animal = DB::table('animales')
            ->where('id_animal', $validated['fk_id_animal'])
            ->first();

        if (!$animal) {
            return back()
                ->withErrors([
                    'fk_id_animal' => 'El animal seleccionado no existe.',
                ])
                ->withInput();
        }

        $nombreAnimalNormalizado = Str::lower(
            Str::ascii($animal->nombre)
        );

        $esPerroOGato = in_array(
            $nombreAnimalNormalizado,
            ['perro', 'gato'],
            true
        );

        /*
        |--------------------------------------------------------------------------
        | DETERMINAR SUBCATEGORÍA
        |--------------------------------------------------------------------------
        |
        | Perro/Gato:
        |     se utiliza la subcategoría elegida.
        |
        | Exóticos:
        |     Animal → General → General
        |
        */

        if ($esPerroOGato) {
            if (
                empty($validated['fk_id_subcategorias'])
            ) {
                return back()
                    ->withErrors([
                        'fk_id_subcategorias' =>
                            'Debes seleccionar una subcategoría.',
                    ])
                    ->withInput();
            }

            /*
            | Verificamos que la subcategoría realmente
            | pertenezca a una categoría del animal seleccionado.
            */

            $subcategoria = DB::table('sub_categorias as sc')
                ->join(
                    'categorias as c',
                    'c.id_categoria',
                    '=',
                    'sc.fk_id_categoria'
                )
                ->where(
                    'sc.id_subcategorias',
                    $validated['fk_id_subcategorias']
                )
                ->where(
                    'c.fk_id_animal',
                    $validated['fk_id_animal']
                )
                ->select([
                    'sc.id_subcategorias',
                    'sc.fk_id_categoria',
                ])
                ->first();

            if (!$subcategoria) {
                return back()
                    ->withErrors([
                        'fk_id_subcategorias' =>
                            'La subcategoría no pertenece al animal seleccionado.',
                    ])
                    ->withInput();
            }

            $subcategoriaId =
                $subcategoria->id_subcategorias;
        } else {
            /*
            |--------------------------------------------------------------------------
            | ANIMALES EXÓTICOS
            |--------------------------------------------------------------------------
            |
            | No se permite que el formulario mande una categoría
            | diferente.
            |
            | El sistema crea o utiliza:
            |
            |     Animal
            |        ↓
            |     General
            |        ↓
            |     General
            |
            */

            $categoriaGeneral = DB::table('categorias')
                ->where(
                    'fk_id_animal',
                    $validated['fk_id_animal']
                )
                ->whereRaw(
                    'LOWER(nombre) = ?',
                    ['general']
                )
                ->first();

            if (!$categoriaGeneral) {
                $categoriaId = DB::table('categorias')->insertGetId([
                    'nombre' => 'General',
                    'descripcion' =>
                        'Productos generales para ' .
                        $animal->nombre,
                ]);
            } else {
                $categoriaId =
                    $categoriaGeneral->id_categoria;
            }

            $subcategoriaGeneral = DB::table('sub_categorias')
                ->where(
                    'fk_id_categoria',
                    $categoriaId
                )
                ->whereRaw(
                    'LOWER(nom_sub_categoria) = ?',
                    ['general']
                )
                ->first();

            if (!$subcategoriaGeneral) {
                $subcategoriaId =
                    DB::table('sub_categorias')->insertGetId([
                        'nom_sub_categoria' => 'General',
                        'fk_id_categoria' => $categoriaId,
                    ]);
            } else {
                $subcategoriaId =
                    $subcategoriaGeneral->id_subcategorias;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | GENERAR SKU
        |--------------------------------------------------------------------------
        |
        | Ejemplo:
        |
        | Perro + Purina Pro Plan + Mini Adulto
        |
        | PER-PUR-MINI-ADULTO
        |
        */

        $marca = DB::table('marcas')
            ->where('id_marca', $validated['fk_marca'])
            ->first();

        $prefijoAnimal = $this->generarPrefijo(
            $animal->nombre,
            3
        );

        $prefijoMarca = $this->generarPrefijo(
            $marca?->nombre ?? 'MARCA',
            3
        );

        $nombreProductoSku =
            $this->normalizarParaSku(
                $validated['nombre']
            );

        $sku = $prefijoAnimal
            . '-'
            . $prefijoMarca
            . '-'
            . $nombreProductoSku;

        /*
        |--------------------------------------------------------------------------
        | STOCK
        |--------------------------------------------------------------------------
        |
        | Si ya existe exactamente el mismo SKU:
        |
        | NO se crea otro producto.
        |
        | Solamente se suma el stock.
        |
        */

        $productoExistente = DB::table('productos')
            ->where('sku', $sku)
            ->first();

        if ($productoExistente) {
            DB::table('productos')
                ->where('id_producto', $productoExistente->id_producto)
                ->update([
                    'stock' =>
                        $productoExistente->stock
                        + $validated['stock'],
                    'updated_at' => now(),
                ]);

            return redirect()
                ->route('admin.productos.index')
                ->with(
                    'success',
                    'El producto ya existía. Se agregó el nuevo stock correctamente.'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | IMAGEN
        |--------------------------------------------------------------------------
        */

        $imagen = null;

        if ($request->hasFile('imagen_principal')) {
            $imagen = $request
                ->file('imagen_principal')
                ->store(
                    'productos',
                    'public'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | CREAR PRODUCTO
        |--------------------------------------------------------------------------
        */

        DB::table('productos')->insert([
            'sku' => $sku,
            'nombre' => $validated['nombre'],
            'descripcion' =>
                $validated['descripcion'] ?? null,

            /*
            | IMPORTANTE:
            | NO existe fk_id_animal aquí.
            */

            'fk_marca' =>
                $validated['fk_marca'],

            'fk_unidad_medida' =>
                $validated['fk_unidad_medida'],

            'fk_id_subcategorias' =>
                $subcategoriaId,

            'precio' =>
                $validated['precio'],

            'stock' =>
                $validated['stock'],

            'imagen_principal' =>
                $imagen,

            'fk_estado' =>
                $validated['fk_estado'],

            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()
            ->route('admin.productos.index')
            ->with(
                'success',
                'Producto registrado correctamente.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | PREFIJO PARA SKU
    |--------------------------------------------------------------------------
    */

    private function generarPrefijo(
        string $texto,
        int $longitud = 3
    ): string {
        $texto = Str::ascii($texto);

        $texto = preg_replace(
            '/[^A-Za-z0-9]/',
            '',
            $texto
        );

        $texto = strtoupper(
            substr($texto ?? '', 0, $longitud)
        );

        return $texto !== ''
            ? $texto
            : 'XXX';
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZAR NOMBRE PARA SKU
    |--------------------------------------------------------------------------
    */

    private function normalizarParaSku(
        string $texto
    ): string {
        $texto = Str::ascii($texto);

        $texto = strtoupper($texto);

        $texto = preg_replace(
            '/[^A-Z0-9]+/',
            '-',
            $texto
        );

        $texto = trim(
            $texto ?? '',
            '-'
        );

        /*
        | Dejamos el SKU dentro de varchar(50).
        */

        return substr(
            $texto,
            0,
            40
        );
    }
}