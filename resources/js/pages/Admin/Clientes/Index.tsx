import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Eye,
    Loader2,
    Mail,
    PawPrint,
    Pencil,
    Phone,
    Plus,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ClienteAvatar } from '@/components/clientes/cliente-avatar';
import {
    soles,
    tiempoRelativo,
} from '@/components/clientes/cliente-helpers';
import { StatCard } from '@/components/dashboard/stat-card';
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
import { cn } from '@/lib/utils';
import type {
    ClienteFiltros,
    ClienteOpciones,
    ClienteRow,
    ClienteSegmento,
    ClienteStats,
    Paginated,
} from '@/types/cliente';

interface PageProps {
    clientes: Paginated<ClienteRow>;
    filtros: ClienteFiltros;
    stats: ClienteStats;
    opciones: ClienteOpciones;
}

const SEGMENTO_LABEL: Record<ClienteSegmento, string> = {
    todos: 'Todos los clientes',
    personas: 'Solo personas',
    empresas: 'Solo empresas',
    con_cuenta: 'Con cuenta de acceso',
    sin_cuenta: 'Sin cuenta de acceso',
};

const inputBase =
    'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

interface RecargaParams {
    search?: string;
    segmento?: ClienteSegmento;
    sort?: string;
    dir?: 'asc' | 'desc';
    perPage?: number;
}

