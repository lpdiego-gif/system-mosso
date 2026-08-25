import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    CheckCircle2,
    Package,
    ShoppingCart,
    Tag,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatCard } from '@/components/dashboard/stat-card';
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
import { dashboard } from '@/routes';
import type { DashboardPageProps } from '@/types/dashboard';

const formatoMoneda = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
});

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const formatoFechaCorta = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });

const MEDALLAS = ['🥇', '🥈', '🥉'];

export default function Dashboard({
    stats,
    ventasPorDia,
    productosMasVendidos,
    productosStockBajo,
    pedidosRecientes,
    productosPorAnimal,
    trabajadoresPorRol,
    descuentosActivos,
}: DashboardPageProps) {
    const maxVendido = Math.max(...productosMasVendidos.map((p) => p.cantidadVendida), 1);
    const maxEquipo = Math.max(...trabajadoresPorRol.map((t) => t.total), 1);

    return (
        <>
            <Head title="Panel de Control" />

            <div className="relative flex-1 overflow-x-hidden rounded-xl bg-background p-4 dark:bg-gradient-to-br dark:from-[#150f30] dark:via-[#0b1220] dark:to-[#170c24] sm:p-6">
                <div className="pointer-events-none absolute inset-0 hidden dark:block">
                    <div className="absolute top-0 left-1/4 size-72 rounded-full bg-indigo-600/20 blur-[100px]" />
                    <div className="absolute right-0 bottom-0 size-72 rounded-full bg-fuchsia-600/10 blur-[100px]" />
                </div>

                <div className="relative flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Panel de Control</h1>
                        <p className="text-muted-foreground">
                            Resumen general de ventas, inventario y equipo de Mosso.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <StatCard
                            title="Ventas del mes"
                            value={formatoMoneda.format(stats.ventasMes)}
                            subtitle={`Hoy: ${formatoMoneda.format(stats.ventasHoy)}`}
                            icon={TrendingUp}
                            gradient="from-indigo-500 to-violet-600"
                        />
                        <StatCard
                            title="Pedidos totales"
                            value={stats.pedidosTotal.toLocaleString('es-PE')}
                            subtitle={`Ingresos totales: ${formatoMoneda.format(stats.ventasTotal)}`}
                            icon={ShoppingCart}
                            gradient="from-blue-500 to-cyan-600"
                        />
                        <StatCard
                            title="Clientes registrados"
                            value={stats.clientesTotal.toLocaleString('es-PE')}
                            subtitle="Clientes en la plataforma"
                            icon={Users}
                            gradient="from-emerald-500 to-teal-600"
                        />
                        <StatCard
                            title="Equipo activo"
                            value={`${stats.trabajadoresActivos}/${stats.trabajadoresTotal}`}
                            subtitle="Trabajadores activos"
                            icon={Briefcase}
                            gradient="from-amber-500 to-orange-600"
                            href="/trabajador"
                        />
                        <StatCard
                            title="Productos activos"
                            value={`${stats.productosActivos}/${stats.productosTotal}`}
                            subtitle="Catálogo activo"
                            icon={Package}
                            gradient="from-rose-500 to-pink-600"
                            href={route('admin.productos.index')}
                        />
                        <StatCard
                            title="Valor de inventario"
                            value={formatoMoneda.format(stats.valorInventario)}
                            subtitle={
                                stats.productosStockBajo > 0
                                    ? `${stats.productosStockBajo} con stock bajo`
                                    : 'Stock saludable'
                            }
                            icon={Wallet}
                            gradient={
                                stats.productosStockBajo > 0
                                    ? 'from-red-500 to-rose-600'
                                    : 'from-violet-500 to-fuchsia-600'
                            }
                            href={route('admin.productos.index')}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle>Ventas de los últimos 14 días</CardTitle>
                                <Badge variant="secondary">{formatoMoneda.format(stats.ventasTotal)} acumulado</Badge>
                            </CardHeader>
                            <CardContent>
                                <SalesChart data={ventasPorDia} formatoMoneda={formatoMoneda} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Catálogo por mascota</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DonutChart
                                    data={productosPorAnimal.map((p) => ({ label: p.animal, total: p.total }))}
                                    centerLabel="productos"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Productos más vendidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {productosMasVendidos.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Aún no se han registrado ventas de productos.
                                    </p>
                                ) : (
                                    <ul className="flex flex-col gap-4">
                                        {productosMasVendidos.map((p, i) => (
                                            <li key={p.nombre} className="flex items-center gap-3">
                                                <span className="w-6 shrink-0 text-center text-lg">
                                                    {MEDALLAS[i] ?? i + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <span className="truncate text-sm font-medium">{p.nombre}</span>
                                                        <span className="shrink-0 text-xs text-muted-foreground">
                                                            {formatoMoneda.format(p.totalVendido)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                                            style={{ width: `${(p.cantidadVendida / maxVendido) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                                                    {p.cantidadVendida} und.
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Stock bajo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {productosStockBajo.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
                                        <CheckCircle2 className="size-6 text-emerald-500" />
                                        No hay productos con stock bajo.
                                    </div>
                                ) : (
                                    <ul className="flex flex-col divide-y divide-border">
                                        {productosStockBajo.map((p) => (
                                            <li key={p.sku} className="flex items-center justify-between gap-3 py-2.5">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <AlertTriangle
                                                        className={
                                                            p.stock <= 5
                                                                ? 'size-4 shrink-0 text-red-500'
                                                                : 'size-4 shrink-0 text-amber-500'
                                                        }
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">{p.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={p.stock <= 5 ? 'destructive' : 'outline'}>
                                                    {p.stock} und.
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pedidos recientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pedidosRecientes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                Aún no se han registrado pedidos.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pedidosRecientes.map((pedido) => (
                                            <TableRow key={pedido.id}>
                                                <TableCell className="font-medium">#{pedido.id}</TableCell>
                                                <TableCell>{pedido.cliente}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{pedido.estado}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatoFecha.format(new Date(pedido.fecha))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatoMoneda.format(pedido.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipo por rol</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trabajadoresPorRol.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        No hay trabajadores activos registrados.
                                    </p>
                                ) : (
                                    <ul className="flex flex-col gap-4">
                                        {trabajadoresPorRol.map((t) => (
                                            <li key={t.rol}>
                                                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                                                    <span className="font-medium">{t.rol}</span>
                                                    <span className="text-muted-foreground">{t.total}</span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                        style={{ width: `${(t.total / maxEquipo) * 100}%` }}
                                                    />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Descuentos activos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {descuentosActivos.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        No hay descuentos activos en este momento.
                                    </p>
                                ) : (
                                    <ul className="flex flex-col divide-y divide-border">
                                        {descuentosActivos.map((d) => (
                                            <li key={d.nombre} className="flex items-center justify-between gap-3 py-2.5">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <Tag className="size-4 shrink-0 text-fuchsia-500" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">{d.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Vence: {formatoFechaCorta.format(new Date(d.fechaFin))}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="shrink-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white">
                                                    {d.tipo === 'porcentaje'
                                                        ? `-${d.valor}%`
                                                        : `-${formatoMoneda.format(d.valor)}`}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
