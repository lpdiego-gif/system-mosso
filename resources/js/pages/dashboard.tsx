import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    FileWarning,
    Receipt,
    RotateCcw,
    ShoppingCart,
    Tag,
    TrendingUp,
    UserPlus,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';
import { AttentionTiles } from '@/components/dashboard/attention-tiles';
import type { AttentionTile } from '@/components/dashboard/attention-tiles';
import { BarList } from '@/components/dashboard/bar-list';
import type { BarRow } from '@/components/dashboard/bar-list';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { EstadoPedidoBadge } from '@/components/dashboard/estado-pedido-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PeriodTabs } from '@/components/dashboard/period-tabs';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { DashboardPageProps } from '@/types/dashboard';

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const formatoMoneda0 = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat('es-PE');

const formatoFecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
const formatoFechaCorta = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });
const formatoRango = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });

/** Props que dependen del periodo — las únicas que se recargan al cambiar el rango. */
const PROPS_DEL_PERIODO = [
    'periodo',
    'stats',
    'ventasPorDia',
    'clientesPorDia',
    'ventasPorCategoria',
    'productosMasVendidos',
];

/** Chrome de panel: borde tenue en claro, superficie translúcida elevada en oscuro. */
const PANEL = 'border-border/70 dark:border-white/[0.07] dark:bg-white/[0.02]';

