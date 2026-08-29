import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    Boxes,
    ImagePlus,
    Layers,
    Loader2,
    Package,
    Plus,
    Tag,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { BarcodeField } from '@/components/productos/barcode-field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type {
    AnimalOption,
    CategoriaOption,
    EstadoOption,
    EtapaOption,
    MarcaOption,
    ProductoEditData,
    ProductoFormLookups,
    SubCategoriaOption,
    UnidadOption,
} from '@/types/producto';

interface Props {
    lookups: ProductoFormLookups;
    producto?: ProductoEditData;
    categorias?: CategoriaOption[];
    subcategorias?: SubCategoriaOption[];
    etapas?: EtapaOption[];
}

interface FormShape {
    fk_id_animal: string;
    fk_id_subcategorias: string;
    fk_etapa_vida: string;
    fk_marca: string;
    fk_unidad_medida: string;
    fk_estado: string;
    codigo_barras: string;
    nombre: string;
    descripcion: string;
    precio: string;
    stock: string;
    imagen_principal: File | null;
    eliminar_imagen: boolean;
}

const controlBase =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30';

function csrf(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const esPerroOGato = (nombre?: string) =>
    !!nombre && ['perro', 'gato'].includes(nombre.toLowerCase());

function valoresIniciales(p: ProductoEditData | undefined): FormShape {
    return {
        fk_id_animal: p?.fk_id_animal ?? '',
        fk_id_subcategorias: p?.fk_id_subcategorias ?? '',
        fk_etapa_vida: p?.fk_etapa_vida ?? '',
        fk_marca: p?.fk_marca ?? '',
        fk_unidad_medida: p?.fk_unidad_medida ?? '',
        fk_estado: p?.fk_estado ?? '1',
        codigo_barras: p?.codigo_barras ?? '',
        nombre: p?.nombre ?? '',
        descripcion: p?.descripcion ?? '',
        precio: p?.precio ?? '',
        stock: p?.stock ?? '1',
        imagen_principal: null,
        eliminar_imagen: false,
    };
}

function Field({
    label,
    htmlFor,
    required,
    hint,
    error,
    className,
    children,
}: {
    label: ReactNode;
    htmlFor?: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
                {label}
                {required ? <span className="text-destructive">*</span> : null}
            </Label>
            {children}
            {hint && !error ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
            {error ? (
                <p className="text-xs font-medium text-destructive">{error}</p>
            ) : null}
        </div>
    );
}

function Seccion({
    icon: Icon,
    titulo,
    descripcion,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-start gap-3.5 border-b p-4 sm:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                    <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                    <h2 className="font-semibold tracking-tight text-foreground">
                        {titulo}
                    </h2>
                    {descripcion ? (
                        <p className="text-sm text-pretty text-muted-foreground">
                            {descripcion}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

function SelectConAlta({
    value,
    onChange,
    disabled,
    placeholder,
    onAdd,
    addLabel,
    children,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder: string;
    onAdd?: () => void;
    addLabel: string;
    children: ReactNode;
}) {
    return (
        <div className="flex gap-2">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={controlBase}
            >
                <option value="">{placeholder}</option>
                {children}
            </select>
            {onAdd ? (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onAdd}
                    disabled={disabled}
                    aria-label={addLabel}
                    title={addLabel}
                    className="size-9 shrink-0"
                >
                    <Plus className="size-4" />
                </Button>
            ) : null}
        </div>
    );
}

type QuickType = 'animal' | 'categoria' | 'subcategoria' | 'marca' | null;

export default function ProductoForm({
    lookups,
    producto,
    categorias: categoriasIniciales = [],
    subcategorias: subcategoriasIniciales = [],
    etapas: etapasIniciales = [],
}: Props) {
    const isEdit = producto !== undefined;

    const [animales, setAnimales] = useState<AnimalOption[]>(lookups.animales);
    const [marcas, setMarcas] = useState<MarcaOption[]>(lookups.marcas);
    const [categorias, setCategorias] =
        useState<CategoriaOption[]>(categoriasIniciales);
    const [subcategorias, setSubcategorias] = useState<SubCategoriaOption[]>(
        subcategoriasIniciales,
    );
    const [etapas, setEtapas] = useState<EtapaOption[]>(etapasIniciales);

    const [categoriaId, setCategoriaId] = useState(
        producto?.fk_id_categoria ?? '',
    );
    const [imagenPreview, setImagenPreview] = useState<string | null>(
        producto?.imagen_url ?? null,
    );

    const [quick, setQuick] = useState<QuickType>(null);
    const [quickNombre, setQuickNombre] = useState('');
    const [quickDescripcion, setQuickDescripcion] = useState('');
    const [quickError, setQuickError] = useState<string | null>(null);
    const [quickLoading, setQuickLoading] = useState(false);

    const form = useForm<FormShape>(valoresIniciales(producto));
    const { data, errors, setData } = form;

    const animalSel = useMemo(
        () => animales.find((a) => String(a.id_animal) === data.fk_id_animal),
        [animales, data.fk_id_animal],
    );
    const perroOGato = esPerroOGato(animalSel?.nombre);
    const exotico = animalSel !== undefined && !perroOGato;

    const marcaSel = marcas.find((m) => String(m.id_marca) === data.fk_marca);

    const skuPreview = useMemo(() => {
        if (!animalSel) {
            return '';
        }

        const sinTildes = (t: string) =>
            t.normalize('NFD').replace(/\p{Diacritic}/gu, '');

        const pref = (t: string, n: number) =>
            sinTildes(t)
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, n)
                .toUpperCase() || 'XXX';

        const nombre = sinTildes(data.nombre)
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 24)
            .toUpperCase();

        return `${pref(animalSel.nombre, 3)}-${pref(marcaSel?.nombre ?? 'MAR', 3)}-${nombre || '…'}`;
    }, [animalSel, marcaSel, data.nombre]);

    /* Cascadas animal → categoría → subcategoría → etapa. */

    async function cargar<T>(url: string): Promise<T[]> {
        try {
            const { data: res } = await axios.get(url, {
                headers: { Accept: 'application/json' },
            });

            return res as T[];
        } catch {
            return [];
        }
    }

    async function cambiarAnimal(value: string) {
        setData((prev) => ({
            ...prev,
            fk_id_animal: value,
            fk_id_subcategorias: '',
            fk_etapa_vida: '',
        }));
        setCategoriaId('');
        setCategorias([]);
        setSubcategorias([]);
        setEtapas([]);

        if (!value) {
            return;
        }

        const animal = animales.find((a) => String(a.id_animal) === value);
        setEtapas(
            await cargar<EtapaOption>(
                route('admin.productos.etapas', Number(value)),
            ),
        );

        if (animal && esPerroOGato(animal.nombre)) {
            setCategorias(
                await cargar<CategoriaOption>(
                    route('admin.productos.categorias', Number(value)),
                ),
            );
        }
    }

    async function cambiarCategoria(value: string) {
        setCategoriaId(value);
        setData('fk_id_subcategorias', '');
        setSubcategorias([]);

        if (value) {
            setSubcategorias(
                await cargar<SubCategoriaOption>(
                    route('admin.productos.subcategorias', Number(value)),
                ),
            );
        }
    }

    function handleImagen(file: File | null) {
        setData((prev) => ({
            ...prev,
            imagen_principal: file,
            eliminar_imagen: false,
        }));
        setImagenPreview(
            file ? URL.createObjectURL(file) : (producto?.imagen_url ?? null),
        );
    }

    function quitarImagen() {
        setData((prev) => ({
            ...prev,
            imagen_principal: null,
            eliminar_imagen: true,
        }));
        setImagenPreview(null);
    }

    /* Alta rápida (animal / marca / categoría / subcategoría). */

    function abrirQuick(tipo: Exclude<QuickType, null>) {
        setQuick(tipo);
        setQuickNombre('');
        setQuickDescripcion('');
        setQuickError(null);
    }

    async function guardarQuick() {
        const nombre = quickNombre.trim();

        if (!nombre || !quick) {
            return;
        }

        setQuickLoading(true);
        setQuickError(null);

        const config = {
            animal: {
                url: route('admin.animales.store'),
                body: { nombre },
                key: 'animal',
            },
            marca: {
                url: route('admin.marcas.store'),
                body: { nombre },
                key: 'marca',
            },
            categoria: {
                url: route('admin.categorias.store'),
                body: {
                    nombre,
                    descripcion: quickDescripcion.trim() || null,
                    fk_id_animal: Number(data.fk_id_animal),
                },
                key: 'categoria',
            },
            subcategoria: {
                url: route('admin.subcategorias.store'),
                body: {
                    nom_sub_categoria: nombre,
                    fk_id_categoria: Number(categoriaId),
                },
                key: 'subcategoria',
            },
        }[quick];

        try {
            const { data: res } = await axios.post(config.url, config.body, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                },
            });

            const creado = res[config.key];

            if (quick === 'animal' && creado) {
                setAnimales((a) => [...a, creado]);
                await cambiarAnimal(String(creado.id_animal));
            } else if (quick === 'marca' && creado) {
                setMarcas((m) => [...m, creado]);
                setData('fk_marca', String(creado.id_marca));
            } else if (quick === 'categoria' && creado) {
                setCategorias((c) => [...c, creado]);
                await cambiarCategoria(String(creado.id_categoria));
            } else if (quick === 'subcategoria' && creado) {
                setSubcategorias((s) => [...s, creado]);
                setData(
                    'fk_id_subcategorias',
                    String(creado.id_subcategorias),
                );
            }

            setQuick(null);
        } catch (e) {
            const err = e as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            const primero = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0]?.[0]
                : undefined;
            setQuickError(primero ?? 'No se pudo guardar. Revisa el nombre.');
        } finally {
            setQuickLoading(false);
        }
    }

    const nombreRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!isEdit) {
            nombreRef.current?.focus();
        }
    }, [isEdit]);

    function submit(e: FormEvent) {
        e.preventDefault();

        const opts = { forceFormData: true as const };

        if (isEdit && producto) {
            form.post(
                route('admin.productos.update', producto.id_producto),
                opts,
            );
        } else {
            form.post(route('admin.productos.store'), opts);
        }
    }

    const cantidadErrores = Object.keys(errors).length;
    const generalError = (errors as Record<string, string>).general;

    return (
        <>
            <form
                onSubmit={submit}
                className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
            >
                <div className="space-y-5">
                    {generalError || cantidadErrores > 0 ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
                        >
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <span>
                                {generalError ??
                                    'Revisa los campos marcados en rojo y vuelve a guardar.'}
                            </span>
                        </div>
                    ) : null}

                    {/* IDENTIFICACIÓN */}
                    <Seccion
                        icon={Package}
                        titulo="Identificación"
                        descripcion="Nombre, marca y código de barras del producto."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nombre del producto"
                                htmlFor="nombre"
                                required
                                error={errors.nombre}
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="nombre"
                                    ref={nombreRef}
                                    value={data.nombre}
                                    onChange={(e) =>
                                        setData('nombre', e.target.value)
                                    }
                                    aria-invalid={!!errors.nombre}
                                    placeholder="Ej. Royal Canin Mini Adult 3 kg"
                                    autoComplete="off"
                                />
                            </Field>

                            <Field
                                label="Marca"
                                required
                                error={errors.fk_marca}
                            >
                                <SelectConAlta
                                    value={data.fk_marca}
                                    onChange={(v) => setData('fk_marca', v)}
                                    placeholder="Seleccionar marca"
                                    onAdd={() => abrirQuick('marca')}
                                    addLabel="Nueva marca"
                                >
                                    {marcas.map((m) => (
                                        <option
                                            key={m.id_marca}
                                            value={m.id_marca}
                                        >
                                            {m.nombre}
                                        </option>
                                    ))}
                                </SelectConAlta>
                            </Field>

                            <Field
                                label="Código de barras"
                                error={errors.codigo_barras}
                                hint="Opcional. Escanéalo con el lector, la cámara, o escríbelo."
                            >
                                <BarcodeField
                                    value={data.codigo_barras}
                                    onChange={(v) =>
                                        setData('codigo_barras', v)
                                    }
                                    error={undefined}
                                />
                            </Field>

                            <Field
                                label="SKU"
                                className="sm:col-span-2"
                                hint={
                                    isEdit
                                        ? 'El SKU no cambia al editar.'
                                        : 'Se genera en el servidor a partir de animal, marca y nombre.'
                                }
                            >
                                <Input
                                    value={
                                        isEdit ? producto.sku : skuPreview
                                    }
                                    readOnly
                                    className="bg-muted font-mono text-muted-foreground"
                                />
                            </Field>
                        </div>
                    </Seccion>

                    {/* CLASIFICACIÓN */}
                    <Seccion
                        icon={Layers}
                        titulo="Clasificación"
                        descripcion="Dónde aparece el producto dentro del catálogo."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Animal"
                                required
                                error={errors.fk_id_animal}
                            >
                                <SelectConAlta
                                    value={data.fk_id_animal}
                                    onChange={cambiarAnimal}
                                    placeholder="Seleccionar animal"
                                    onAdd={() => abrirQuick('animal')}
                                    addLabel="Nuevo animal"
                                >
                                    {animales.map((a) => (
                                        <option
                                            key={a.id_animal}
                                            value={a.id_animal}
                                        >
                                            {a.nombre}
                                        </option>
                                    ))}
                                </SelectConAlta>
                            </Field>

                            <Field
                                label="Etapa de vida"
                                error={errors.fk_etapa_vida}
                                hint="Opcional. Útil para alimentos por edad."
                            >
                                <select
                                    value={data.fk_etapa_vida}
                                    onChange={(e) =>
                                        setData(
                                            'fk_etapa_vida',
                                            e.target.value,
                                        )
                                    }
                                    disabled={!animalSel || etapas.length === 0}
                                    className={controlBase}
                                >
                                    <option value="">
                                        {!animalSel
                                            ? 'Elige un animal primero'
                                            : etapas.length === 0
                                              ? 'Sin etapas para este animal'
                                              : 'Sin etapa específica'}
                                    </option>
                                    {etapas.map((et) => (
                                        <option
                                            key={et.id_etapa_vida}
                                            value={et.id_etapa_vida}
                                        >
                                            {et.nombre}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {perroOGato ? (
                                <>
                                    <Field
                                        label="Categoría"
                                        required
                                        error={errors.fk_id_subcategorias}
                                    >
                                        <SelectConAlta
                                            value={categoriaId}
                                            onChange={cambiarCategoria}
                                            placeholder="Seleccionar categoría"
                                            onAdd={() =>
                                                abrirQuick('categoria')
                                            }
                                            addLabel="Nueva categoría"
                                        >
                                            {categorias.map((c) => (
                                                <option
                                                    key={c.id_categoria}
                                                    value={c.id_categoria}
                                                >
                                                    {c.nombre}
                                                </option>
                                            ))}
                                        </SelectConAlta>
                                    </Field>

                                    <Field
                                        label="Subcategoría"
                                        required
                                        error={errors.fk_id_subcategorias}
                                    >
                                        <SelectConAlta
                                            value={data.fk_id_subcategorias}
                                            onChange={(v) =>
                                                setData(
                                                    'fk_id_subcategorias',
                                                    v,
                                                )
                                            }
                                            disabled={!categoriaId}
                                            placeholder={
                                                !categoriaId
                                                    ? 'Elige una categoría primero'
                                                    : subcategorias.length ===
                                                        0
                                                      ? 'Sin subcategorías'
                                                      : 'Seleccionar subcategoría'
                                            }
                                            onAdd={
                                                categoriaId
                                                    ? () =>
                                                          abrirQuick(
                                                              'subcategoria',
                                                          )
                                                    : undefined
                                            }
                                            addLabel="Nueva subcategoría"
                                        >
                                            {subcategorias.map((s) => (
                                                <option
                                                    key={s.id_subcategorias}
                                                    value={s.id_subcategorias}
                                                >
                                                    {s.nom_sub_categoria}
                                                </option>
                                            ))}
                                        </SelectConAlta>
                                    </Field>
                                </>
                            ) : null}

                            {exotico ? (
                                <p className="rounded-lg border border-dashed bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground sm:col-span-2">
                                    <span className="font-medium text-foreground">
                                        {animalSel?.nombre}
                                    </span>{' '}
                                    va a la rama «General». No usa categoría ni
                                    subcategoría; el servidor la asigna sola.
                                </p>
                            ) : null}
                        </div>
                    </Seccion>

                    {/* PRECIO E INVENTARIO */}
                    <Seccion
                        icon={Boxes}
                        titulo="Precio e inventario"
                        descripcion="Cuánto cuesta, cuánto hay y cómo se mide."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Precio de lista (S/)"
                                htmlFor="precio"
                                required
                                error={errors.precio}
                            >
                                <Input
                                    id="precio"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={data.precio}
                                    onChange={(e) =>
                                        setData('precio', e.target.value)
                                    }
                                    aria-invalid={!!errors.precio}
                                    placeholder="0.00"
                                />
                            </Field>

                            <Field
                                label="Stock"
                                htmlFor="stock"
                                required
                                error={errors.stock}
                            >
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    value={data.stock}
                                    onChange={(e) =>
                                        setData('stock', e.target.value)
                                    }
                                    aria-invalid={!!errors.stock}
                                />
                            </Field>

                            <Field
                                label="Unidad de medida"
                                required
                                error={errors.fk_unidad_medida}
                            >
                                <select
                                    value={data.fk_unidad_medida}
                                    onChange={(e) =>
                                        setData(
                                            'fk_unidad_medida',
                                            e.target.value,
                                        )
                                    }
                                    className={controlBase}
                                >
                                    <option value="">Seleccionar unidad</option>
                                    {lookups.unidades.map((u: UnidadOption) => (
                                        <option
                                            key={u.id_unidad_medida}
                                            value={u.id_unidad_medida}
                                        >
                                            {u.nombre} ({u.abreviatura})
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Estado"
                                required
                                error={errors.fk_estado}
                            >
                                <select
                                    value={data.fk_estado}
                                    onChange={(e) =>
                                        setData('fk_estado', e.target.value)
                                    }
                                    className={controlBase}
                                >
                                    {lookups.estados.map((es: EstadoOption) => (
                                        <option
                                            key={es.id_estado_producto}
                                            value={es.id_estado_producto}
                                        >
                                            {es.nombre}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Descripción"
                                error={errors.descripcion}
                                className="sm:col-span-2"
                            >
                                <textarea
                                    value={data.descripcion}
                                    onChange={(e) =>
                                        setData('descripcion', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Detalles, presentación, indicaciones…"
                                    className={cn(
                                        controlBase,
                                        'h-auto resize-none py-2',
                                    )}
                                />
                            </Field>
                        </div>
                    </Seccion>

                    {/* IMAGEN */}
                    <Seccion
                        icon={ImagePlus}
                        titulo="Imagen principal"
                        descripcion="JPG, PNG o WebP. Máximo 5 MB. Se recorta a cuadrado."
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="relative aspect-square w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl border bg-muted">
                                {imagenPreview ? (
                                    <img
                                        src={imagenPreview}
                                        alt="Vista previa"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-muted-foreground/40">
                                        <Package className="size-8" />
                                    </div>
                                )}
                                {imagenPreview ? (
                                    <button
                                        type="button"
                                        onClick={quitarImagen}
                                        aria-label="Quitar imagen"
                                        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm backdrop-blur transition-colors hover:bg-background"
                                    >
                                        <X className="size-4" />
                                    </button>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) =>
                                        handleImagen(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                                />
                                {errors.imagen_principal ? (
                                    <p className="text-xs font-medium text-destructive">
                                        {errors.imagen_principal}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </Seccion>

                    <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-xl border bg-card/85 px-4 py-3.5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-5">
                        {cantidadErrores > 0 ? (
                            <p className="text-sm font-medium text-destructive sm:mr-auto">
                                {cantidadErrores}{' '}
                                {cantidadErrores === 1
                                    ? 'campo por corregir'
                                    : 'campos por corregir'}
                            </p>
                        ) : form.isDirty ? (
                            <p className="text-sm text-muted-foreground sm:mr-auto">
                                Cambios sin guardar.
                            </p>
                        ) : null}
                        <Button asChild variant="outline">
                            <Link href={route('admin.productos.index')}>
                                Cancelar
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="gap-2"
                        >
                            {form.processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {isEdit
                                ? 'Guardar cambios'
                                : 'Registrar producto'}
                        </Button>
                    </div>
                </div>

                {/* Vista previa */}
                <aside className="top-6 hidden lg:sticky lg:block">
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="aspect-square w-full bg-muted">
                            {imagenPreview ? (
                                <img
                                    src={imagenPreview}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-muted-foreground/30">
                                    <Package className="size-10" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 p-4">
                            <div>
                                <p className="line-clamp-2 font-semibold text-foreground">
                                    {data.nombre || 'Nombre del producto'}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Tag className="size-3" />
                                    {marcaSel?.nombre ?? 'Sin marca'}
                                    {animalSel ? ` · ${animalSel.nombre}` : ''}
                                </p>
                            </div>
                            <div className="flex items-end justify-between gap-2">
                                <span className="text-lg font-semibold text-foreground tabular-nums">
                                    S/{' '}
                                    {data.precio
                                        ? Number(data.precio).toFixed(2)
                                        : '0.00'}
                                </span>
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                                        Number(data.stock) > 0
                                            ? 'bg-secondary text-secondary-foreground'
                                            : 'bg-destructive/10 text-destructive',
                                    )}
                                >
                                    {Number(data.stock) || 0} en stock
                                </span>
                            </div>
                            {data.codigo_barras ? (
                                <p className="border-t pt-2 font-mono text-xs tracking-wide text-muted-foreground">
                                    {data.codigo_barras}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </aside>
            </form>

            {/* Alta rápida */}
            <Dialog
                open={quick !== null}
                onOpenChange={(o) => !o && setQuick(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {quick === 'animal'
                                ? 'Nuevo animal'
                                : quick === 'marca'
                                  ? 'Nueva marca'
                                  : quick === 'categoria'
                                    ? 'Nueva categoría'
                                    : 'Nueva subcategoría'}
                        </DialogTitle>
                        <DialogDescription>
                            Se agrega a la lista y queda seleccionado en este
                            producto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="quick-nombre">Nombre</Label>
                            <Input
                                id="quick-nombre"
                                autoFocus
                                value={quickNombre}
                                onChange={(e) =>
                                    setQuickNombre(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        guardarQuick();
                                    }
                                }}
                                placeholder={
                                    quick === 'animal'
                                        ? 'Ej. Hamster'
                                        : quick === 'marca'
                                          ? 'Ej. Royal Canin'
                                          : 'Ej. Alimento seco'
                                }
                            />
                        </div>

                        {quick === 'categoria' ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="quick-desc">
                                    Descripción (opcional)
                                </Label>
                                <Input
                                    id="quick-desc"
                                    value={quickDescripcion}
                                    onChange={(e) =>
                                        setQuickDescripcion(e.target.value)
                                    }
                                />
                            </div>
                        ) : null}

                        {quickError ? (
                            <p className="text-xs font-medium text-destructive">
                                {quickError}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setQuick(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={guardarQuick}
                            disabled={!quickNombre.trim() || quickLoading}
                            className="gap-2"
                        >
                            {quickLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
