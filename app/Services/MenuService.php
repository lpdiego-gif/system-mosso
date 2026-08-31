<?php

namespace App\Services;

use App\Models\Animal;
use App\Models\Marca;
use App\Models\Menu;
use App\Models\Producto;
use App\Models\TipoServicio;

class MenuService
{
    /** Máximo de miniaturas de producto a mostrar por subcategoría en el menú. */
    private const MAX_PRODUCTOS_PREVIEW = 10;

    public function __construct(private readonly FuncionService $funciones) {}

    public function build(): array
    {
        return Menu::where('activo', true)
            ->orderBy('orden')
            ->get()
            ->filter(fn (Menu $item) => $this->visible($item))
            ->map(fn (Menu $item) => $this->resolveItem($item))
            ->values()
            ->toArray();
    }

    /**
     * Los ítems de tipo `tipo_servicio` (el nav "Servicios") además dependen
     * del feature flag `servicios` en `funciones` -- entrega por fases.
     */
    private function visible(Menu $item): bool
    {
        if ($item->tipo_enlace === 'tipo_servicio') {
            return $this->funciones->activa('servicios');
        }

        return true;
    }

    private function resolveItem(Menu $item): array
    {
        $base = [
            'id' => $item->id_menu,
            'nombre' => $item->nombre,
            'icono' => $item->icono,
            'destacado' => $item->destacado,
            'tipo' => $item->tipo_enlace,
        ];

        return match ($item->tipo_enlace) {
            'animal' => [
                ...$base,
                'href' => "/catalogo/animal/{$item->fk_animal}",
                'columnas' => $this->columnasAnimal($item->fk_animal),
            ],
            'tipo_animal' => [
                ...$base,
                'href' => null,
                'columnas' => $this->columnasTipoAnimal($item->fk_tipo_animal),
            ],
            'marca' => [
                ...$base,
                'href' => '/marcas',
                'columnas' => $this->columnasMarcas(),
            ],
            'tipo_servicio' => [
                ...$base,
                'href' => '/servicios',
                'columnas' => $this->columnasServicios(),
            ],
            'url' => [
                ...$base,
                'href' => $item->url,
                'columnas' => [],
            ],
            default => [...$base, 'href' => '#', 'columnas' => []],
        };
    }

    // Perros / Gatos -> categorías (izquierda) + subcategorías con vista previa de productos (derecha)
    private function columnasAnimal(int $fkAnimal): array
    {
        $categorias = Animal::findOrFail($fkAnimal)
            ->categorias() // hasMany en el modelo Animal
            ->with(['subCategorias.productos' => function ($query) {
                // Solo productos activos y con imagen: son los únicos que tiene sentido mostrar en el menú.
                $query->activos()->whereNotNull('imagen_principal')->latest('id_producto');
            }])
            ->get();

        return [
            [
                'titulo' => 'Categorías',
                'items' => $categorias->map(fn ($cat) => [
                    'id' => $cat->id_categoria,
                    'nombre' => $cat->nombre,
                    'href' => "/catalogo/categoria/{$cat->id_categoria}",
                    'hijos' => $cat->subCategorias->map(function ($sub) {
                        $productos = $sub->productos;

                        return [
                            'id' => $sub->id_subcategorias,
                            'nombre' => $sub->nom_sub_categoria,
                            'href' => "/catalogo/subcategoria/{$sub->id_subcategorias}",
                            'productos' => $productos->take(self::MAX_PRODUCTOS_PREVIEW)->map(fn ($p) => [
                                'id' => $p->id_producto,
                                'nombre' => $p->nombre,
                                'imagen' => Producto::urlImagen($p->imagen_principal),
                            ])->values(),
                            'totalProductos' => $productos->count(),
                        ];
                    }),
                ]),
            ],
        ];
    }

    // Exóticos -> lista simple de animales (Loro, Hámster, Aves, Peces...)
    private function columnasTipoAnimal(int $fkTipoAnimal): array
    {
        $animales = Animal::where('id_tipo_animal', $fkTipoAnimal)->get();

        return [
            [
                'titulo' => null,
                'items' => $animales->map(fn ($a) => [
                    'id' => $a->id_animal,
                    'nombre' => $a->nombre,
                    'href' => "/catalogo/animal/{$a->id_animal}",
                    'hijos' => [],
                ]),
            ],
        ];
    }

    private function columnasMarcas(): array
    {
        return [
            [
                'titulo' => null,
                'items' => Marca::orderBy('nombre')->get()
                    ->filter(fn ($m) => $m->logo && file_exists(public_path("image/marcas/{$m->logo}")))
                    ->map(fn ($m) => [
                        'id' => $m->id_marca,
                        'nombre' => $m->nombre,
                        'href' => "/marcas/{$m->id_marca}",
                        'logo' => "/image/marcas/{$m->logo}",
                        'hijos' => [],
                    ])->values(),
            ],
        ];
    }

    private function columnasServicios(): array
    {
        return [
            [
                'titulo' => null,
                'items' => TipoServicio::orderBy('nombre')->get()->map(fn ($t) => [
                    'id' => $t->id_tipo_servicio,
                    'nombre' => $t->nombre,
                    'href' => "/servicios/{$t->id_tipo_servicio}",
                    'hijos' => [],
                ]),
            ],
        ];
    }
}