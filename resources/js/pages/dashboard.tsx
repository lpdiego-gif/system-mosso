import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    BadgePercent,
    CheckCircle2,
    FileWarning,
    Gauge,
    ImageOff,
    PackageX,
    Receipt,
    RotateCcw,
    ShoppingBag,
    ShoppingCart,
    Tag,
    TicketPercent,
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

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const money0 = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
const nf = new Intl.NumberFormat('es-PE');
const fFechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
const fFechaCorta = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });
const fRango = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const fFechaLarga = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

/** Props que dependen del periodo — las únicas que se recargan al cambiar el rango. */
const PROPS_DEL_PERIODO = [
    'periodo',
    'stats',
    'ventasPorDia',
    'clientesPorDia',
    'ventasPorCategoria',
    'productosMasVendidos',
];

const PANEL = 'border-border bg-card';

function saludoPorHora(h: number): string {
    if (h < 12) {
        return 'Buenos días';
    }

    if (h < 19) {
        return 'Buenas tardes';
    }

    return 'Buenas noches';
}

function capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
    descuentosActivos,
    saludCatalogo,
    carritosActivos,
    programaFidelidad,
}: DashboardPageProps) {
    const { auth } = usePage().props;
    const [cargando, setCargando] = useState(false);

    const ahora = new Date();
    const primerNombre = (auth?.user?.name ?? '').trim().split(/\s+/)[0] || 'equipo';
    const saludo = `${saludoPorHora(ahora.getHours())}, ${primerNombre}`;
    const fechaHoy = capitalizar(fFechaLarga.format(ahora));

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

    const inicioRango = new Date();
    inicioRango.setDate(ahora.getDate() - (periodo - 1));
    const rangoLabel = `${fRango.format(inicioRango)} – ${fRango.format(ahora)}`;
    const contextoDelta = `vs. ${periodo} días previos`;

    // ------------------------------------------------------ derivados de gráficas
    const totalCategorias = ventasPorCategoria.reduce((acc, c) => acc + c.total, 0);
    const filasCategoria: BarRow[] = ventasPorCategoria.map((c) => ({
        id: c.categoria,
        label: c.categoria,
        value: c.total,
        valueLabel: money0.format(c.total),
        meta: totalCategorias > 0 ? `${Math.round((c.total / totalCategorias) * 100)}%` : undefined,
    }));

    const filasMasVendidos: BarRow[] = productosMasVendidos.map((p, i) => ({
        id: p.nombre,
        label: p.nombre,
        value: p.cantidadVendida,
        valueLabel: money0.format(p.totalVendido),
        meta: `${nf.format(p.cantidadVendida)} und.`,
        rank: i + 1,
    }));

    const serieTicket = ventasPorDia.map((d) => (d.pedidos > 0 ? d.total / d.pedidos : 0));
    const serieVentas = ventasPorDia.map((d) => d.total);
    const seriePedidos = ventasPorDia.map((d) => d.pedidos);

    // ------------------------------------------------------------------ atención
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
            label: 'Productos sin precio',
            hint: 'Activos en S/ 0.00',
            count: saludCatalogo.sinPrecio,
            icon: AlertTriangle,
            href: route('admin.productos.index'),
            tone: 'alert',
        },
    ];

    const todoEnOrden = tilesAtencion.every((t) => t.count === 0);
    const sinVentas = stats.pedidosTotal === 0;

    const instantanea = [
        {
            label: 'Ingresos históricos',
            value: money0.format(stats.ventasTotal),
            hint: `${nf.format(stats.pedidosTotal)} pedidos pagados`,
        },
        {
            label: 'Valor de inventario',
            value: money0.format(stats.valorInventario),
            hint: 'Precio × stock del catálogo',
        },
        {
            label: 'Catálogo activo',
            value: `${nf.format(saludCatalogo.activos)} / ${nf.format(saludCatalogo.total)}`,
            hint: 'Productos publicados',
        },
        {
            label: 'Unidades en stock',
            value: nf.format(saludCatalogo.unidades),
            hint: `${nf.format(saludCatalogo.marcas)} marcas · ${nf.format(saludCatalogo.categorias)} categorías`,
        },
    ];

    // Salud del catálogo: cada fila es "problema → cuántos → dónde arreglarlo".
    const filasSalud = [
        {
            label: 'Sin precio',
            detalle: 'Activos en S/ 0.00 — no deberían venderse así',
            valor: saludCatalogo.sinPrecio,
            icon: BadgePercent,
            grave: saludCatalogo.sinPrecio > 0,
        },
        {
            label: 'Sin imagen',
            detalle: 'Se muestran con un marcador en la tienda',
            valor: saludCatalogo.sinImagen,
            icon: ImageOff,
            grave: false,
        },
        {
            label: 'Agotados',
            detalle: 'Activos con stock en 0',
            valor: saludCatalogo.agotados,
            icon: PackageX,
            grave: saludCatalogo.agotados > 0,
        },
        {
            label: 'Stock bajo',
            detalle: `Entre 1 y 10 unidades`,
            valor: saludCatalogo.stockBajo,
            icon: AlertTriangle,
            grave: false,
        },
    ];

    return (
        <>
            <Head title="Panel de Control" />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* --------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <Gauge className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">{saludo}</h1>
                            <p className="text-sm text-muted-foreground">
                                {fechaHoy} · datos de los últimos {periodo} días ({rangoLabel})
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

                {/* --------------------------------------------- Requiere atención */}
                <section aria-label="Requiere atención" className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-foreground">Requiere atención</h2>
                        {todoEnOrden && (
                            <Badge variant="secondary" className="gap-1 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="size-3" />
                                Todo al día
                            </Badge>
                        )}
                    </div>
                    <AttentionTiles tiles={tilesAtencion} />
                </section>

                {sinVentas && (
                    <div className="flex items-start gap-3 rounded-xl border border-mosso-yellow/40 bg-mosso-yellow/[0.07] p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow text-mosso-dark">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Todavía no hay ventas registradas</p>
                            <p className="text-sm text-muted-foreground">
                                Cuando llegue el primer pedido pagado verás aquí ingresos, ticket promedio, productos
                                estrella y la tendencia diaria. Mientras tanto, la sección de catálogo ya está activa.
                            </p>
                        </div>
                    </div>
                )}

                <div
                    className={cn(
                        'flex flex-col gap-6 transition-opacity duration-200',
                        cargando && 'pointer-events-none opacity-50',
                    )}
                    aria-busy={cargando}
                >
                    {/* --------------------------------------------- KPIs del periodo */}
                    <section
                        aria-label="Indicadores del periodo"
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        <KpiCard
                            label="Ventas del periodo"
                            value={money0.format(stats.ventasPeriodo)}
                            context={contextoDelta}
                            delta={stats.ventasDelta}
                            icon={TrendingUp}
                            serie={serieVentas}
                        />
                        <KpiCard
                            label="Pedidos pagados"
                            value={nf.format(stats.pedidosPeriodo)}
                            context={contextoDelta}
                            delta={stats.pedidosDelta}
                            icon={ShoppingCart}
                            serie={seriePedidos}
                            href={route('admin.pedidos.index')}
                        />
                        <KpiCard
                            label="Ticket promedio"
                            value={money0.format(stats.ticketPromedio)}
                            context="Por pedido pagado"
                            delta={stats.ticketDelta}
                            icon={Receipt}
                            serie={serieTicket}
                        />
                        <KpiCard
                            label="Clientes nuevos"
                            value={nf.format(stats.clientesNuevos)}
                            context={`${nf.format(stats.clientesTotal)} en total`}
                            delta={stats.clientesDelta}
                            icon={UserPlus}
                            serie={clientesPorDia}
                            href={route('admin.clientes.index')}
                        />
                    </section>

                    {/* --------------------------------------------- Instantánea */}
                    <section className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-4 sm:divide-y-0">
                        {instantanea.map((r) => (
                            <div key={r.label} className="flex flex-col gap-0.5 p-4">
                                <span className="text-[11px] font-medium text-muted-foreground">{r.label}</span>
                                <span className="text-lg font-semibold text-foreground tabular-nums">{r.value}</span>
                                <span className="text-[11px] text-muted-foreground">{r.hint}</span>
                            </div>
                        ))}
                    </section>

                    {/* --------------------------------------------- Ventas + categoría */}
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className={cn('lg:col-span-2', PANEL)}>
                            <CardHeader className="flex-row items-center justify-between gap-2">
                                <CardTitle className="text-base">Ventas por día</CardTitle>
                                <span className="text-sm font-semibold text-foreground tabular-nums">
                                    {money.format(stats.ventasPeriodo)}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <SalesChart data={ventasPorDia} formatoMoneda={money} />
                            </CardContent>
                        </Card>

                        <Card className={PANEL}>
                            <CardHeader>
                                <CardTitle className="text-base">Ingresos por categoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BarList rows={filasCategoria} emptyMessage="Sin ventas por categoría en este periodo." />
                            </CardContent>
                        </Card>
                    </section>

                    {/* --------------------------------------------- Salud del catálogo */}
                    <Card className={PANEL}>
                        <CardHeader className="flex-row items-center justify-between gap-2">
                            <CardTitle className="text-base">Salud del catálogo</CardTitle>
                            <Link
                                href={route('admin.productos.index')}
                                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Ver productos
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {filasSalud.map((f) => (
                                    <div
                                        key={f.label}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg border p-3',
                                            f.grave ? 'border-destructive/30 bg-destructive/5' : 'border-border',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                                                f.grave
                                                    ? 'bg-destructive/10 text-destructive'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            <f.icon className="size-4" aria-hidden />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">{f.label}</p>
                                            <p className="truncate text-xs text-muted-foreground">{f.detalle}</p>
                                        </div>
                                        <span
                                            className={cn(
                                                'text-lg font-semibold tabular-nums',
                                                f.grave ? 'text-destructive' : 'text-foreground',
                                            )}
                                        >
                                            {nf.format(f.valor)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* --------------------------------------------- Más vendidos + mascota */}
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
                                    data={productosPorAnimal.map((p) => ({ label: p.animal, total: p.total }))}
                                    centerLabel="productos"
                                    emptyMessage="Sin productos activos clasificados."
                                />
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* --------------------------------------------- Pedidos recientes */}
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
                        <div className="overflow-x-auto">
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
                                            <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                                Aún no se han registrado pedidos.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pedidosRecientes.map((pedido) => (
                                            <TableRow key={pedido.id}>
                                                <TableCell className="pl-6 font-medium tabular-nums">
                                                    <Link
                                                        href={route('admin.pedidos.show', pedido.id)}
                                                        className="text-foreground outline-none hover:underline focus-visible:underline"
                                                    >
                                                        #{pedido.id}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="block max-w-40 truncate">{pedido.cliente}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <EstadoPedidoBadge estado={pedido.estado} estadoId={pedido.estadoId} />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {fFechaHora.format(new Date(pedido.fecha))}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right font-medium tabular-nums">
                                                    {money.format(pedido.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* --------------------------------------------- Stock bajo + descuentos */}
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
                                                        p.stock <= 5 ? 'text-destructive' : 'text-amber-500',
                                                    )}
                                                    aria-hidden
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">{p.nombre}</p>
                                                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
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
                                                <Tag className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">{d.nombre}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Vence {fFechaCorta.format(new Date(d.fechaFin))}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="tabular-nums">
                                                {d.tipo === 'porcentaje'
                                                    ? `−${nf.format(d.valor)}%`
                                                    : `−${money0.format(d.valor)}`}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* --------------------------------------------- Carritos + promociones */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card className={PANEL}>
                        <CardHeader>
                            <CardTitle className="text-base">Carritos con productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {carritosActivos.carritos === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Ningún carrito con productos en los últimos 30 días.
                                </p>
                            ) : (
                                <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
                                    <Metric valor={nf.format(carritosActivos.carritos)} label="carritos abiertos" />
                                    <Metric valor={nf.format(carritosActivos.items)} label="productos dentro" />
                                    <Metric
                                        valor={money0.format(carritosActivos.valorPotencial)}
                                        label="valor potencial"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {carritosActivos.deClientes > 0
                                            ? `${nf.format(carritosActivos.deClientes)} de clientes con cuenta`
                                            : 'todos de visitantes sin cuenta'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={PANEL}>
                        <CardHeader>
                            <CardTitle className="text-base">Promociones vigentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="flex flex-col divide-y divide-border">
                                <PromoRow
                                    icon={Tag}
                                    label="Descuentos de producto"
                                    total={programaFidelidad.descuentosVigentes}
                                    porVencer={programaFidelidad.descuentosPorVencer}
                                />
                                <PromoRow
                                    icon={TicketPercent}
                                    label="Cupones sin usar"
                                    total={programaFidelidad.cuponesVigentes}
                                    porVencer={programaFidelidad.cuponesPorVencer}
                                />
                            </ul>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Piezas auxiliares
// ---------------------------------------------------------------------------

function Metric({ valor, label }: { valor: string; label: string }) {
    return (
        <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{valor}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function PromoRow({
    icon: Icon,
    label,
    total,
    porVencer,
}: {
    icon: typeof Tag;
    label: string;
    total: number;
    porVencer: number;
}) {
    return (
        <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {porVencer > 0 && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                        {porVencer} vence pronto
                    </Badge>
                )}
                <span className="text-lg font-semibold text-foreground tabular-nums">{nf.format(total)}</span>
            </div>
        </li>
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
