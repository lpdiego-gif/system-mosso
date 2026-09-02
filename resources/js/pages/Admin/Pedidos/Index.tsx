import { Head, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Eye,
    FileText,
    Loader2,
    PackageCheck,
    Search,
    ShoppingBag,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { StatCard } from '@/components/dashboard/stat-card';
import { soles, tiempoRelativo } from '@/components/clientes/cliente-helpers';
import { PedidoDetalleDrawer } from '@/components/pedidos/pedido-detalle-drawer';
import { ESTADO_TONO } from '@/components/pedidos/pedido-helpers';
import { cn } from '@/lib/utils';
import type { EstadoOpcion, PedidoRow } from '@/types/pedido';

interface Filtros {
    search: string | null;
    estado: number | null;
    sort: string;
    dir: 'asc' | 'desc';
    perPage: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface PageProps {
    pedidos: Paginated<PedidoRow>;
    filtros: Filtros;
    stats: { total: number; ventas_mes: number; pendientes: number; entregados: number };
    opciones: { estados: EstadoOpcion[]; porPagina: number[] };
}

const inputBase =
    'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

interface RecargaParams {
    search?: string;
    estado?: number | null;
    sort?: string;
    dir?: 'asc' | 'desc';
    perPage?: number;
}

export default function Index({ pedidos, filtros, stats, opciones }: PageProps) {
    const [search, setSearch] = useState(filtros.search ?? '');
    const [cargando, setCargando] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<number | null>(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [guardandoEstadoId, setGuardandoEstadoId] = useState<number | null>(null);
    const primeraCarga = useRef(true);

    function verDetalle(id: number) {
        setPedidoSeleccionado(id);
        setDrawerAbierto(true);
    }

    function cambiarEstado(idPedido: number, fkEstado: number) {
        setGuardandoEstadoId(idPedido);
        router.patch(
            route('admin.pedidos.estado', idPedido),
            { fk_estado_pedido: fkEstado },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['pedidos'],
                onFinish: () => setGuardandoEstadoId(null),
            },
        );
    }

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

    function recargar(overrides: RecargaParams = {}) {
        const params: Record<string, string | number> = {
            sort: overrides.sort ?? filtros.sort,
            dir: overrides.dir ?? filtros.dir,
            perPage: overrides.perPage ?? filtros.perPage,
        };

        const estado = overrides.estado !== undefined ? overrides.estado : filtros.estado;
        if (estado) params.estado = estado;

        const texto = overrides.search ?? search;
        if (texto.trim() !== '') params.search = texto.trim();

        router.get(route('admin.pedidos.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['pedidos', 'filtros'],
        });
    }

    function ordenarPor(columna: string) {
        const dir = filtros.sort === columna && filtros.dir === 'asc' ? 'desc' : 'asc';
        recargar({ sort: columna, dir });
    }

    function irA(url: string) {
        router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true, only: ['pedidos', 'filtros'] });
    }

    const filtrado = (filtros.search ?? '') !== '' || filtros.estado !== null;
    const sinResultados = pedidos.data.length === 0;

    return (
        <>
            <Head title="Pedidos" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <ShoppingBag className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Pedidos</h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Pedidos realizados en el Portal Web, con su estado y detalle.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard title="Pedidos" value={String(stats.total)} subtitle="En total" icon={ShoppingBag} gradient="from-[#3f4146] to-[#232427]" />
                    <StatCard title="Ventas del mes" value={soles(stats.ventas_mes)} subtitle="Suma de totales" icon={TrendingUp} gradient="from-emerald-500 to-teal-600" />
                    <StatCard
                        title="Pendientes de pago"
                        value={String(stats.pendientes)}
                        subtitle="Esperando pago"
                        icon={ShoppingBag}
                        gradient="from-amber-500 to-orange-600"
                    />
                    <StatCard title="Entregados" value={String(stats.entregados)} subtitle="Completados" icon={PackageCheck} gradient="from-slate-500 to-slate-600" />
                </div>

                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por N° de pedido, cliente o correo…"
                            aria-label="Buscar pedidos"
                            className={cn(inputBase, 'pl-9', search && 'pr-9')}
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Limpiar búsqueda"
                            >
                                <X className="size-4" />
                            </button>
                        ) : null}
                    </div>

                    <select
                        value={filtros.estado ?? ''}
                        onChange={(e) => recargar({ estado: e.target.value ? Number(e.target.value) : null })}
                        className={cn(inputBase, 'sm:w-56')}
                        aria-label="Filtrar por estado"
                    >
                        <option value="">Todos los estados</option>
                        {opciones.estados.map((e) => (
                            <option key={e.id_estado_pedido} value={e.id_estado_pedido}>
                                {e.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    {sinResultados ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                                {filtrado ? <Search className="size-6" /> : <ShoppingBag className="size-6" />}
                            </span>
                            <h3 className="mt-2 text-sm font-semibold text-foreground">
                                {filtrado ? 'Sin coincidencias' : 'Todavía no hay pedidos'}
                            </h3>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                {filtrado
                                    ? 'Ningún pedido coincide con la búsqueda o el filtro seleccionado.'
                                    : 'Cuando un cliente complete su compra, aparecerá aquí.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                                        <th className="px-4 py-3 text-left font-medium">Pedido</th>
                                        <th className="px-4 py-3 text-left font-medium">Cliente</th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            <SortButton label="Fecha" columna="fecha" filtros={filtros} onSort={ordenarPor} />
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            <SortButton label="Estado" columna="estado" filtros={filtros} onSort={ordenarPor} />
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            <SortButton label="Total" columna="total" filtros={filtros} onSort={ordenarPor} />
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pedidos.data.map((p) => (
                                        <tr key={p.id_pedido} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium tabular-nums text-foreground">
                                                #{String(p.id_pedido).padStart(6, '0')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">{p.cliente}</p>
                                                <p className="text-xs text-muted-foreground">{p.correo}</p>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground" title={p.fecha_pedido}>
                                                {tiempoRelativo(p.fecha_pedido)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={p.fk_estado_pedido}
                                                        onChange={(e) => cambiarEstado(p.id_pedido, Number(e.target.value))}
                                                        disabled={guardandoEstadoId === p.id_pedido}
                                                        aria-label={`Cambiar estado del pedido #${p.id_pedido}`}
                                                        className={cn(
                                                            'cursor-pointer appearance-none rounded-full py-1 pr-6 pl-2.5 text-xs font-medium outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
                                                            ESTADO_TONO[p.estado] ?? 'bg-muted text-muted-foreground',
                                                        )}
                                                    >
                                                        {opciones.estados.map((e) => (
                                                            <option key={e.id_estado_pedido} value={e.id_estado_pedido} className="bg-popover text-foreground">
                                                                {e.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {guardandoEstadoId === p.id_pedido ? (
                                                        <Loader2 className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 animate-spin" />
                                                    ) : (
                                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 opacity-60" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">{soles(p.total)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => verDetalle(p.id_pedido)}
                                                        title="Ver detalle"
                                                        aria-label={`Ver detalle del pedido #${p.id_pedido}`}
                                                        className="inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>
                                                    <a
                                                        href={route('admin.pedidos.pdf', p.id_pedido)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver PDF"
                                                        aria-label={`Ver PDF del pedido #${p.id_pedido}`}
                                                        className="inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground"
                                                    >
                                                        <FileText className="size-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!sinResultados ? <Pagination data={pedidos} disabled={cargando} onNavigate={irA} /> : null}
            </div>

            <PedidoDetalleDrawer
                pedidoId={pedidoSeleccionado}
                open={drawerAbierto}
                onOpenChange={(value) => {
                    setDrawerAbierto(value);

                    if (!value) {
                        setPedidoSeleccionado(null);
                    }
                }}
            />
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Pedidos', href: '/admin/pedidos' }],
};

function SortButton({ label, columna, filtros, onSort }: { label: string; columna: string; filtros: Filtros; onSort: (c: string) => void }) {
    const activo = filtros.sort === columna;
    return (
        <button type="button" onClick={() => onSort(columna)} className="group inline-flex items-center gap-1 font-medium tracking-wide uppercase transition-colors hover:text-foreground">
            {label}
            <span className="text-muted-foreground">
                {activo ? filtros.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
            </span>
        </button>
    );
}

function Pagination({ data, disabled, onNavigate }: { data: Paginated<PedidoRow>; disabled: boolean; onNavigate: (url: string) => void }) {
    const paginas = data.links.slice(1, -1);
    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground tabular-nums">{data.from ?? 0}</span>–
                <span className="font-medium text-foreground tabular-nums">{data.to ?? 0}</span> de{' '}
                <span className="font-medium text-foreground tabular-nums">{data.total}</span>
            </p>
            {data.last_page > 1 ? (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={disabled || !data.prev_page_url}
                        onClick={() => data.prev_page_url && onNavigate(data.prev_page_url)}
                        aria-label="Página anterior"
                        className="inline-flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    {paginas.map((link, i) =>
                        link.url === null ? (
                            <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
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
                                    link.active ? 'bg-mosso-yellow text-mosso-dark' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                            >
                                {link.label}
                            </button>
                        ),
                    )}
                    <button
                        type="button"
                        disabled={disabled || !data.next_page_url}
                        onClick={() => data.next_page_url && onNavigate(data.next_page_url)}
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
