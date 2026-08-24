import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

interface Animal {
    id_animal: number;
    nombre: string;
}

interface Categoria {
    id_categoria: number;
    nombre: string;
    descripcion?: string | null;
    fk_id_animal: number;
}

interface SubCategoria {
    id_subcategorias: number;
    nom_sub_categoria: string;
    fk_id_categoria: number;
}

interface Marca {
    id_marca: number;
    nombre: string;
}

interface Unidad {
    id_unidad_medida: number;
    nombre: string;
    abreviatura: string;
}

interface Estado {
    id_estado_producto: number;
    nombre: string;
}

interface Props {
    animales: Animal[];
    marcas: Marca[];
    unidades: Unidad[];
    estados: Estado[];
    categorias?: Categoria[];
    subcategorias?: SubCategoria[];
}

type ModalType =
    | 'animal'
    | 'categoria'
    | 'subcategoria'
    | 'marca'
    | null;

export default function Create({
    animales: initialAnimales,
    marcas: initialMarcas,
    unidades,
    estados,
}: Props) {
    /*
    |--------------------------------------------------------------------------
    | Estados
    |--------------------------------------------------------------------------
    */

    const [animales, setAnimales] =
        useState<Animal[]>(initialAnimales);

    const [categorias, setCategorias] =
        useState<Categoria[]>([]);

    const [subcategorias, setSubcategorias] =
        useState<SubCategoria[]>([]);

    const [marcas, setMarcas] =
        useState<Marca[]>(initialMarcas);

    const [modal, setModal] =
        useState<ModalType>(null);

    const [animalNombre, setAnimalNombre] =
        useState('');

    const [categoriaNombre, setCategoriaNombre] =
        useState('');

    const [categoriaDescripcion, setCategoriaDescripcion] =
        useState('');

    const [subcategoriaNombre, setSubcategoriaNombre] =
        useState('');

    const [marcaNombre, setMarcaNombre] =
        useState('');

    const [imagenPreview, setImagenPreview] =
        useState<string | null>(null);

    const [categoriaId, setCategoriaId] =
        useState('');

    const form = useForm({
        fk_id_animal: '',
        fk_id_subcategorias: null as string | null,
        fk_marca: '',
        fk_unidad_medida: '',
        fk_estado: '',
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '1',
        imagen_principal: null as File | null,
    });

    /*
    |--------------------------------------------------------------------------
    | Animal seleccionado
    |--------------------------------------------------------------------------
    */

    const selectedAnimal = useMemo(
        () =>
            animales.find(
                (animal) =>
                    animal.id_animal ===
                    Number(form.data.fk_id_animal),
            ),
        [animales, form.data.fk_id_animal],
    );

    const esPerroOGato =
        selectedAnimal !== undefined &&
        ['perro', 'gato'].includes(
            selectedAnimal.nombre.toLowerCase(),
        );

    const esExotico =
        selectedAnimal !== undefined && !esPerroOGato;

    /*
    |--------------------------------------------------------------------------
    | SKU visual
    |
    | El SKU definitivo debe generarse en el backend.
    | Aquí solamente mostramos una vista previa.
    |--------------------------------------------------------------------------
    */

    const skuPreview = useMemo(() => {
        if (!selectedAnimal) {
            return '';
        }

        const prefijoAnimal = selectedAnimal.nombre
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 3)
            .toUpperCase();

        const nombreProducto = form.data.nombre
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 20)
            .toUpperCase();

        if (!nombreProducto) {
            return `${prefijoAnimal}-`;
        }

        return `${prefijoAnimal}-${nombreProducto}`;
    }, [
        selectedAnimal,
        form.data.nombre,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Cargar categorías cuando cambia el animal
    |--------------------------------------------------------------------------
    */

    const cargarCategorias = async (
    animalId: number,
) => {
    try {
        const response = await fetch(
            route(
                'admin.productos.categorias',
                animalId,
            ),
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            setCategorias([]);

            return;
        }

        const data: Categoria[] =
            await response.json();

        setCategorias(data);
    } catch {
        setCategorias([]);
    }
};

    /*
    |--------------------------------------------------------------------------
    | Cargar subcategorías
    |--------------------------------------------------------------------------
    */

    const cargarSubcategorias = async (
        idCategoria: number,
    ) => {
        try {
            const response = await fetch(
                route(
                    'admin.productos.subcategorias',
                    idCategoria,
                ),
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                setSubcategorias([]);

                return;
            }

            const data: SubCategoria[] =
                await response.json();

            setSubcategorias(data);
        } catch {
            setSubcategorias([]);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Cambio de animal
    |--------------------------------------------------------------------------
    */

    const handleAnimalChange = async (
    value: string,
) => {
    form.setData(
        'fk_id_animal',
        value,
    );

    form.setData(
        'fk_id_subcategorias',
        null,
    );

    // Cada cambio de animal empieza
    // nuevamente sin categoría ni subcategoría.
    setCategorias([]);
    setSubcategorias([]);
    setCategoriaId('');

    if (!value) {
        return;
    }

    const animal = animales.find(
        (item) =>
            item.id_animal === Number(value),
    );

    if (!animal) {
        return;
    }

    const animalEsPerroOGato =
        ['perro', 'gato'].includes(
            animal.nombre.toLowerCase(),
        );

    // Hamster, Aves, Peces, Conejo, etc.
    // no tienen categoría ni subcategoría.
    if (!animalEsPerroOGato) {
        return;
    }

    await cargarCategorias(
        animal.id_animal,
    );
};

    /*
    |--------------------------------------------------------------------------
    | Cambio de categoría
    |--------------------------------------------------------------------------
    */

    const handleCategoriaChange = async (
        value: string,
    ) => {
        setCategoriaId(value);

        form.setData(
            'fk_id_subcategorias',
            null,
        );

        setSubcategorias([]);

        if (!value) {
            return;
        }

        await cargarSubcategorias(
            Number(value),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Imagen
    |--------------------------------------------------------------------------
    */

    const handleImage = (
        file: File | null,
    ) => {
        form.setData(
            'imagen_principal',
            file,
        );

        if (!file) {
            setImagenPreview(null);

            return;
        }

        const url =
            URL.createObjectURL(file);

        setImagenPreview(url);
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const submit = (
        event: FormEvent,
    ) => {
        event.preventDefault();

        /*
         * Para animales exóticos:
         *
         * fk_id_subcategorias = null
         *
         * Para perro/gato:
         *
         * debe existir una subcategoría.
         */

        if (esExotico) {
            form.setData(
                'fk_id_subcategorias',
                null,
            );
        }

        form.post(
            route('admin.productos.store'),
            {
                forceFormData: true,

                onSuccess: () => {
                    setImagenPreview(null);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Crear animal
    |--------------------------------------------------------------------------
    */

    const crearAnimal = async () => {
        const nombre = animalNombre.trim();

        if (!nombre) {
            return;
        }

        try {
            const response = await fetch(
                route(
                    'admin.animales.store',
                ),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Accept:
                            'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector(
                                    'meta[name="csrf-token"]',
                                )
                                ?.getAttribute(
                                    'content',
                                ) ?? '',
                    },
                    body: JSON.stringify({
                        nombre,
                    }),
                },
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.animal) {
                return;
            }

            setAnimales(
                (current) => [
                    ...current,
                    data.animal,
                ],
            );

            form.setData(
                'fk_id_animal',
                String(
                    data.animal.id_animal,
                ),
            );

            form.setData(
                'fk_id_subcategorias',
                null,
            );

            setAnimalNombre('');
            setModal(null);
        } catch {
            // El backend debe devolver los errores
            // mediante la respuesta HTTP.
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Crear categoría
    |--------------------------------------------------------------------------
    */

    const crearCategoria = async () => {
        const nombre =
            categoriaNombre.trim();

        const animalId =
            form.data.fk_id_animal;

        if (!nombre || !animalId) {
            return;
        }

        try {
            const response = await fetch(
                route(
                    'admin.categorias.store',
                ),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Accept:
                            'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector(
                                    'meta[name="csrf-token"]',
                                )
                                ?.getAttribute(
                                    'content',
                                ) ?? '',
                    },
                    body: JSON.stringify({
                        nombre,
                        descripcion:
                            categoriaDescripcion.trim() ||
                            null,
                        fk_id_animal:
                            Number(animalId),
                    }),
                },
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.categoria) {
                return;
            }

            setCategorias(
                (current) => [
                    ...current,
                    data.categoria,
                ],
            );

            const newCategoryId =
                data.categoria.id_categoria;

            setCategoriaId(
                String(newCategoryId),
            );

            form.setData(
                'fk_id_subcategorias',
                null,
            );

            setCategoriaNombre('');
            setCategoriaDescripcion('');
            setModal(null);

            await cargarSubcategorias(
                Number(newCategoryId),
            );
        } catch {
            // El backend debe manejar la respuesta.
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Crear subcategoría
    |--------------------------------------------------------------------------
    */

    const crearSubcategoria = async () => {
        const nombre =
            subcategoriaNombre.trim();

        if (!nombre || !categoriaId) {
            return;
        }

        try {
            const response = await fetch(
                route(
                    'admin.subcategorias.store',
                ),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Accept:
                            'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector(
                                    'meta[name="csrf-token"]',
                                )
                                ?.getAttribute(
                                    'content',
                                ) ?? '',
                    },
                    body: JSON.stringify({
                        nom_sub_categoria:
                            nombre,
                        fk_id_categoria:
                            Number(
                                categoriaId,
                            ),
                    }),
                },
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.subcategoria) {
                return;
            }

            setSubcategorias(
                (current) => [
                    ...current,
                    data.subcategoria,
                ],
            );

            form.setData(
                'fk_id_subcategorias',
                String(
                    data.subcategoria
                        .id_subcategorias,
                ),
            );

            setSubcategoriaNombre('');
            setModal(null);
        } catch {
            // El backend debe manejar la respuesta.
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Crear marca
    |--------------------------------------------------------------------------
    */

    const crearMarca = async () => {
        const nombre =
            marcaNombre.trim();

        if (!nombre) {
            return;
        }

        try {
            const response = await fetch(
                route(
                    'admin.marcas.store',
                ),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Accept:
                            'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector(
                                    'meta[name="csrf-token"]',
                                )
                                ?.getAttribute(
                                    'content',
                                ) ?? '',
                    },
                    body: JSON.stringify({
                        nombre,
                    }),
                },
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.marca) {
                return;
            }

            setMarcas(
                (current) => [
                    ...current,
                    data.marca,
                ],
            );

            form.setData(
                'fk_marca',
                String(
                    data.marca.id_marca,
                ),
            );

            setMarcaNombre('');
            setModal(null);
        } catch {
            // El backend debe manejar la respuesta.
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Nuevo producto" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Nuevo producto
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Registra un producto en el
                            catálogo de MOSSO.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'admin.productos.index',
                        )}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← Volver a productos
                    </Link>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:p-8"
                >
                    {/* ANIMAL */}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Animal *
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <select
                                value={
                                    form.data.fk_id_animal
                                }
                                onChange={(event) =>
                                    handleAnimalChange(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">
                                    Seleccionar animal
                                </option>

                                {animales.map(
                                    (animal) => (
                                        <option
                                            key={
                                                animal.id_animal
                                            }
                                            value={
                                                animal.id_animal
                                            }
                                        >
                                            {animal.nombre}
                                        </option>
                                    ),
                                )}
                            </select>

                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        'animal',
                                    )
                                }
                                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                                + Nuevo animal
                            </button>
                        </div>

                        {form.errors.fk_id_animal && (
                            <p className="text-sm text-destructive">
                                {
                                    form.errors
                                        .fk_id_animal
                                }
                            </p>
                        )}
                    </div>

                    {/* CATEGORÍA Y SUBCATEGORÍA */}

                    {esPerroOGato && (
                        <>
                            {/* CATEGORÍA */}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Categoría *
                                </label>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <select
                                        id="categoria_id"
                                        value={categoriaId}
                                        onChange={(
                                            event,
                                        ) =>
                                            handleCategoriaChange(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">
                                            Seleccionar categoría
                                        </option>

                                        {categorias.map(
                                            (
                                                categoria,
                                            ) => (
                                                <option
                                                    key={
                                                        categoria.id_categoria
                                                    }
                                                    value={
                                                        categoria.id_categoria
                                                    }
                                                >
                                                    {
                                                        categoria.nombre
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModal(
                                                'categoria',
                                            )
                                        }
                                        disabled={
                                            !form
                                                .data
                                                .fk_id_animal
                                        }
                                        className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        + Nueva categoría
                                    </button>
                                </div>

                                {form.errors
                                    .fk_id_subcategorias && (
                                    <p className="text-sm text-destructive">
                                        {
                                            form
                                                .errors
                                                .fk_id_subcategorias
                                        }
                                    </p>
                                )}
                            </div>

                            {/* SUBCATEGORÍA */}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Subcategoría *
                                </label>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <select
                                        value={
                                            form.data
                                                .fk_id_subcategorias ??
                                            ''
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            form.setData(
                                                'fk_id_subcategorias',
                                                event
                                                    .target
                                                    .value ||
                                                    null,
                                            )
                                        }
                                        disabled={
                                            !categoriaId ||
                                            subcategorias.length ===
                                                0
                                        }
                                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            {!categoriaId
                                                ? 'Selecciona una categoría primero'
                                                : subcategorias.length ===
                                                    0
                                                  ? 'Esta categoría no tiene subcategorías'
                                                  : 'Seleccionar subcategoría'}
                                        </option>

                                        {subcategorias.map(
                                            (
                                                subcategoria,
                                            ) => (
                                                <option
                                                    key={
                                                        subcategoria.id_subcategorias
                                                    }
                                                    value={
                                                        subcategoria.id_subcategorias
                                                    }
                                                >
                                                    {
                                                        subcategoria.nom_sub_categoria
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModal(
                                                'subcategoria',
                                            )
                                        }
                                        disabled={
                                            !categoriaId
                                        }
                                        className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        + Nueva subcategoría
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* EXÓTICOS */}

                    {esExotico && (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                            <strong className="text-foreground">
                                {selectedAnimal?.nombre}
                            </strong>{' '}
                            pertenece a Exóticos.
                            <br />
                            Este tipo de animal no utiliza
                            categorías ni subcategorías.
                        </div>
                    )}

                    {/* CAMPOS */}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* SKU */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                SKU
                            </label>

                            <input
                                type="text"
                                value={
                                    skuPreview
                                }
                                readOnly
                                placeholder="Se genera automáticamente"
                                className="w-full rounded-lg border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                            />

                            <p className="text-xs text-muted-foreground">
                                Vista previa. El SKU
                                definitivo se genera en
                                el servidor.
                            </p>
                        </div>

                        {/* MARCA */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Marca *
                            </label>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                    value={
                                        form.data
                                            .fk_marca
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        form.setData(
                                            'fk_marca',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">
                                        Seleccionar marca
                                    </option>

                                    {marcas.map(
                                        (marca) => (
                                            <option
                                                key={
                                                    marca.id_marca
                                                }
                                                value={
                                                    marca.id_marca
                                                }
                                            >
                                                {
                                                    marca.nombre
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setModal(
                                            'marca',
                                        )
                                    }
                                    className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                                >
                                    + Nueva
                                </button>
                            </div>

                            {form.errors.fk_marca && (
                                <p className="text-sm text-destructive">
                                    {
                                        form.errors
                                            .fk_marca
                                    }
                                </p>
                            )}
                        </div>

                        {/* NOMBRE */}

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                                Nombre del producto *
                            </label>

                            <input
                                value={
                                    form.data
                                        .nombre
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'nombre',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Ej. Royal Canin Mini Adult"
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />

                            {form.errors.nombre && (
                                <p className="text-sm text-destructive">
                                    {
                                        form.errors
                                            .nombre
                                    }
                                </p>
                            )}
                        </div>

                        {/* DESCRIPCIÓN */}

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                                Descripción
                            </label>

                            <textarea
                                value={
                                    form.data
                                        .descripcion
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'descripcion',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                rows={4}
                                placeholder="Descripción del producto..."
                                className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* PRECIO */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Precio *
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    form.data
                                        .precio
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'precio',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="0.00"
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />

                            {form.errors.precio && (
                                <p className="text-sm text-destructive">
                                    {
                                        form.errors
                                            .precio
                                    }
                                </p>
                            )}
                        </div>

                        {/* STOCK */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Stock *
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    form.data
                                        .stock
                                }
                                onChange={(event) => {
                                    const value =
                                        event
                                            .target
                                            .value;

                                    if (
                                        value === ''
                                    ) {
                                        form.setData(
                                            'stock',
                                            '',
                                        );

                                        return;
                                    }

                                    const number =
                                        Number(
                                            value,
                                        );

                                    if (
                                        Number.isInteger(
                                            number,
                                        ) &&
                                        number >= 1
                                    ) {
                                        form.setData(
                                            'stock',
                                            String(
                                                number,
                                            ),
                                        );
                                    }
                                }}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />

                            <p className="text-xs text-muted-foreground">
                                Debe ser un número entero
                                mayor o igual a 1.
                            </p>

                            {form.errors.stock && (
                                <p className="text-sm text-destructive">
                                    {
                                        form.errors
                                            .stock
                                    }
                                </p>
                            )}
                        </div>

                        {/* UNIDAD */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Unidad de medida *
                            </label>

                            <select
                                value={
                                    form.data
                                        .fk_unidad_medida
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'fk_unidad_medida',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">
                                    Seleccionar unidad
                                </option>

                                {unidades.map(
                                    (unidad) => (
                                        <option
                                            key={
                                                unidad.id_unidad_medida
                                            }
                                            value={
                                                unidad.id_unidad_medida
                                            }
                                        >
                                            {
                                                unidad.nombre
                                            }{' '}
                                            (
                                            {
                                                unidad.abreviatura
                                            }
                                            )
                                        </option>
                                    ),
                                )}
                            </select>

                            {form.errors
                                .fk_unidad_medida && (
                                <p className="text-sm text-destructive">
                                    {
                                        form
                                            .errors
                                            .fk_unidad_medida
                                    }
                                </p>
                            )}
                        </div>

                        {/* ESTADO */}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Estado *
                            </label>

                            <select
                                value={
                                    form.data
                                        .fk_estado
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'fk_estado',
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">
                                    Seleccionar estado
                                </option>

                                {estados.map(
                                    (estado) => (
                                        <option
                                            key={
                                                estado.id_estado_producto
                                            }
                                            value={
                                                estado.id_estado_producto
                                            }
                                        >
                                            {
                                                estado.nombre
                                            }
                                        </option>
                                    ),
                                )}
                            </select>

                            {form.errors.fk_estado && (
                                <p className="text-sm text-destructive">
                                    {
                                        form
                                            .errors
                                            .fk_estado
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    {/* IMAGEN */}

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium">
                                Imagen principal
                            </label>

                            <p className="mt-1 text-xs text-muted-foreground">
                                JPG, PNG o WebP. Máximo
                                5 MB. Se mostrará en un
                                formato cuadrado uniforme.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="aspect-square w-full max-w-[260px] overflow-hidden rounded-xl border bg-muted">
                                {imagenPreview ? (
                                    <img
                                        src={
                                            imagenPreview
                                        }
                                        alt="Vista previa"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                                        IMAGEN
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(
                                        event,
                                    ) =>
                                        handleImage(
                                            event
                                                .target
                                                .files?.[0] ??
                                                null,
                                        )
                                    }
                                    className="block w-full text-sm"
                                />

                                {form.errors
                                    .imagen_principal && (
                                    <p className="text-sm text-destructive">
                                        {
                                            form
                                                .errors
                                                .imagen_principal
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTONES */}

                    <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                        <Link
                            href={route(
                                'admin.productos.index',
                            )}
                            className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                form.processing
                            }
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Guardando...'
                                : 'Guardar producto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* MODAL ANIMAL */}

            {modal === 'animal' && (
                <Modal
                    title="Nuevo animal"
                    onClose={() =>
                        setModal(null)
                    }
                >
                    <div className="space-y-4">
                        <input
                            autoFocus
                            value={
                                animalNombre
                            }
                            onChange={(event) =>
                                setAnimalNombre(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Ej. Hamster"
                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        null,
                                    )
                                }
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    crearAnimal
                                }
                                disabled={
                                    !animalNombre.trim()
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL CATEGORÍA */}

            {modal === 'categoria' && (
                <Modal
                    title="Nueva categoría"
                    onClose={() =>
                        setModal(null)
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Animal
                            </label>

                            <div className="rounded-lg border bg-muted px-3 py-2.5 text-sm">
                                {
                                    selectedAnimal?.nombre
                                }
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Nombre
                            </label>

                            <input
                                autoFocus
                                value={
                                    categoriaNombre
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCategoriaNombre(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Ej. Alimentos"
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Descripción
                            </label>

                            <textarea
                                value={
                                    categoriaDescripcion
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCategoriaDescripcion(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                rows={3}
                                placeholder="Descripción de la categoría..."
                                className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        null,
                                    )
                                }
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    crearCategoria
                                }
                                disabled={
                                    !categoriaNombre.trim() ||
                                    !form.data
                                        .fk_id_animal
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL SUBCATEGORÍA */}

            {modal === 'subcategoria' && (
                <Modal
                    title="Nueva subcategoría"
                    onClose={() =>
                        setModal(null)
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Categoría
                            </label>

                            <div className="rounded-lg border bg-muted px-3 py-2.5 text-sm">
                                {categorias.find(
                                    (categoria) =>
                                        categoria.id_categoria ===
                                        Number(
                                            categoriaId,
                                        ),
                                )?.nombre ??
                                    'Categoría seleccionada'}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Nombre
                            </label>

                            <input
                                autoFocus
                                value={
                                    subcategoriaNombre
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSubcategoriaNombre(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Ej. Alimento Seco"
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        null,
                                    )
                                }
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    crearSubcategoria
                                }
                                disabled={
                                    !subcategoriaNombre.trim() ||
                                    !categoriaId
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL MARCA */}

            {modal === 'marca' && (
                <Modal
                    title="Nueva marca"
                    onClose={() =>
                        setModal(null)
                    }
                >
                    <div className="space-y-4">
                        <input
                            autoFocus
                            value={
                                marcaNombre
                            }
                            onChange={(event) =>
                                setMarcaNombre(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Ej. Royal Canin"
                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        null,
                                    )
                                }
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    crearMarca
                                }
                                disabled={
                                    !marcaNombre.trim()
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Modal reutilizable
|--------------------------------------------------------------------------
*/

function Modal({
    title,
    children,
    onClose,
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border bg-background p-6 shadow-2xl"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}