export default function Index({
    clientes,
    filtros,
    stats,
    opciones,
}: PageProps) {
    const [search, setSearch] = useState(filtros.search ?? '');
    const [cargando, setCargando] = useState(false);
    const [eliminando, setEliminando] = useState<ClienteRow | null>(null);
    const [borrando, setBorrando] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el texto
    }, [search]);

    function recargar(overrides: RecargaParams = {}) {
        const params: Record<string, string | number> = {
            segmento: overrides.segmento ?? filtros.segmento,
            sort: overrides.sort ?? filtros.sort,
            dir: overrides.dir ?? filtros.dir,
            perPage: overrides.perPage ?? filtros.perPage,
        };

        const texto = overrides.search ?? search;

        if (texto.trim() !== '') {
            params.search = texto.trim();
        }

        router.get(route('admin.clientes.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['clientes', 'filtros'],
        });
    }

    function ordenarPor(columna: string) {
        const dir =
            filtros.sort === columna && filtros.dir === 'asc' ? 'desc' : 'asc';

        recargar({ sort: columna, dir });
    }

    function alternarSegmento(valor: ClienteSegmento) {
        recargar({
            segmento: filtros.segmento === valor ? 'todos' : valor,
        });
    }

    function irA(url: string) {
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['clientes', 'filtros'],
            },
        );
    }

    function confirmarEliminacion() {
        if (!eliminando) {
            return;
        }

        router.delete(route('admin.clientes.destroy', eliminando.id_cliente), {
            preserveScroll: true,
            onStart: () => setBorrando(true),
            onFinish: () => {
                setBorrando(false);
                setEliminando(null);
            },
        });
    }

    const buscando = (filtros.search ?? '') !== '';
    const filtrado = buscando || filtros.segmento !== 'todos';
    const sinResultados = clientes.data.length === 0;

    return (
        <>
            <Head title="Clientes" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Users className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Clientes
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Directorio de clientes del Portal Web: personas y
                                empresas, con o sin cuenta de acceso.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('admin.clientes.create')}
                        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:self-auto"
                    >
                        <Plus className="size-4" /> Nuevo cliente
                    </Link>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Clientes"
                        value={String(stats.total)}
                        subtitle="Registrados en total"
                        icon={Users}
                        gradient="from-[#3f4146] to-[#232427]"
                    />
                    <StatCard
                        title="Con cuenta"
                        value={String(stats.con_cuenta)}
                        subtitle="Inician sesión en la tienda"
                        icon={ShieldCheck}
                        gradient="from-emerald-500 to-teal-600"
                        onClick={() => alternarSegmento('con_cuenta')}
                        active={filtros.segmento === 'con_cuenta'}
                    />
                    <StatCard
                        title="Empresas"
                        value={String(stats.empresas)}
                        subtitle="Facturan con RUC"
                        icon={Building2}
                        gradient="from-amber-500 to-orange-600"
                        onClick={() => alternarSegmento('empresas')}
                        active={filtros.segmento === 'empresas'}
                    />
                    <StatCard
                        title="Nuevos"
                        value={String(stats.nuevos_mes)}
                        subtitle="Altas este mes"
                        icon={Sparkles}
                        gradient="from-slate-500 to-slate-600"
                    />
                </div>

                {/* Barra de herramientas */}
                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, documento, correo o RUC…"
                            aria-label="Buscar clientes"
                            className={cn(inputBase, 'pl-9', search && 'pr-9')}
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Limpiar búsqueda"
                                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        ) : null}
                    </div>

                    <select
                        value={filtros.segmento}
                        onChange={(e) =>
                            recargar({
                                segmento: e.target.value as ClienteSegmento,
                            })
                        }
                        aria-label="Segmento"
                        className={cn(inputBase, 'py-2 sm:w-56')}
                    >
                        {opciones.segmentos.map((s) => (
                            <option key={s} value={s}>
                                {SEGMENTO_LABEL[s]}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="por-pagina"
                            className="text-xs whitespace-nowrap text-muted-foreground"
                        >
                            Por página
                        </label>
                        <select
                            id="por-pagina"
                            value={filtros.perPage}
                            onChange={(e) =>
                                recargar({ perPage: Number(e.target.value) })
                            }
                            className={cn(inputBase, 'w-auto py-1.5')}
                        >
                            {opciones.porPagina.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
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
                        <EmptyState
                            filtrado={filtrado}
                            onLimpiar={() => {
                                setSearch('');
                                recargar({ search: '', segmento: 'todos' });
                            }}
                        />
                    ) : (
                        <>
                            {/* Tabla (md+) */}
                            <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
                                <div className="overflow-x-auto [scrollbar-width:thin]">
                                    <table className="w-full min-w-[920px] border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Cliente"
                                                        columna="nombre"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Contacto"
                                                        columna="correo"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Actividad"
                                                        columna="pedidos"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Registrado"
                                                        columna="creado"
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
                                            {clientes.data.map((c) => (
                                                <tr
                                                    key={c.id_cliente}
                                                    className="group transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <ClienteAvatar
                                                                nombre={c.nombre}
                                                                iniciales={
                                                                    c.iniciales
                                                                }
                                                            />
                                                            <div className="min-w-0">
                                                                <Link
                                                                    href={route(
                                                                        'admin.clientes.show',
                                                                        c.id_cliente,
                                                                    )}
                                                                    className="flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                                                                >
                                                                    <span className="truncate">
                                                                        {c.nombre}
                                                                    </span>
                                                                </Link>
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {c.tipo_documento ??
                                                                        'Sin documento'}
                                                                    {c.num_documento
                                                                        ? ` · ${c.num_documento}`
                                                                        : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="flex items-center gap-1.5 text-foreground">
                                                                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                                                                <span className="truncate">
                                                                    {c.correo}
                                                                </span>
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                                <Phone className="size-3.5 shrink-0" />
                                                                {c.telefono ??
                                                                    '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <Contador
                                                                icon={PawPrint}
                                                                valor={
                                                                    c.mascotas_count
                                                                }
                                                                titulo="mascotas"
                                                            />
                                                            <Contador
                                                                icon={
                                                                    ShoppingBag
                                                                }
                                                                valor={
                                                                    c.pedidos_count
                                                                }
                                                                titulo="pedidos"
                                                            />
                                                            {c.total_gastado >
                                                            0 ? (
                                                                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                                                    {soles(
                                                                        c.total_gastado,
                                                                    )}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                        {tiempoRelativo(
                                                            c.creado_en,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <div className="flex items-center gap-1">
                                                                {c.es_empresa ? (
                                                                    <ChipIcono
                                                                        icon={
                                                                            Building2
                                                                        }
                                                                        titulo="Empresa"
                                                                        tone="amber"
                                                                    />
                                                                ) : null}
                                                                {c.tiene_cuenta ? (
                                                                    <ChipIcono
                                                                        icon={
                                                                            ShieldCheck
                                                                        }
                                                                        titulo="Con cuenta de acceso"
                                                                        tone="emerald"
                                                                    />
                                                                ) : null}
                                                            </div>
                                                            <RowActions
                                                                cliente={c}
                                                                onDelete={
                                                                    setEliminando
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

                            {/* Tarjetas (móvil) */}
                            <div className="space-y-3 md:hidden">
                                {clientes.data.map((c) => (
                                    <div
                                        key={c.id_cliente}
                                        className="rounded-xl border bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <Link
                                                href={route(
                                                    'admin.clientes.show',
                                                    c.id_cliente,
                                                )}
                                                className="flex min-w-0 items-center gap-3"
                                            >
                                                <ClienteAvatar
                                                    nombre={c.nombre}
                                                    iniciales={c.iniciales}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">
                                                        {c.nombre}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {c.correo}
                                                    </p>
                                                </div>
                                            </Link>
                                            <RowActions
                                                cliente={c}
                                                onDelete={setEliminando}
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                            <Contador
                                                icon={PawPrint}
                                                valor={c.mascotas_count}
                                                titulo="mascotas"
                                            />
                                            <Contador
                                                icon={ShoppingBag}
                                                valor={c.pedidos_count}
                                                titulo="pedidos"
                                            />
                                            {c.es_empresa ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                                                    <Building2 className="size-3" />{' '}
                                                    Empresa
                                                </span>
                                            ) : null}
                                            {c.tiene_cuenta ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                                    <ShieldCheck className="size-3" />{' '}
                                                    Cuenta
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!sinResultados ? (
                    <Pagination
                        data={clientes}
                        disabled={cargando}
                        onNavigate={irA}
                    />
                ) : null}
            </div>

            <AlertDialog
                open={eliminando !== null}
                onOpenChange={(o) => !o && !borrando && setEliminando(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <Trash2 className="size-4" />
                            </span>
                            ¿Eliminar cliente?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar a{' '}
                            <strong className="text-foreground">
                                {eliminando?.nombre}
                            </strong>
                            . Se borrarán también sus mascotas, direcciones,
                            puntos y —si la tiene— su cuenta de acceso. Esta
                            acción no se puede deshacer.
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
                                confirmarEliminacion();
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
    breadcrumbs: [{ title: 'Clientes', href: '/admin/clientes' }],
};

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function Contador({
    icon: Icon,
    valor,
    titulo,
}: {
    icon: React.ComponentType<{ className?: string }>;
    valor: number;
    titulo: string;
}) {
    return (
        <span
            title={`${valor} ${titulo}`}
            className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
                valor > 0
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground/60',
            )}
        >
            <Icon className="size-3.5" />
            {valor}
        </span>
    );
}

function ChipIcono({
    icon: Icon,
    titulo,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    titulo: string;
    tone: 'amber' | 'emerald';
}) {
    const tones = {
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        emerald:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    };

    return (
        <span
            title={titulo}
            aria-label={titulo}
            className={cn(
                'flex size-6 items-center justify-center rounded-md',
                tones[tone],
            )}
        >
            <Icon className="size-3.5" />
        </span>
    );
}

function SortButton({
    label,
    columna,
    filtros,
    onSort,
}: {
    label: string;
    columna: string;
    filtros: ClienteFiltros;
    onSort: (columna: string) => void;
}) {
    const activo = filtros.sort === columna;

    return (
        <button
            type="button"
            onClick={() => onSort(columna)}
            className="group inline-flex items-center gap-1 font-medium tracking-wide uppercase transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
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

function RowActions({
    cliente,
    onDelete,
}: {
    cliente: ClienteRow;
    onDelete: (cliente: ClienteRow) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-0.5">
            <Link
                href={route('admin.clientes.show', cliente.id_cliente)}
                title="Ver ficha"
                aria-label={`Ver ficha de ${cliente.nombre}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
            >
                <Eye />
            </Link>
            <Link
                href={route('admin.clientes.edit', cliente.id_cliente)}
                title="Editar cliente"
                aria-label={`Editar a ${cliente.nombre}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
            >
                <Pencil />
            </Link>
            <button
                type="button"
                onClick={() => onDelete(cliente)}
                title="Eliminar cliente"
                aria-label={`Eliminar a ${cliente.nombre}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 [&_svg]:size-4"
            >
                <Trash2 />
            </button>
        </div>
    );
}

function Pagination({
    data,
    disabled,
    onNavigate,
}: {
    data: Paginated<ClienteRow>;
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
                                    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium tabular-nums transition-colors disabled:cursor-not-allowed',
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

function EmptyState({
    filtrado,
    onLimpiar,
}: {
    filtrado: boolean;
    onLimpiar: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                {filtrado ? (
                    <Search className="size-6" />
                ) : (
                    <UserPlus className="size-6" />
                )}
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
                {filtrado ? 'Sin coincidencias' : 'Aún no hay clientes'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {filtrado
                    ? 'Ningún cliente coincide con la búsqueda o el segmento seleccionado.'
                    : 'Registra el primer cliente para empezar a gestionar sus datos, mascotas y pedidos.'}
            </p>
            <div className="mt-4">
                {filtrado ? (
                    <button
                        type="button"
                        onClick={onLimpiar}
                        className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                    >
                        Quitar filtros
                    </button>
                ) : (
                    <Link
                        href={route('admin.clientes.create')}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                    >
                        <Plus className="size-4" /> Nuevo cliente
                    </Link>
                )}
            </div>
        </div>
    );
}
