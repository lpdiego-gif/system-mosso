import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowDown,
    ArrowUp,
    Boxes,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    CircleCheck,
    Coins,
    Eye,
    Loader2,
    MoreVertical,
    Package,
    PackageX,
    PencilLine,
    Plus,
    Power,
    Search,
    Trash2,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { StatCard } from '@/components/dashboard/stat-card';
import { BarcodeField } from '@/components/productos/barcode-field';
import { ProductoDetailSheet } from '@/components/productos/producto-detail-sheet';
import { StockAdjustDialog } from '@/components/productos/stock-adjust-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type {
    Paginated,
    ProductoFiltros,
    ProductoOpciones,
    ProductoRow,
    ProductoStats,
} from '@/types/producto';

interface PageProps {
    productos: Paginated<ProductoRow>;
    filtros: ProductoFiltros;
    stats: ProductoStats;
    opciones: ProductoOpciones;
}

const soles = (n: number) => `S/ ${Number(n || 0).toFixed(2)}`;

const inputBase =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

interface Recarga {
    search?: string;
    animal?: number | null;
    marca?: number | null;
    estado?: number | null;
    stock?: 'todos' | 'bajo' | 'sin';
    sort?: string;
    dir?: 'asc' | 'desc';
    perPage?: number;
}

export default function Index({
    productos,
    filtros,
    stats,
    opciones,
}: PageProps) {
    const [search, setSearch] = useState(filtros.search ?? '');
    const [codigoScan, setCodigoScan] = useState('');
    const [cargando, setCargando] = useState(false);

    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);

    const [ajustar, setAjustar] = useState<ProductoRow | null>(null);
    const [eliminar, setEliminar] = useState<ProductoRow | null>(null);
    const [borrando, setBorrando] = useState(false);

    const [buscandoCodigo, setBuscandoCodigo] = useState(false);
    const primeraCarga = useRef(true);

    useEffect(() => {
        const off1 = router.on('start', () => setCargando(true));
        const off2 = router.on('finish', () => setCargando(false));

        return () => {
            off1();
            off2();
        };
    }, []);

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;

            return;
        }

        const t = window.setTimeout(() => recargar({ search }), 350);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function recargar(overrides: Recarga = {}) {
        const params: Record<string, string | number> = {
            stock: overrides.stock ?? filtros.stock,
            sort: overrides.sort ?? filtros.sort,
            dir: overrides.dir ?? filtros.dir,
            perPage: overrides.perPage ?? filtros.perPage,
        };

        const animal =
            overrides.animal !== undefined ? overrides.animal : filtros.animal;
        const marca =
            overrides.marca !== undefined ? overrides.marca : filtros.marca;
        const estado =
            overrides.estado !== undefined ? overrides.estado : filtros.estado;
        const texto = overrides.search ?? search;

        if (animal) {
            params.animal = animal;
        }

        if (marca) {
            params.marca = marca;
        }

        if (estado) {
            params.estado = estado;
        }

        if (texto.trim() !== '') {
            params.search = texto.trim();
        }

        router.get(route('admin.productos.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['productos', 'filtros', 'stats'],
        });
    }

    function ordenarPor(columna: string) {
        const dir =
            filtros.sort === columna && filtros.dir === 'asc' ? 'desc' : 'asc';
        recargar({ sort: columna, dir });
    }

    function irA(url: string) {
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['productos', 'filtros', 'stats'],
            },
        );
    }

    function abrirDetalle(id: number) {
        setDetalleId(id);
        setDetalleAbierto(true);
    }

    async function buscarPorCodigo(codigo: string) {
        setBuscandoCodigo(true);

        try {
            const { data } = await axios.post<{ id_producto: number | null }>(
                route('admin.productos.buscar-codigo'),
                { codigo },
                {
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                },
            );

            if (data.id_producto) {
                abrirDetalle(data.id_producto);
            } else {
                toast.warning('Ningún producto tiene ese código de barras.', {
                    action: {
                        label: 'Registrar',
                        onClick: () =>
                            router.visit(route('admin.productos.create')),
                    },
                });
            }
        } catch {
            toast.error('No se pudo buscar el código. Intenta de nuevo.');
        } finally {
            setBuscandoCodigo(false);
        }
    }

    function toggleEstado(p: ProductoRow) {
        router.patch(
            route('admin.productos.estado', p.id_producto),
            {},
            { preserveScroll: true, preserveState: false },
        );
    }

    function confirmarEliminar() {
        if (!eliminar) {
            return;
        }

        router.delete(route('admin.productos.destroy', eliminar.id_producto), {
            preserveScroll: true,
            onStart: () => setBorrando(true),
            onFinish: () => {
                setBorrando(false);
                setEliminar(null);
                setDetalleAbierto(false);
            },
        });
    }

    const hayFiltros =
        (filtros.search ?? '') !== '' ||
        filtros.animal !== null ||
        filtros.marca !== null ||
        filtros.estado !== null ||
        filtros.stock !== 'todos';

    const sinResultados = productos.data.length === 0;

    return (
        <>
            <Head title="Productos" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Package className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Productos
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Catálogo e inventario. Escanea un código para
                                abrir un producto al instante.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('admin.productos.create')}
                        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:self-auto"
                    >
                        <Plus className="size-4" /> Nuevo producto
                    </Link>
                </div>

                {/* Escaneo rápido */}
                <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <BarcodeField
                                value={codigoScan}
                                onChange={setCodigoScan}
                                onScan={(c) => {
                                    buscarPorCodigo(c);
                                    setCodigoScan('');
                                }}
                                placeholder="Escanea o escribe un código de barras para abrir el producto…"
                            />
                        </div>
                        {buscandoCodigo ? (
                            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : null}
                    </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Productos"
                        value={String(stats.total)}
                        subtitle="En el catálogo"
                        icon={Package}
                        gradient="from-[#3f4146] to-[#232427]"
                    />
                    <StatCard
                        title="Activos"
                        value={String(stats.activos)}
                        subtitle="Visibles en la tienda"
                        icon={CircleCheck}
                        gradient="from-emerald-500 to-teal-600"
                    />
                    <StatCard
                        title="Sin stock"
                        value={String(stats.sin_stock)}
                        subtitle="Necesitan reposición"
                        icon={PackageX}
                        gradient="from-slate-500 to-slate-600"
                        onClick={() =>
                            recargar({
                                stock:
                                    filtros.stock === 'sin' ? 'todos' : 'sin',
                            })
                        }
                        active={filtros.stock === 'sin'}
                    />
                    <StatCard
                        title="Valor inventario"
                        value={soles(stats.valor_inventario)}
                        subtitle="Precio × stock"
                        icon={Coins}
                        gradient="from-amber-500 to-orange-600"
                    />
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, SKU, código o marca…"
                                aria-label="Buscar productos"
                                className={cn(inputBase, 'pl-9', search && 'pr-9')}
                            />
                            {search ? (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    aria-label="Limpiar"
                                    className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            ) : null}
                        </div>

                        <select
                            value={filtros.animal ?? ''}
                            onChange={(e) =>
                                recargar({
                                    animal: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            aria-label="Animal"
                            className={cn(inputBase, 'lg:w-40')}
                        >
                            <option value="">Todos los animales</option>
                            {opciones.animales.map((a) => (
                                <option key={a.id_animal} value={a.id_animal}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtros.marca ?? ''}
                            onChange={(e) =>
                                recargar({
                                    marca: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            aria-label="Marca"
                            className={cn(inputBase, 'lg:w-44')}
                        >
                            <option value="">Todas las marcas</option>
                            {opciones.marcas.map((m) => (
                                <option key={m.id_marca} value={m.id_marca}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtros.estado ?? ''}
                            onChange={(e) =>
                                recargar({
                                    estado: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            aria-label="Estado"
                            className={cn(inputBase, 'lg:w-36')}
                        >
                            <option value="">Todos</option>
                            {opciones.estados.map((es) => (
                                <option
                                    key={es.id_estado_producto}
                                    value={es.id_estado_producto}
                                >
                                    {es.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        <FiltroChip
                            activo={filtros.stock === 'bajo'}
                            onClick={() =>
                                recargar({
                                    stock:
                                        filtros.stock === 'bajo'
                                            ? 'todos'
                                            : 'bajo',
                                })
                            }
                        >
                            <TriangleAlert className="size-3.5" /> Stock bajo (≤{' '}
                            {opciones.umbralStockBajo})
                        </FiltroChip>
                        <FiltroChip
                            activo={filtros.stock === 'sin'}
                            onClick={() =>
                                recargar({
                                    stock:
                                        filtros.stock === 'sin'
                                            ? 'todos'
                                            : 'sin',
                                })
                            }
                        >
                            <PackageX className="size-3.5" /> Sin stock
                        </FiltroChip>

                        <div className="ml-auto flex items-center gap-2">
                            {hayFiltros ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(
                                            route('admin.productos.index'),
                                            { perPage: filtros.perPage },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                                only: [
                                                    'productos',
                                                    'filtros',
                                                    'stats',
                                                ],
                                            },
                                        );
                                    }}
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Limpiar filtros
                                </button>
                            ) : null}
                            <select
                                value={filtros.perPage}
                                onChange={(e) =>
                                    recargar({
                                        perPage: Number(e.target.value),
                                    })
                                }
                                aria-label="Por página"
                                className={cn(inputBase, 'h-8 w-auto py-0')}
                            >
                                {opciones.porPagina.map((n) => (
                                    <option key={n} value={n}>
                                        {n} / pág.
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Listado */}
                <div className="relative">
                    {cargando ? (
                        <div
                            className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-background/60 backdrop-blur-[1px]"
                            aria-hidden="true"
                        />
                    ) : null}

                    {sinResultados ? (
                        <EmptyState hayFiltros={hayFiltros} />
                    ) : (
                        <>
                            {/* Tabla (lg+) */}
                            <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm lg:block">
                                <div className="overflow-x-auto [scrollbar-width:thin]">
                                    <table className="w-full min-w-[880px] border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Producto"
                                                        columna="nombre"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    Identificadores
                                                </th>
                                                <th className="px-4 py-3">
                                                    Clasificación
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    <SortButton
                                                        label="Precio"
                                                        columna="precio"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                        alinearDerecha
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    <SortButton
                                                        label="Stock"
                                                        columna="stock"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    <span className="sr-only">
                                                        Acciones
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {productos.data.map((p) => (
                                                <tr
                                                    key={p.id_producto}
                                                    className="group transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                abrirDetalle(
                                                                    p.id_producto,
                                                                )
                                                            }
                                                            className="flex items-center gap-3 text-left"
                                                        >
                                                            <Miniatura
                                                                url={
                                                                    p.imagen_url
                                                                }
                                                                alt={p.nombre}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium text-foreground underline-offset-4 group-hover:underline">
                                                                    {p.nombre}
                                                                </p>
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {p.marca_nombre ??
                                                                        '—'}
                                                                    {!p.activo
                                                                        ? ' · Inactivo'
                                                                        : ''}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-mono text-xs text-foreground">
                                                            {p.sku}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {p.codigo_barras ??
                                                                'sin código'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        <p className="text-foreground">
                                                            {p.animal_nombre ??
                                                                '—'}
                                                        </p>
                                                        <p className="truncate text-xs">
                                                            {[
                                                                p.categoria_nombre,
                                                                p.subcategoria_nombre,
                                                            ]
                                                                .filter(
                                                                    Boolean,
                                                                )
                                                                .join(' · ') ||
                                                                '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium text-foreground tabular-nums">
                                                                {soles(
                                                                    p.precio_final,
                                                                )}
                                                            </span>
                                                            {p.descuento_label ? (
                                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                                                                    {
                                                                        p.descuento_label
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StockBadge
                                                            producto={p}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirDetalle(
                                                                        p.id_producto,
                                                                    )
                                                                }
                                                                title="Ver detalle"
                                                                aria-label={`Ver ${p.nombre}`}
                                                                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4"
                                                            >
                                                                <Eye />
                                                            </button>
                                                            <FilaAcciones
                                                                producto={p}
                                                                onAjustar={() =>
                                                                    setAjustar(
                                                                        p,
                                                                    )
                                                                }
                                                                onToggle={() =>
                                                                    toggleEstado(
                                                                        p,
                                                                    )
                                                                }
                                                                onEliminar={() =>
                                                                    setEliminar(
                                                                        p,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tarjetas (móvil / tablet) */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                                {productos.data.map((p) => (
                                    <div
                                        key={p.id_producto}
                                        className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                abrirDetalle(p.id_producto)
                                            }
                                            className="flex min-w-0 flex-1 gap-3 text-left"
                                        >
                                            <Miniatura
                                                url={p.imagen_url}
                                                alt={p.nombre}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-foreground">
                                                    {p.nombre}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {p.marca_nombre ?? '—'} ·{' '}
                                                    {p.animal_nombre ?? '—'}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <span className="font-medium tabular-nums">
                                                        {soles(p.precio_final)}
                                                    </span>
                                                    <StockBadge producto={p} />
                                                </div>
                                            </div>
                                        </button>
                                        <FilaAcciones
                                            producto={p}
                                            onAjustar={() => setAjustar(p)}
                                            onToggle={() => toggleEstado(p)}
                                            onEliminar={() => setEliminar(p)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!sinResultados ? (
                    <Pagination
                        data={productos}
                        disabled={cargando}
                        onNavigate={irA}
                    />
                ) : null}
            </div>

            <ProductoDetailSheet
                productoId={detalleId}
                open={detalleAbierto}
                onOpenChange={setDetalleAbierto}
                onAjustarStock={(p) => setAjustar(p)}
                onToggleEstado={(p) => toggleEstado(p)}
                onEliminar={(p) => setEliminar(p)}
            />

            <StockAdjustDialog
                producto={ajustar}
                open={ajustar !== null}
                onOpenChange={(o) => !o && setAjustar(null)}
            />

            <AlertDialog
                open={eliminar !== null}
                onOpenChange={(o) => !o && !borrando && setEliminar(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <Trash2 className="size-4" />
                            </span>
                            ¿Eliminar producto?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar{' '}
                            <strong className="text-foreground">
                                {eliminar?.nombre}
                            </strong>
                            . Si tiene pedidos o cupones asociados no se podrá
                            borrar: en ese caso, desactívalo. Esta acción no se
                            puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={borrando}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={borrando}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                            className="gap-2 bg-destructive text-white hover:bg-destructive/90"
                        >
                            {borrando ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Productos', href: '/admin/productos' }],
};

/* -------------------------------------------------------------------------- */

function Miniatura({ url, alt }: { url: string | null; alt: string }) {
    return (
        <span className="size-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {url ? (
                <img src={url} alt={alt} className="size-full object-cover" />
            ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground/40">
                    <Package className="size-4" />
                </span>
            )}
        </span>
    );
}

function StockBadge({ producto }: { producto: ProductoRow }) {
    if (producto.stock === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive tabular-nums">
                <PackageX className="size-3" /> 0
            </span>
        );
    }

    if (producto.stock_bajo) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 tabular-nums dark:bg-amber-500/15 dark:text-amber-400">
                <TriangleAlert className="size-3" /> {producto.stock}
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground tabular-nums">
            {producto.stock}
        </span>
    );
}

function FiltroChip({
    activo,
    onClick,
    children,
}: {
    activo: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={activo}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                activo
                    ? 'border-mosso-yellow bg-mosso-yellow/15 text-mosso-dark dark:text-mosso-yellow'
                    : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

function SortButton({
    label,
    columna,
    filtros,
    onSort,
    alinearDerecha,
}: {
    label: string;
    columna: string;
    filtros: ProductoFiltros;
    onSort: (columna: string) => void;
    alinearDerecha?: boolean;
}) {
    const activo = filtros.sort === columna;

    return (
        <button
            type="button"
            onClick={() => onSort(columna)}
            className={cn(
                'group inline-flex items-center gap-1 font-medium tracking-wide uppercase transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
                alinearDerecha && 'flex-row-reverse',
            )}
        >
            {label}
            <span className="text-muted-foreground">
                {activo ? (
                    filtros.dir === 'asc' ? (
                        <ArrowUp className="size-3.5" />
                    ) : (
                        <ArrowDown className="size-3.5" />
                    )
                ) : (
                    <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
            </span>
        </button>
    );
}

function FilaAcciones({
    producto,
    onAjustar,
    onToggle,
    onEliminar,
}: {
    producto: ProductoRow;
    onAjustar: () => void;
    onToggle: () => void;
    onEliminar: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Acciones para ${producto.nombre}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4"
                >
                    <MoreVertical />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                    <Link
                        href={route(
                            'admin.productos.edit',
                            producto.id_producto,
                        )}
                    >
                        <PencilLine className="mr-2 size-4" /> Editar
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAjustar}>
                    <Boxes className="mr-2 size-4" /> Ajustar stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggle}>
                    <Power className="mr-2 size-4" />
                    {producto.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onEliminar}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                    <Trash2 className="mr-2 size-4" /> Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Pagination({
    data,
    disabled,
    onNavigate,
}: {
    data: Paginated<ProductoRow>;
    disabled: boolean;
    onNavigate: (url: string) => void;
}) {
    const paginas = data.links.slice(1, -1);

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium text-foreground tabular-nums">
                    {data.from ?? 0}
                </span>
                –
                <span className="font-medium text-foreground tabular-nums">
                    {data.to ?? 0}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground tabular-nums">
                    {data.total}
                </span>
            </p>

            {data.last_page > 1 ? (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={disabled || !data.prev_page_url}
                        onClick={() =>
                            data.prev_page_url && onNavigate(data.prev_page_url)
                        }
                        aria-label="Página anterior"
                        className="inline-flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    {paginas.map((link, i) =>
                        link.url === null ? (
                            <span
                                key={`gap-${i}`}
                                className="px-1.5 text-sm text-muted-foreground"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={link.label}
                                type="button"
                                disabled={disabled}
                                onClick={() => onNavigate(link.url as string)}
                                aria-current={link.active ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium tabular-nums transition-colors',
                                    link.active
                                        ? 'bg-mosso-yellow text-mosso-dark'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                            >
                                {link.label}
                            </button>
                        ),
                    )}
                    <button
                        type="button"
                        disabled={disabled || !data.next_page_url}
                        onClick={() =>
                            data.next_page_url && onNavigate(data.next_page_url)
                        }
                        aria-label="Página siguiente"
                        className="inline-flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function EmptyState({ hayFiltros }: { hayFiltros: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                {hayFiltros ? (
                    <Search className="size-6" />
                ) : (
                    <Package className="size-6" />
                )}
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
                {hayFiltros
                    ? 'Sin coincidencias'
                    : 'Aún no hay productos'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {hayFiltros
                    ? 'Ningún producto coincide con la búsqueda o los filtros aplicados.'
                    : 'Registra el primer producto del catálogo.'}
            </p>
            {!hayFiltros ? (
                <Link
                    href={route('admin.productos.create')}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                    <Plus className="size-4" /> Nuevo producto
                </Link>
            ) : null}
        </div>
    );
}
