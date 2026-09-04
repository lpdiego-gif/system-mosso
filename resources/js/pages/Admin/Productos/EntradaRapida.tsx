import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Check,
    CircleAlert,
    Loader2,
    Package,
    PackageCheck,
    PackagePlus,
    ScanBarcode,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BarcodeField } from '@/components/productos/barcode-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBarcodeWedge } from '@/hooks/use-barcode-wedge';
import { cn } from '@/lib/utils';
import type {
    AnimalOption,
    BuscarCodigoResponse,
    CategoriaOption,
    EstadoOption,
    MarcaOption,
    ProductoFormLookups,
    ProductoRow,
    SubCategoriaOption,
    UnidadOption,
} from '@/types/producto';

const controlBase =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30';

const soles = (n: number) => `S/ ${Number(n || 0).toFixed(2)}`;
const esPerroOGato = (n?: string) =>
    !!n && ['perro', 'gato'].includes(n.toLowerCase());

function csrf(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

interface MiniForm {
    codigo_barras: string;
    nombre: string;
    fk_marca: string;
    fk_id_animal: string;
    categoriaId: string;
    fk_id_subcategorias: string;
    precio: string;
    stock: string;
    fk_unidad_medida: string;
    fk_estado: string;
}

function limpio(sticky: Partial<MiniForm> = {}): MiniForm {
    return {
        codigo_barras: '',
        nombre: '',
        fk_marca: '',
        fk_id_animal: '',
        categoriaId: '',
        fk_id_subcategorias: '',
        precio: '',
        stock: '1',
        fk_unidad_medida: '',
        fk_estado: '1',
        ...sticky,
    };
}

export default function EntradaRapida({
    animales,
    marcas,
    unidades,
    estados,
}: ProductoFormLookups) {
    const [form, setForm] = useState<MiniForm>(limpio());
    const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
    const [subcategorias, setSubcategorias] = useState<SubCategoriaOption[]>(
        [],
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [guardando, setGuardando] = useState(false);
    const [dup, setDup] = useState<BuscarCodigoResponse | null>(null);
    const [registrados, setRegistrados] = useState<
        { fila: ProductoRow; sumado: boolean; delta: number }[]
    >([]);

    const codigoRef = useRef<HTMLDivElement>(null);
    const nombreRef = useRef<HTMLInputElement>(null);

    const animalSel = animales.find(
        (a) => String(a.id_animal) === form.fk_id_animal,
    );
    const perroOGato = esPerroOGato(animalSel?.nombre);

    function set<K extends keyof MiniForm>(key: K, value: MiniForm[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
    }

    async function cambiarAnimal(value: string) {
        setForm((f) => ({
            ...f,
            fk_id_animal: value,
            categoriaId: '',
            fk_id_subcategorias: '',
        }));
        setCategorias([]);
        setSubcategorias([]);

        if (!value) {
            return;
        }

        const animal = animales.find((a) => String(a.id_animal) === value);

        if (animal && esPerroOGato(animal.nombre)) {
            try {
                const { data } = await axios.get<CategoriaOption[]>(
                    route('admin.productos.categorias', Number(value)),
                    {
                        headers: { Accept: 'application/json' },
                    },
                );
                setCategorias(data);
            } catch {
                setCategorias([]);
            }
        }
    }

    async function cambiarCategoria(value: string) {
        setForm((f) => ({ ...f, categoriaId: value, fk_id_subcategorias: '' }));
        setSubcategorias([]);

        if (!value) {
            return;
        }

        try {
            const { data } = await axios.get<SubCategoriaOption[]>(
                route('admin.productos.subcategorias', Number(value)),
                { headers: { Accept: 'application/json' } },
            );
            setSubcategorias(data);
        } catch {
            setSubcategorias([]);
        }
    }

    function onScan(codigo: string) {
        set('codigo_barras', codigo);
        nombreRef.current?.focus();
    }

    useBarcodeWedge({ onScan, enabled: !guardando });

    // Autofoco inicial en el campo de escaneo.
    useEffect(() => {
        codigoRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, []);

    // Detecta si el código escaneado ya pertenece a un producto: en ese caso el
    // guardado solo suma stock y no hace falta clasificar nada.
    useEffect(() => {
        const codigo = form.codigo_barras;

        if (codigo.length < 6 || codigo.length > 20 || !/^\d+$/.test(codigo)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el aviso cuando el código deja de ser válido
            setDup(null);

            return;
        }

        const t = window.setTimeout(async () => {
            try {
                const { data } = await axios.post<BuscarCodigoResponse>(
                    route('admin.productos.buscar-codigo'),
                    { codigo },
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrf(),
                        },
                    },
                );

                setDup(data.id_producto ? data : null);
            } catch {
                setDup(null);
            }
        }, 350);

        return () => window.clearTimeout(t);
    }, [form.codigo_barras]);

    function validar(): Record<string, string> {
        const e: Record<string, string> = {};

        const stock = Number(form.stock);

        // Código ya registrado: el guardado solo suma stock, nada más importa.
        if (dup) {
            if (form.stock === '' || !Number.isInteger(stock) || stock < 1) {
                e.stock = 'Indica cuántas unidades sumar (mínimo 1).';
            }

            return e;
        }

        if (!form.nombre.trim()) {
            e.nombre = 'Escribe el nombre.';
        }

        if (!form.fk_marca) {
            e.fk_marca = 'Elige la marca.';
        }

        if (!form.fk_id_animal) {
            e.fk_id_animal = 'Elige el animal.';
        }

        if (perroOGato && !form.fk_id_subcategorias) {
            e.fk_id_subcategorias = 'Elige la subcategoría.';
        }

        if (form.precio === '' || Number(form.precio) < 0) {
            e.precio = 'Precio inválido.';
        }

        if (
            form.stock === '' ||
            !Number.isInteger(Number(form.stock)) ||
            Number(form.stock) < 0
        ) {
            e.stock = 'Stock inválido.';
        }

        if (!form.fk_unidad_medida) {
            e.fk_unidad_medida = 'Elige la unidad.';
        }

        if (
            form.codigo_barras &&
            (form.codigo_barras.length < 6 || !/^\d+$/.test(form.codigo_barras))
        ) {
            e.codigo_barras = 'Código de barras inválido.';
        }

        return e;
    }

    async function guardar(e: FormEvent) {
        e.preventDefault();

        const v = validar();

        if (Object.keys(v).length > 0) {
            setErrors(v);

            return;
        }

        setGuardando(true);
        setErrors({});

        const cantidad = Number(form.stock) || 0;

        try {
            const payload = dup
                ? { codigo_barras: form.codigo_barras, stock: form.stock }
                : {
                      nombre: form.nombre.trim(),
                      fk_marca: form.fk_marca,
                      fk_id_animal: form.fk_id_animal,
                      fk_id_subcategorias: form.fk_id_subcategorias || null,
                      precio: form.precio,
                      stock: form.stock,
                      fk_unidad_medida: form.fk_unidad_medida,
                      fk_estado: form.fk_estado,
                      codigo_barras: form.codigo_barras || null,
                  };

            const { data } = await axios.post<{
                sumado: boolean;
                producto: ProductoRow | null;
            }>(route('admin.productos.entrada-rapida.store'), payload, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
            });

            if (data.producto) {
                setRegistrados((r) => [
                    {
                        fila: data.producto as ProductoRow,
                        sumado: data.sumado,
                        delta: cantidad,
                    },
                    ...r,
                ]);
                toast.success(
                    data.sumado
                        ? `+${cantidad} al stock de «${data.producto.nombre}»`
                        : `«${data.producto.nombre}» registrado`,
                );
            }

            navigator.vibrate?.(40);

            // Conserva marca / animal / clasificación / unidad / estado para el siguiente.
            setForm(
                limpio({
                    fk_marca: form.fk_marca,
                    fk_id_animal: form.fk_id_animal,
                    categoriaId: form.categoriaId,
                    fk_id_subcategorias: form.fk_id_subcategorias,
                    fk_unidad_medida: form.fk_unidad_medida,
                    fk_estado: form.fk_estado,
                }),
            );
            requestAnimationFrame(() =>
                codigoRef.current
                    ?.querySelector<HTMLInputElement>('input')
                    ?.focus(),
            );
        } catch (err) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<
                    string,
                    string[]
                >;
                setErrors(
                    Object.fromEntries(
                        Object.entries(backend).map(([k, v]) => [k, v[0]]),
                    ),
                );
            } else {
                toast.error('No se pudo registrar. Intenta de nuevo.');
            }
        } finally {
            setGuardando(false);
        }
    }

    const totales = useMemo(() => {
        const unidades = registrados.reduce((s, r) => s + r.delta, 0);
        const valor = registrados.reduce(
            (s, r) => s + r.fila.precio * r.delta,
            0,
        );

        return { items: registrados.length, unidades, valor };
    }, [registrados]);

    return (
        <>
            <Head title="Entrada rápida de productos" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-mosso-yellow/30 ring-inset dark:text-mosso-yellow">
                            <ScanBarcode className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Entrada rápida
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Escanea → completa lo mínimo →{' '}
                                <kbd className="rounded border bg-muted px-1 text-xs">
                                    Enter
                                </kbd>{' '}
                                → siguiente. La marca y la clasificación se
                                conservan entre productos.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('admin.productos.index')}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent sm:self-auto"
                    >
                        <ArrowLeft className="size-4" /> Volver al listado
                    </Link>
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <form
                        onSubmit={guardar}
                        className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5"
                    >
                        <div ref={codigoRef} className="space-y-1.5">
                            <Label htmlFor="er-codigo">Código de barras</Label>
                            <BarcodeField
                                id="er-codigo"
                                value={form.codigo_barras}
                                onChange={(v) => set('codigo_barras', v)}
                                onScan={onScan}
                                showValidation
                                error={errors.codigo_barras}
                                placeholder="Escanea con el lector o la cámara…"
                            />
                        </div>

                        {dup ? (
                            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
                                        {dup.imagen_url ? (
                                            <img
                                                src={dup.imagen_url}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <PackageCheck className="size-4 text-emerald-600 dark:text-emerald-500" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {dup.nombre}
                                        </p>
                                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                                            {dup.sku}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                        Ya registrado
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Este código ya tiene producto. Solo indica
                                    cuántas unidades entran y se suman a su
                                    stock.
                                </p>
                                <Campo
                                    label="Unidades a sumar"
                                    htmlFor="er-sumar"
                                    error={errors.stock}
                                >
                                    <Input
                                        id="er-sumar"
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        autoFocus
                                        value={form.stock}
                                        onChange={(e) =>
                                            set('stock', e.target.value)
                                        }
                                        aria-invalid={!!errors.stock}
                                    />
                                </Campo>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo
                                    label="Nombre"
                                    htmlFor="er-nombre"
                                    error={errors.nombre}
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        id="er-nombre"
                                        ref={nombreRef}
                                        value={form.nombre}
                                        onChange={(e) =>
                                            set('nombre', e.target.value)
                                        }
                                        placeholder="Ej. Royal Canin Mini Adult 3 kg"
                                        autoComplete="off"
                                        maxLength={150}
                                        aria-invalid={!!errors.nombre}
                                    />
                                </Campo>

                                <Campo
                                    label="Marca"
                                    htmlFor="er-marca"
                                    error={errors.fk_marca}
                                >
                                    <select
                                        id="er-marca"
                                        value={form.fk_marca}
                                        onChange={(e) =>
                                            set('fk_marca', e.target.value)
                                        }
                                        aria-invalid={!!errors.fk_marca}
                                        className={controlBase}
                                    >
                                        <option value="">Seleccionar</option>
                                        {marcas.map((m: MarcaOption) => (
                                            <option
                                                key={m.id_marca}
                                                value={m.id_marca}
                                            >
                                                {m.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </Campo>

                                <Campo
                                    label="Animal"
                                    htmlFor="er-animal"
                                    error={errors.fk_id_animal}
                                >
                                    <select
                                        id="er-animal"
                                        value={form.fk_id_animal}
                                        onChange={(e) =>
                                            cambiarAnimal(e.target.value)
                                        }
                                        aria-invalid={!!errors.fk_id_animal}
                                        className={controlBase}
                                    >
                                        <option value="">Seleccionar</option>
                                        {animales.map((a: AnimalOption) => (
                                            <option
                                                key={a.id_animal}
                                                value={a.id_animal}
                                            >
                                                {a.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </Campo>

                                {perroOGato ? (
                                    <>
                                        <Campo
                                            label="Categoría"
                                            htmlFor="er-cat"
                                        >
                                            <select
                                                id="er-cat"
                                                value={form.categoriaId}
                                                onChange={(e) =>
                                                    cambiarCategoria(
                                                        e.target.value,
                                                    )
                                                }
                                                className={controlBase}
                                            >
                                                <option value="">
                                                    Seleccionar
                                                </option>
                                                {categorias.map((c) => (
                                                    <option
                                                        key={c.id_categoria}
                                                        value={c.id_categoria}
                                                    >
                                                        {c.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </Campo>

                                        <Campo
                                            label="Subcategoría"
                                            htmlFor="er-sub"
                                            error={errors.fk_id_subcategorias}
                                        >
                                            <select
                                                id="er-sub"
                                                value={form.fk_id_subcategorias}
                                                onChange={(e) =>
                                                    set(
                                                        'fk_id_subcategorias',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!form.categoriaId}
                                                aria-invalid={
                                                    !!errors.fk_id_subcategorias
                                                }
                                                className={controlBase}
                                            >
                                                <option value="">
                                                    {form.categoriaId
                                                        ? 'Seleccionar'
                                                        : 'Elige categoría primero'}
                                                </option>
                                                {subcategorias.map((s) => (
                                                    <option
                                                        key={s.id_subcategorias}
                                                        value={
                                                            s.id_subcategorias
                                                        }
                                                    >
                                                        {s.nom_sub_categoria}
                                                    </option>
                                                ))}
                                            </select>
                                        </Campo>
                                    </>
                                ) : null}

                                <Campo
                                    label="Precio (S/)"
                                    htmlFor="er-precio"
                                    error={errors.precio}
                                >
                                    <Input
                                        id="er-precio"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={form.precio}
                                        onChange={(e) =>
                                            set('precio', e.target.value)
                                        }
                                        placeholder="0.00"
                                        aria-invalid={!!errors.precio}
                                    />
                                </Campo>

                                <Campo
                                    label="Stock"
                                    htmlFor="er-stock"
                                    error={errors.stock}
                                >
                                    <Input
                                        id="er-stock"
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputMode="numeric"
                                        value={form.stock}
                                        onChange={(e) =>
                                            set('stock', e.target.value)
                                        }
                                        aria-invalid={!!errors.stock}
                                    />
                                </Campo>

                                <Campo
                                    label="Unidad"
                                    htmlFor="er-unidad"
                                    error={errors.fk_unidad_medida}
                                >
                                    <select
                                        id="er-unidad"
                                        value={form.fk_unidad_medida}
                                        onChange={(e) =>
                                            set(
                                                'fk_unidad_medida',
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={!!errors.fk_unidad_medida}
                                        className={controlBase}
                                    >
                                        <option value="">Seleccionar</option>
                                        {unidades.map((u: UnidadOption) => (
                                            <option
                                                key={u.id_unidad_medida}
                                                value={u.id_unidad_medida}
                                            >
                                                {u.nombre} ({u.abreviatura})
                                            </option>
                                        ))}
                                    </select>
                                </Campo>

                                <Campo label="Estado" htmlFor="er-estado">
                                    <select
                                        id="er-estado"
                                        value={form.fk_estado}
                                        onChange={(e) =>
                                            set('fk_estado', e.target.value)
                                        }
                                        className={controlBase}
                                    >
                                        {estados.map((es: EstadoOption) => (
                                            <option
                                                key={es.id_estado_producto}
                                                value={es.id_estado_producto}
                                            >
                                                {es.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </Campo>
                            </div>
                        )}

                        {errors.general ? (
                            <p className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                <CircleAlert className="size-4 shrink-0" />
                                {errors.general}
                            </p>
                        ) : null}

                        <div className="flex items-center justify-end gap-2 border-t pt-3">
                            <span className="mr-auto text-xs text-muted-foreground">
                                Pulsa{' '}
                                <kbd className="rounded border bg-muted px-1">
                                    Enter
                                </kbd>{' '}
                                para guardar y seguir
                            </span>
                            <Button
                                type="submit"
                                disabled={guardando}
                                className="gap-2"
                            >
                                {guardando ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : dup ? (
                                    <PackageCheck className="size-4" />
                                ) : (
                                    <PackagePlus className="size-4" />
                                )}
                                {dup
                                    ? `Sumar ${Number(form.stock) || 0} al stock`
                                    : 'Guardar y siguiente'}
                            </Button>
                        </div>
                    </form>

                    {/* Sesión */}
                    <aside className="space-y-4">
                        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border bg-border shadow-sm">
                            <ResumenCelda
                                label="Ítems"
                                valor={String(totales.items)}
                            />
                            <ResumenCelda
                                label="Unidades"
                                valor={String(totales.unidades)}
                            />
                            <ResumenCelda
                                label="Valor"
                                valor={soles(totales.valor)}
                            />
                        </div>

                        <div className="rounded-xl border bg-card shadow-sm">
                            <div className="border-b px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                Registrados en esta sesión
                            </div>
                            {registrados.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    Todavía no has registrado nada.
                                </p>
                            ) : (
                                <ul className="max-h-[28rem] divide-y overflow-y-auto">
                                    {registrados.map((r, i) => (
                                        <li
                                            key={`${r.fila.id_producto}-${i}`}
                                            className="flex items-center gap-3 px-4 py-2.5"
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                {r.fila.imagen_url ? (
                                                    <img
                                                        src={r.fila.imagen_url}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="size-4 text-muted-foreground/40" />
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {r.fila.nombre}
                                                </p>
                                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                    {r.fila.sku}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-medium tabular-nums">
                                                    {soles(r.fila.precio)}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'text-[11px] tabular-nums',
                                                        r.sumado
                                                            ? 'text-amber-600 dark:text-amber-500'
                                                            : 'text-emerald-600 dark:text-emerald-500',
                                                    )}
                                                >
                                                    {r.sumado
                                                        ? `+${r.delta} · quedan ${r.fila.stock}`
                                                        : `${r.delta} en stock`}
                                                </p>
                                            </div>
                                            <Check className="size-4 shrink-0 text-emerald-500" />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

EntradaRapida.layout = {
    breadcrumbs: [
        { title: 'Productos', href: '/admin/productos' },
        { title: 'Entrada rápida', href: '/admin/productos/entrada-rapida' },
    ],
};

function Campo({
    label,
    htmlFor,
    error,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error ? (
                <p
                    className="flex items-center gap-1 text-xs font-medium text-destructive"
                    role="alert"
                >
                    <CircleAlert className="size-3.5 shrink-0" />
                    {error}
                </p>
            ) : null}
        </div>
    );
}

function ResumenCelda({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="bg-card p-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{valor}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}