export default function Dashboard({
    periodo,
    periodosDisponibles,
    stats,
    alertas,
    ventasPorDia,
    clientesPorDia,
    ventasPorCategoria,
    productosMasVendidos,
    productosStockBajo,
    pedidosRecientes,
    productosPorAnimal,
    trabajadoresPorRol,
    descuentosActivos,
}: DashboardPageProps) {
    const [cargando, setCargando] = useState(false);

    const cambiarPeriodo = useCallback(
        (dias: number) => {
            if (dias === periodo || cargando) {
                return;
            }

            router.get(
                route('dashboard'),
                { periodo: dias },
                {
                    only: PROPS_DEL_PERIODO,
                    preserveState: true,
                    preserveScroll: true,
                    onStart: () => setCargando(true),
                    onFinish: () => setCargando(false),
                },
            );
        },
        [periodo, cargando],
    );

    const hoy = new Date();
    const inicioRango = new Date();
    inicioRango.setDate(hoy.getDate() - (periodo - 1));
    const rangoLabel = `${formatoRango.format(inicioRango)} – ${formatoRango.format(hoy)}`;
    const contextoDelta = `vs. ${periodo} días previos`;

    const totalCategorias = ventasPorCategoria.reduce((acc, c) => acc + c.total, 0);
    const filasCategoria: BarRow[] = ventasPorCategoria.map((c) => ({
        id: c.categoria,
        label: c.categoria,
        value: c.total,
        valueLabel: formatoMoneda0.format(c.total),
        meta:
            totalCategorias > 0
                ? `${Math.round((c.total / totalCategorias) * 100)}%`
                : undefined,
    }));

    const filasMasVendidos: BarRow[] = productosMasVendidos.map((p, i) => ({
        id: p.nombre,
        label: p.nombre,
        value: p.cantidadVendida,
        valueLabel: formatoMoneda0.format(p.totalVendido),
        meta: `${formatoNumero.format(p.cantidadVendida)} und.`,
        rank: i + 1,
    }));

    const filasEquipo: BarRow[] = trabajadoresPorRol.map((t) => ({
        id: t.rol,
        label: t.rol,
        value: t.total,
        valueLabel: formatoNumero.format(t.total),
    }));

    // Ticket promedio por día = ingresos / pedidos de ese día (0 si no hubo pedidos).
    const serieTicket = ventasPorDia.map((d) => (d.pedidos > 0 ? d.total / d.pedidos : 0));
    const serieVentas = ventasPorDia.map((d) => d.total);
    const seriePedidos = ventasPorDia.map((d) => d.pedidos);

    const tilesAtencion: AttentionTile[] = [
        {
            label: 'Pedidos pendientes',
            hint: 'Pendientes de pago',
            count: alertas.pedidosPendientes,
            icon: ShoppingCart,
            href: route('admin.pedidos.index'),
            tone: 'warn',
        },
        {
            label: 'Devoluciones abiertas',
            hint: 'Por revisar o en trámite',
            count: alertas.devolucionesAbiertas,
            icon: RotateCcw,
            href: route('admin.devoluciones.index'),
            tone: 'warn',
        },
        {
            label: 'Reclamos abiertos',
            hint: 'Libro de reclamaciones',
            count: alertas.reclamosAbiertos,
            icon: FileWarning,
            href: route('admin.reclamos.index'),
            tone: 'alert',
        },
        {
            label: 'Productos stock bajo',
            hint: 'Menos de 10 unidades',
            count: alertas.productosStockBajo,
            icon: AlertTriangle,
            href: route('admin.productos.index'),
            tone: 'alert',
        },
    ];

    const todoEnOrden = tilesAtencion.every((t) => t.count === 0);
    const resumen = [
        {
            label: 'Ingresos históricos',
            value: formatoMoneda0.format(stats.ventasTotal),
            hint: `${formatoNumero.format(stats.pedidosTotal)} pedidos pagados`,
        },
        {
            label: 'Valor de inventario',
            value: formatoMoneda0.format(stats.valorInventario),
            hint: 'Precio × stock del catálogo',
        },
        {
            label: 'Catálogo activo',
            value: `${formatoNumero.format(stats.productosActivos)} / ${formatoNumero.format(stats.productosTotal)}`,
            hint: 'Productos publicados',
        },
        {
            label: 'Equipo activo',
            value: `${formatoNumero.format(stats.trabajadoresActivos)} / ${formatoNumero.format(stats.trabajadoresTotal)}`,
            hint: 'Trabajadores habilitados',
        },
    ];

    return (
        <>
            <Head title="Panel de Control" />

            <div className="flex flex-1 flex-col gap-6 rounded-xl bg-muted/50 p-4 sm:p-6 dark:bg-[#0b0f17]">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Activity className="size-5" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Panel de Control
                            </h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Ventas, inventario y equipo de Mosso · {rangoLabel}
                            </p>
                        </div>
                    </div>
                    <PeriodTabs
                        value={periodo}
                        options={periodosDisponibles}
                        onChange={cambiarPeriodo}
                        disabled={cargando}
                    />
                </header>

                <section aria-label="Requiere atención" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-foreground">Requiere atención</h2>
                        {todoEnOrden && (
                            <Badge
                                variant="secondary"
                                className="gap-1 text-emerald-700 dark:text-emerald-400"
                            >
                                <CheckCircle2 className="size-3" />
                                Todo al día
                            </Badge>
                        )}
                    </div>
                    <AttentionTiles tiles={tilesAtencion} />
                </section>

                <div
                    className={cn(
                        'flex flex-col gap-6 transition-opacity duration-200',
                        cargando && 'pointer-events-none opacity-50',
                    )}
                    aria-busy={cargando}
                >
                    <section
                        aria-label="Indicadores del periodo"
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        <KpiCard
                            label="Ventas del periodo"
                            value={formatoMoneda0.format(stats.ventasPeriodo)}
                            context={contextoDelta}
                            delta={stats.ventasDelta}
                            icon={TrendingUp}
                            accent="indigo"
                            serie={serieVentas}
                        />
                        <KpiCard
                            label="Pedidos pagados"
                            value={formatoNumero.format(stats.pedidosPeriodo)}
                            context={contextoDelta}
                            delta={stats.pedidosDelta}
                            icon={ShoppingCart}
                            accent="emerald"
                            serie={seriePedidos}
                            href={route('admin.pedidos.index')}
                        />
                        <KpiCard
                            label="Ticket promedio"
                            value={formatoMoneda0.format(stats.ticketPromedio)}
                            context="Promedio por pedido pagado"
                            delta={stats.ticketDelta}
                            icon={Receipt}
                            accent="amber"
                            serie={serieTicket}
                        />
                        <KpiCard
                            label="Clientes nuevos"
                            value={formatoNumero.format(stats.clientesNuevos)}
                            context={`${formatoNumero.format(stats.clientesTotal)} en total`}
                            delta={stats.clientesDelta}
                            icon={UserPlus}
                            accent="violet"
                            serie={clientesPorDia}
                            href={route('admin.clientes.index')}
                        />
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {resumen.map((r) => (
                            <div
                                key={r.label}
                                className={cn(
                                    'flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm',
                                    PANEL,
                                )}
                            >
                                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {r.label}
                                </span>
                                <span className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                                    {r.value}
                                </span>
                                <span className="text-xs text-muted-foreground">{r.hint}</span>
                            </div>
                        ))}
                    </section>

                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className={cn('lg:col-span-2', PANEL)}>
                            <CardHeader className="flex-row items-center justify-between gap-2">
                                <CardTitle className="text-base">Ventas por día</CardTitle>
                                <span className="text-sm font-semibold tabular-nums text-foreground">
                                    {formatoMoneda.format(stats.ventasPeriodo)}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <SalesChart data={ventasPorDia} formatoMoneda={formatoMoneda} />
                            </CardContent>
                        </Card>

                        <Card className={PANEL}>
                            <CardHeader>
                                <CardTitle className="text-base">Ingresos por categoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BarList
                                    rows={filasCategoria}
                                    emptyMessage="Sin ventas por categoría en este periodo."
                                />
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card className={PANEL}>
                            <CardHeader>
                                <CardTitle className="text-base">Productos más vendidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BarList
                                    rows={filasMasVendidos}
                                    emptyMessage="Aún no se registran ventas de productos en este periodo."
                                />
                            </CardContent>
                        </Card>

                        <Card className={PANEL}>
                            <CardHeader>
                                <CardTitle className="text-base">Catálogo por mascota</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DonutChart
                                    data={productosPorAnimal.map((p) => ({
                                        label: p.animal,
                                        total: p.total,
                                    }))}
                                    centerLabel="productos"
                                    emptyMessage="Sin productos activos clasificados."
                                />
                            </CardContent>
                        </Card>
                    </section>
                </div>

                <Card className={PANEL}>
                    <CardHeader className="flex-row items-center justify-between gap-2">
                        <CardTitle className="text-base">Pedidos recientes</CardTitle>
                        <Link
                            href={route('admin.pedidos.index')}
                            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Ver todos
                            <ArrowUpRight className="size-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6">Pedido</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="pr-6 text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pedidosRecientes.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center text-sm text-muted-foreground"
                                        >
                                            Aún no se han registrado pedidos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pedidosRecientes.map((pedido) => (
                                        <TableRow key={pedido.id}>
                                            <TableCell className="pl-6 font-medium tabular-nums">
                                                <Link
                                                    href={route('admin.pedidos.show', pedido.id)}
                                                    className="text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
                                                >
                                                    #{pedido.id}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="block max-w-40 truncate">
                                                    {pedido.cliente}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <EstadoPedidoBadge
                                                    estado={pedido.estado}
                                                    estadoId={pedido.estadoId}
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatoFecha.format(new Date(pedido.fecha))}
                                            </TableCell>
                                            <TableCell className="pr-6 text-right font-medium tabular-nums">
                                                {formatoMoneda.format(pedido.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card className={PANEL}>
                        <CardHeader>
                            <CardTitle className="text-base">Stock bajo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {productosStockBajo.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                                    <CheckCircle2 className="size-6 text-emerald-500" />
                                    Ningún producto activo por debajo de 10 unidades.
                                </div>
                            ) : (
                                <ul className="flex flex-col divide-y divide-border">
                                    {productosStockBajo.map((p) => (
                                        <li
                                            key={p.sku}
                                            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <AlertTriangle
                                                    className={cn(
                                                        'size-4 shrink-0',
                                                        p.stock <= 5
                                                            ? 'text-red-500'
                                                            : 'text-amber-500',
                                                    )}
                                                    aria-hidden
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {p.nombre}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.sku}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={p.stock <= 5 ? 'destructive' : 'outline'}
                                                className="tabular-nums"
                                            >
                                                {p.stock} und.
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={PANEL}>
                        <CardHeader>
                            <CardTitle className="text-base">Descuentos activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {descuentosActivos.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No hay descuentos vigentes en este momento.
                                </p>
                            ) : (
                                <ul className="flex flex-col divide-y divide-border">
                                    {descuentosActivos.map((d) => (
                                        <li
                                            key={`${d.nombre}-${d.fechaFin}`}
                                            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <Tag
                                                    className="size-4 shrink-0 text-muted-foreground"
                                                    aria-hidden
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {d.nombre}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Vence{' '}
                                                        {formatoFechaCorta.format(
                                                            new Date(d.fechaFin),
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="tabular-nums">
                                                {d.tipo === 'porcentaje'
                                                    ? `−${formatoNumero.format(d.valor)}%`
                                                    : `−${formatoMoneda0.format(d.valor)}`}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className={PANEL}>
                    <CardHeader>
                        <CardTitle className="text-base">Equipo por rol</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BarList
                            rows={filasEquipo}
                            emptyMessage="No hay trabajadores activos registrados."
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
