import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowUpRight,
    Boxes,
    Check,
    CircleAlert,
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
import { evaluarCodigo } from '@/lib/barcode';
import { cn } from '@/lib/utils';
import type {
    AnimalOption,
    BuscarCodigoResponse,
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

type Seccion = 'identificacion' | 'clasificacion' | 'inventario' | 'imagen';

const SECCIONES: { id: Seccion; label: string; icon: typeof Package }[] = [
    { id: 'identificacion', label: 'Identificación', icon: Package },
    { id: 'clasificacion', label: 'Clasificación', icon: Layers },
    { id: 'inventario', label: 'Precio e inventario', icon: Boxes },
    { id: 'imagen', label: 'Imagen', icon: ImagePlus },
];

const CAMPO_SECCION: Record<string, Seccion> = {
    nombre: 'identificacion',
    fk_marca: 'identificacion',
    codigo_barras: 'identificacion',
    fk_id_animal: 'clasificacion',
    fk_etapa_vida: 'clasificacion',
    fk_id_subcategorias: 'clasificacion',
    precio: 'inventario',
    stock: 'inventario',
    fk_unidad_medida: 'inventario',
    fk_estado: 'inventario',
    descripcion: 'inventario',
    imagen_principal: 'imagen',
    general: 'identificacion',
};

const ETIQUETA_CAMPO: Record<string, string> = {
    nombre: 'Nombre del producto',
    fk_marca: 'Marca',
    codigo_barras: 'Código de barras',
    fk_id_animal: 'Animal',
    fk_id_subcategorias: 'Subcategoría',
    precio: 'Precio de lista',
    stock: 'Stock',
    fk_unidad_medida: 'Unidad de medida',
    fk_estado: 'Estado',
    descripcion: 'Descripción',
    imagen_principal: 'Imagen principal',
};

const IMAGEN_MAX_MB = 5;
const IMAGEN_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

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

function codigoDeLaUrl(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    return (
        new URLSearchParams(window.location.search)
            .get('codigo')
            ?.replace(/\D/g, '')
            .slice(0, 20) ?? ''
    );
}

function valoresIniciales(p: ProductoEditData | undefined): FormShape {
    return {
        fk_id_animal: p?.fk_id_animal ?? '',
        fk_id_subcategorias: p?.fk_id_subcategorias ?? '',
        fk_etapa_vida: p?.fk_etapa_vida ?? '',
        fk_marca: p?.fk_marca ?? '',
        fk_unidad_medida: p?.fk_unidad_medida ?? '',
        fk_estado: p?.fk_estado ?? '1',
        codigo_barras: p?.codigo_barras ?? codigoDeLaUrl(),
        nombre: p?.nombre ?? '',
        descripcion: p?.descripcion ?? '',
        precio: p?.precio ?? '',
        stock: p?.stock ?? '1',
        imagen_principal: null,
        eliminar_imagen: false,
    };
}

/* -------------------------------------------------------------------------- */
/*  Validación de cliente — espejo de ProductoController::validar()            */
/* -------------------------------------------------------------------------- */

function validarCliente(
    d: FormShape,
    perroOGato: boolean,
    categoriaId: string,
): Record<string, string> {
    const e: Record<string, string> = {};

    if (!d.nombre.trim()) {
        e.nombre = 'Escribe el nombre del producto.';
    } else if (d.nombre.trim().length > 150) {
        e.nombre = 'Máximo 150 caracteres.';
    }

    if (!d.fk_marca) {
        e.fk_marca = 'Selecciona la marca.';
    }

    if (d.codigo_barras) {
        if (!/^\d+$/.test(d.codigo_barras)) {
            e.codigo_barras = 'El código de barras solo puede tener dígitos.';
        } else if (d.codigo_barras.length < 6 || d.codigo_barras.length > 20) {
            e.codigo_barras =
                'El código de barras debe tener entre 6 y 20 dígitos.';
        }
    }

    if (!d.fk_id_animal) {
        e.fk_id_animal = 'Selecciona el animal.';
    }

    if (perroOGato) {
        if (!categoriaId) {
            e.fk_id_subcategorias = 'Elige categoría y subcategoría.';
        } else if (!d.fk_id_subcategorias) {
            e.fk_id_subcategorias = 'Selecciona la subcategoría.';
        }
    }

    const precio = Number(d.precio);

    if (d.precio === '' || Number.isNaN(precio)) {
        e.precio = 'Indica el precio de lista.';
    } else if (precio < 0) {
        e.precio = 'El precio no puede ser negativo.';
    } else if (precio > 999999.99) {
        e.precio = 'El precio es demasiado alto.';
    }

    const stock = Number(d.stock);

    if (d.stock === '' || Number.isNaN(stock)) {
        e.stock = 'Indica el stock inicial.';
    } else if (!Number.isInteger(stock) || stock < 0) {
        e.stock = 'El stock debe ser un entero mayor o igual a 0.';
    } else if (stock > 1000000) {
        e.stock = 'El stock es demasiado alto.';
    }

    if (!d.fk_unidad_medida) {
        e.fk_unidad_medida = 'Selecciona la unidad de medida.';
    }

    if (!d.fk_estado) {
        e.fk_estado = 'Selecciona el estado.';
    }

    if (d.descripcion.length > 2000) {
        e.descripcion = 'Máximo 2000 caracteres.';
    }

    if (d.imagen_principal instanceof File) {
        if (!IMAGEN_TIPOS.includes(d.imagen_principal.type)) {
            e.imagen_principal = 'La imagen debe ser JPG, PNG o WebP.';
        } else if (d.imagen_principal.size > IMAGEN_MAX_MB * 1024 * 1024) {
            e.imagen_principal = `La imagen no puede pesar más de ${IMAGEN_MAX_MB} MB.`;
        }
    }

    return e;
}

/* -------------------------------------------------------------------------- */

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
        <div
            className={cn('space-y-1.5', className)}
            id={htmlFor ? `campo-${htmlFor}` : undefined}
        >
            <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
                {label}
                {required ? <span className="text-destructive">*</span> : null}
            </Label>
            {children}
            {error ? (
                <p
                    className="flex items-center gap-1 text-xs font-medium text-destructive"
                    role="alert"
                >
                    <CircleAlert className="size-3.5 shrink-0" />
                    {error}
                </p>
            ) : hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

function Seccion({
    id,
    icon: Icon,
    titulo,
    descripcion,
    children,
}: {
    id: Seccion;
    icon: typeof Package;
    titulo: string;
    descripcion?: string;
    children: ReactNode;
}) {
    return (
        <section
            id={`seccion-${id}`}
            className="scroll-mt-24 rounded-xl border bg-card shadow-sm"
        >
            <div className="flex items-start gap-3.5 border-b p-4 sm:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark ring-1 ring-mosso-yellow/30 ring-inset dark:text-mosso-yellow">
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
    id,
    value,
    onChange,
    onBlur,
    disabled,
    placeholder,
    invalid,
    onAdd,
    addLabel,
    children,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    onBlur?: () => void;
    disabled?: boolean;
    placeholder: string;
    invalid?: boolean;
    onAdd?: () => void;
    addLabel: string;
    children: ReactNode;
}) {
    return (
        <div className="flex gap-2">
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={invalid || undefined}
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

    const [seccionActiva, setSeccionActiva] =
        useState<Seccion>('identificacion');
    const [dupProducto, setDupProducto] = useState<BuscarCodigoResponse | null>(
        null,
    );
    const resumenRef = useRef<HTMLDivElement>(null);

    const form = useForm<FormShape>(valoresIniciales(producto));
    const { data, errors, setData, setError, clearErrors } = form;

    const animalSel = useMemo(
        () => animales.find((a) => String(a.id_animal) === data.fk_id_animal),
        [animales, data.fk_id_animal],
    );
    const perroOGato = esPerroOGato(animalSel?.nombre);
    const exotico = animalSel !== undefined && !perroOGato;

    const marcaSel = marcas.find((m) => String(m.id_marca) === data.fk_marca);
    const unidadSel = lookups.unidades.find(
        (u) => String(u.id_unidad_medida) === data.fk_unidad_medida,
    );

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
        clearErrors('fk_id_animal', 'fk_id_subcategorias');
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

    /* Aviso de código de barras ya usado por otro producto. */
    useEffect(() => {
        const codigo = data.codigo_barras;

        if (codigo.length < 6 || codigo.length > 20) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el aviso cuando el código deja de ser válido
            setDupProducto(null);

            return;
        }

        const t = window.setTimeout(async () => {
            try {
                const { data: res } = await axios.post<BuscarCodigoResponse>(
                    route('admin.productos.buscar-codigo'),
                    { codigo },
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrf(),
                        },
                    },
                );

                if (
                    res.id_producto &&
                    res.id_producto !== producto?.id_producto
                ) {
                    setDupProducto(res);
                } else {
                    setDupProducto(null);
                }
            } catch {
                setDupProducto(null);
            }
        }, 400);

        return () => window.clearTimeout(t);
    }, [data.codigo_barras, producto?.id_producto]);

    function handleImagen(file: File | null) {
        setData((prev) => ({
            ...prev,
            imagen_principal: file,
            eliminar_imagen: false,
        }));
        clearErrors('imagen_principal');

        if (file && !IMAGEN_TIPOS.includes(file.type)) {
            setError('imagen_principal', 'La imagen debe ser JPG, PNG o WebP.');
        } else if (file && file.size > IMAGEN_MAX_MB * 1024 * 1024) {
            setError(
                'imagen_principal',
                `La imagen no puede pesar más de ${IMAGEN_MAX_MB} MB.`,
            );
        }

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
        clearErrors('imagen_principal');
        setImagenPreview(null);
    }

    function validarCampo(campo: keyof FormShape) {
        const e = validarCliente(data, perroOGato, categoriaId);

        if (e[campo]) {
            setError(campo, e[campo]);
        } else {
            clearErrors(campo);
        }
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
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
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
                setData('fk_id_subcategorias', String(creado.id_subcategorias));
            }

            setQuick(null);
        } catch (err) {
            const e = err as {
                response?: { data?: { errors?: Record<string, string[]> } };
            };
            const primero = e.response?.data?.errors
                ? Object.values(e.response.data.errors)[0]?.[0]
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

    function irASeccion(id: Seccion) {
        setSeccionActiva(id);
        document
            .getElementById(`seccion-${id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function submit(e: FormEvent) {
        e.preventDefault();

        const clientErrors = validarCliente(data, perroOGato, categoriaId);

        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([k, v]) =>
                setError(k as keyof FormShape, v),
            );
            const primer = Object.keys(clientErrors)[0];
            irASeccion(CAMPO_SECCION[primer] ?? 'identificacion');
            requestAnimationFrame(() => resumenRef.current?.focus());

            return;
        }

        clearErrors();

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

    /* Checklist de avance por sección. */
    const estadoCodigo = evaluarCodigo(data.codigo_barras);
    const progreso: { seccion: Seccion; label: string; completo: boolean }[] = [
        {
            seccion: 'identificacion',
            label: 'Identificación',
            completo:
                !!data.nombre.trim() &&
                !!data.fk_marca &&
                (estadoCodigo.vacio || estadoCodigo.aceptable),
        },
        {
            seccion: 'clasificacion',
            label: 'Clasificación',
            completo:
                !!data.fk_id_animal &&
                (!perroOGato || (!!categoriaId && !!data.fk_id_subcategorias)),
        },
        {
            seccion: 'inventario',
            label: 'Precio e inventario',
            completo:
                data.precio !== '' &&
                Number(data.precio) >= 0 &&
                data.stock !== '' &&
                Number(data.stock) >= 0 &&
                !!data.fk_unidad_medida &&
                !!data.fk_estado,
        },
        {
            seccion: 'imagen',
            label: 'Imagen',
            completo: Boolean(imagenPreview),
        },
    ];

    const erroresVisibles = Object.entries(errors).filter(([, v]) => v) as [
        string,
        string,
    ][];
    const generalError = (errors as Record<string, string>).general;

    return (
        <>
            <form
                onSubmit={submit}
                className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
            >
                <div className="space-y-5">
                    {/* Navegación por secciones */}
                    <nav className="sticky top-2 z-20 flex gap-1 overflow-x-auto rounded-xl border bg-card/90 p-1 shadow-sm backdrop-blur">
                        {SECCIONES.map((s) => {
                            const activa = seccionActiva === s.id;
                            const completa = progreso.find(
                                (p) => p.seccion === s.id,
                            )?.completo;

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => irASeccion(s.id)}
                                    aria-current={activa ? 'true' : undefined}
                                    className={cn(
                                        'flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                        activa
                                            ? 'bg-mosso-yellow text-mosso-dark'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                    )}
                                >
                                    {completa ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        <s.icon className="size-3.5" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {s.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Resumen de errores */}
                    {erroresVisibles.length > 0 ? (
                        <div
                            ref={resumenRef}
                            tabIndex={-1}
                            role="alert"
                            aria-labelledby="resumen-errores-titulo"
                            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm outline-none"
                        >
                            <p
                                id="resumen-errores-titulo"
                                className="flex items-center gap-2 font-semibold text-destructive"
                            >
                                <CircleAlert className="size-4" />
                                {generalError
                                    ? generalError
                                    : `Revisa ${erroresVisibles.length === 1 ? 'este dato' : `estos ${erroresVisibles.length} datos`} antes de guardar`}
                            </p>
                            {!generalError ? (
                                <ul className="mt-2 space-y-1">
                                    {erroresVisibles
                                        .filter(([k]) => k !== 'general')
                                        .map(([campo, mensaje]) => (
                                            <li key={campo}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        irASeccion(
                                                            CAMPO_SECCION[
                                                                campo
                                                            ] ??
                                                                'identificacion',
                                                        );
                                                        requestAnimationFrame(
                                                            () =>
                                                                document
                                                                    .getElementById(
                                                                        `campo-${campo}`,
                                                                    )
                                                                    ?.querySelector<HTMLElement>(
                                                                        'input,select,textarea',
                                                                    )
                                                                    ?.focus(),
                                                        );
                                                    }}
                                                    className="text-left text-destructive underline-offset-2 hover:underline"
                                                >
                                                    {ETIQUETA_CAMPO[campo] ??
                                                        campo}
                                                    : {mensaje}
                                                </button>
                                            </li>
                                        ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}

                    {/* IDENTIFICACIÓN */}
                    <Seccion
                        id="identificacion"
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
                                    onChange={(e) => {
                                        setData('nombre', e.target.value);
                                        clearErrors('nombre');
                                    }}
                                    onBlur={() => validarCampo('nombre')}
                                    aria-invalid={!!errors.nombre}
                                    placeholder="Ej. Royal Canin Mini Adult 3 kg"
                                    autoComplete="off"
                                    maxLength={150}
                                />
                            </Field>

                            <Field
                                label="Marca"
                                htmlFor="fk_marca"
                                required
                                error={errors.fk_marca}
                            >
                                <SelectConAlta
                                    id="fk_marca"
                                    value={data.fk_marca}
                                    onChange={(v) => {
                                        setData('fk_marca', v);
                                        clearErrors('fk_marca');
                                    }}
                                    onBlur={() => validarCampo('fk_marca')}
                                    invalid={!!errors.fk_marca}
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
                                htmlFor="codigo_barras"
                                error={errors.codigo_barras}
                                hint="Opcional. Lector USB, cámara o a mano."
                            >
                                <BarcodeField
                                    id="codigo_barras"
                                    value={data.codigo_barras}
                                    onChange={(v) => {
                                        setData('codigo_barras', v);
                                        clearErrors('codigo_barras');
                                    }}
                                    showValidation
                                    statusSlot={
                                        dupProducto ? (
                                            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
                                                <CircleAlert className="size-3.5 shrink-0" />
                                                Ya lo usa «{dupProducto.nombre}
                                                ».
                                                {dupProducto.id_producto ? (
                                                    <Link
                                                        href={route(
                                                            'admin.productos.edit',
                                                            dupProducto.id_producto,
                                                        )}
                                                        className="inline-flex items-center gap-0.5 underline underline-offset-2"
                                                    >
                                                        Abrir ese producto{' '}
                                                        <ArrowUpRight className="size-3" />
                                                    </Link>
                                                ) : null}
                                            </p>
                                        ) : null
                                    }
                                />
                            </Field>

                            <Field
                                label="SKU"
                                className="sm:col-span-2"
                                hint={
                                    isEdit
                                        ? 'El SKU no cambia al editar.'
                                        : 'Se genera en el servidor con animal, marca y nombre.'
                                }
                            >
                                <Input
                                    value={isEdit ? producto.sku : skuPreview}
                                    readOnly
                                    className="bg-muted font-mono text-muted-foreground"
                                />
                            </Field>
                        </div>
                    </Seccion>

                    {/* CLASIFICACIÓN */}
                    <Seccion
                        id="clasificacion"
                        icon={Layers}
                        titulo="Clasificación"
                        descripcion="Dónde aparece el producto dentro del catálogo."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Animal"
                                htmlFor="fk_id_animal"
                                required
                                error={errors.fk_id_animal}
                            >
                                <SelectConAlta
                                    id="fk_id_animal"
                                    value={data.fk_id_animal}
                                    onChange={cambiarAnimal}
                                    onBlur={() => validarCampo('fk_id_animal')}
                                    invalid={!!errors.fk_id_animal}
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
                                htmlFor="fk_etapa_vida"
                                error={errors.fk_etapa_vida}
                                hint="Opcional. Útil para alimentos por edad."
                            >
                                <select
                                    id="fk_etapa_vida"
                                    value={data.fk_etapa_vida}
                                    onChange={(e) =>
                                        setData('fk_etapa_vida', e.target.value)
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
                                        error={undefined}
                                    >
                                        <SelectConAlta
                                            value={categoriaId}
                                            onChange={cambiarCategoria}
                                            invalid={
                                                !!errors.fk_id_subcategorias &&
                                                !categoriaId
                                            }
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
                                        htmlFor="fk_id_subcategorias"
                                        required
                                        error={errors.fk_id_subcategorias}
                                    >
                                        <SelectConAlta
                                            id="fk_id_subcategorias"
                                            value={data.fk_id_subcategorias}
                                            onChange={(v) => {
                                                setData(
                                                    'fk_id_subcategorias',
                                                    v,
                                                );
                                                clearErrors(
                                                    'fk_id_subcategorias',
                                                );
                                            }}
                                            onBlur={() =>
                                                validarCampo(
                                                    'fk_id_subcategorias',
                                                )
                                            }
                                            invalid={
                                                !!errors.fk_id_subcategorias &&
                                                !!categoriaId
                                            }
                                            disabled={!categoriaId}
                                            placeholder={
                                                !categoriaId
                                                    ? 'Elige una categoría primero'
                                                    : subcategorias.length === 0
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
                        id="inventario"
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
                                <div className="relative">
                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                        S/
                                    </span>
                                    <Input
                                        id="precio"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={data.precio}
                                        onChange={(e) => {
                                            setData('precio', e.target.value);
                                            clearErrors('precio');
                                        }}
                                        onBlur={() => validarCampo('precio')}
                                        aria-invalid={!!errors.precio}
                                        placeholder="0.00"
                                        className="pl-8"
                                    />
                                </div>
                            </Field>

                            <Field
                                label="Stock inicial"
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
                                    onChange={(e) => {
                                        setData('stock', e.target.value);
                                        clearErrors('stock');
                                    }}
                                    onBlur={() => validarCampo('stock')}
                                    aria-invalid={!!errors.stock}
                                />
                            </Field>

                            <Field
                                label="Unidad de medida"
                                htmlFor="fk_unidad_medida"
                                required
                                error={errors.fk_unidad_medida}
                            >
                                <select
                                    id="fk_unidad_medida"
                                    value={data.fk_unidad_medida}
                                    onChange={(e) => {
                                        setData(
                                            'fk_unidad_medida',
                                            e.target.value,
                                        );
                                        clearErrors('fk_unidad_medida');
                                    }}
                                    onBlur={() =>
                                        validarCampo('fk_unidad_medida')
                                    }
                                    aria-invalid={!!errors.fk_unidad_medida}
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
                                htmlFor="fk_estado"
                                required
                                error={errors.fk_estado}
                            >
                                <select
                                    id="fk_estado"
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
                                htmlFor="descripcion"
                                error={errors.descripcion}
                                className="sm:col-span-2"
                                hint={`${data.descripcion.length}/2000`}
                            >
                                <textarea
                                    id="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) =>
                                        setData('descripcion', e.target.value)
                                    }
                                    rows={3}
                                    maxLength={2000}
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
                        id="imagen"
                        icon={ImagePlus}
                        titulo="Imagen principal"
                        descripcion={`JPG, PNG o WebP. Máximo ${IMAGEN_MAX_MB} MB. Se recorta a cuadrado.`}
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div
                                className="relative aspect-square w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl border bg-muted"
                                id="campo-imagen_principal"
                            >
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
                                    <p
                                        className="flex items-center gap-1 text-xs font-medium text-destructive"
                                        role="alert"
                                    >
                                        <CircleAlert className="size-3.5 shrink-0" />
                                        {errors.imagen_principal}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Una foto clara sobre fondo neutro se ve
                                        mejor en la tienda.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Seccion>

                    {/* Barra de acción fija */}
                    <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-xl border bg-card/90 px-4 py-3.5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-5">
                        {erroresVisibles.length > 0 ? (
                            <p className="text-sm font-medium text-destructive sm:mr-auto">
                                {erroresVisibles.length}{' '}
                                {erroresVisibles.length === 1
                                    ? 'dato por corregir'
                                    : 'datos por corregir'}
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
                            {isEdit ? 'Guardar cambios' : 'Registrar producto'}
                        </Button>
                    </div>
                </div>

                {/* Vista previa + checklist */}
                <aside className="top-6 hidden space-y-4 lg:sticky lg:block">
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
                                    {Number(data.stock) || 0}{' '}
                                    {unidadSel?.abreviatura ?? 'u'}
                                </span>
                            </div>
                            {data.codigo_barras ? (
                                <p className="border-t pt-2 font-mono text-xs tracking-wide text-muted-foreground">
                                    {data.codigo_barras}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Avance
                        </p>
                        <ul className="mt-2.5 space-y-2">
                            {progreso.map((p) => (
                                <li key={p.seccion}>
                                    <button
                                        type="button"
                                        onClick={() => irASeccion(p.seccion)}
                                        className="flex w-full items-center gap-2 text-left text-sm"
                                    >
                                        <span
                                            className={cn(
                                                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                                                p.completo
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-muted-foreground/40 text-transparent',
                                            )}
                                        >
                                            <Check
                                                className="size-2.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <span
                                            className={
                                                p.completo
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {p.label}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
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
                                onChange={(e) => setQuickNombre(e.target.value)}
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
