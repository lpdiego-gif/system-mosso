import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronsUpDown,
    CircleCheck,
    Layers,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    PowerOff,
    Scissors,
    Search,
    SlidersHorizontal,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { StatCard } from '@/components/dashboard/stat-card';
import { ServicioPageHeader } from '@/components/servicios/servicio-page-header';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ServicioAdminRow } from '@/types/servicio';

interface Props {
    servicios: ServicioAdminRow[];
}

type SortKey = 'negocio' | 'tipo' | 'estado';
type SortDir = 'asc' | 'desc';

const estadoBadge = (activo: boolean) =>
    activo
        ? 'border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400'
        : 'border-transparent bg-muted text-muted-foreground hover:bg-muted';

function Miniatura({ url, alt }: { url: string | null; alt: string }) {
    return (
        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-inset ring-border">
            {url ? (
                <img src={url} alt={alt} className="size-full object-cover" />
            ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground/50">
                    <Scissors className="size-4" />
                </div>
            )}
        </div>
    );
}

export default function Index({ servicios }: Props) {
    const [eliminando, setEliminando] = useState<ServicioAdminRow | null>(null);
    const [procesando, setProcesando] = useState(false);

    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState('todos');
    const [estado, setEstado] = useState('todos');
    const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
        key: 'negocio',
        dir: 'asc',
    });

    const tipos = useMemo(
        () => [...new Set(servicios.map((s) => s.tipo_servicio))].sort(),
        [servicios],
    );

    const stats = useMemo(() => {
        const activos = servicios.filter((s) => s.activo).length;

        return {
            total: servicios.length,
            activos,
            inactivos: servicios.length - activos,
            tipos: tipos.length,
        };
    }, [servicios, tipos]);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();

        const base = servicios.filter((s) => {
            if (tipo !== 'todos' && s.tipo_servicio !== tipo) {
                return false;
            }

            if (estado === 'activo' && !s.activo) {
                return false;
            }

            if (estado === 'inactivo' && s.activo) {
                return false;
            }

            if (
                q &&
                !s.nombre_negocio.toLowerCase().includes(q) &&
                !s.nombre_servicio.toLowerCase().includes(q)
            ) {
                return false;
            }

            return true;
        });

        const factor = sort.dir === 'asc' ? 1 : -1;

        return [...base].sort((a, b) => {
            if (sort.key === 'estado') {
                return (Number(a.activo) - Number(b.activo)) * factor;
            }

            const campo =
                sort.key === 'tipo' ? 'tipo_servicio' : 'nombre_negocio';

            return a[campo].localeCompare(b[campo], 'es') * factor;
        });
    }, [servicios, busqueda, tipo, estado, sort]);

    const hayFiltros =
        busqueda.trim() !== '' || tipo !== 'todos' || estado !== 'todos';

    function limpiarFiltros() {
        setBusqueda('');
        setTipo('todos');
        setEstado('todos');
    }

    function toggleSort(key: SortKey) {
        setSort((actual) =>
            actual.key === key
                ? { key, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' },
        );
    }

    function toggleEstado(valor: 'activo' | 'inactivo') {
        setEstado((actual) => (actual === valor ? 'todos' : valor));
    }

    function confirmarEliminar() {
        if (!eliminando) {
            return;
        }

        setProcesando(true);
        router.delete(route('admin.servicios.destroy', eliminando.id_servicio), {
            preserveScroll: true,
            onFinish: () => {
                setProcesando(false);
                setEliminando(null);
            },
        });
    }

    return (
        <>
            <Head title="Servicios" />

            <div className="flex w-full flex-1 flex-col gap-6 p-4 sm:p-3 lg:p-4">
                <ServicioPageHeader
                    icon={Scissors}
                    title="Servicios"
                    description="Administra los servicios (grooming, veterinaria y más) que se muestran en el Portal Web de MOSSO."
                    action={
                        <Button asChild className="gap-2">
                            <Link href={route('admin.servicios.create')}>
                                <Plus className="size-4" /> Nuevo servicio
                            </Link>
                        </Button>
                    }
                />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Servicios"
                        value={String(stats.total)}
                        subtitle="Registrados en total"
                        icon={Layers}
                        gradient="from-[#3f4146] to-[#232427]"
                    />
                    <StatCard
                        title="Activos"
                        value={String(stats.activos)}
                        subtitle="Visibles en el Portal Web"
                        icon={CircleCheck}
                        gradient="from-emerald-500 to-teal-600"
                        onClick={() => toggleEstado('activo')}
                        active={estado === 'activo'}
                    />
                    <StatCard
                        title="Inactivos"
                        value={String(stats.inactivos)}
                        subtitle="Ocultos del Portal Web"
                        icon={PowerOff}
                        gradient="from-slate-500 to-slate-600"
                        onClick={() => toggleEstado('inactivo')}
                        active={estado === 'inactivo'}
                    />
                    <StatCard
                        title="Tipos"
                        value={String(stats.tipos)}
                        subtitle="Categorías de servicio"
                        icon={Sparkles}
                        gradient="from-amber-500 to-orange-600"
                    />
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por negocio o servicio…"
                                className="pl-9"
                                aria-label="Buscar servicios"
                            />
                        </div>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger className="w-full sm:w-52">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">
                                    Todos los tipos
                                </SelectItem>
                                {tipos.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={estado} onValueChange={setEstado}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">
                                    Todos los estados
                                </SelectItem>
                                <SelectItem value="activo">Activos</SelectItem>
                                <SelectItem value="inactivo">
                                    Inactivos
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium tabular-nums text-foreground">
                                {filtrados.length}
                            </span>{' '}
                            {filtrados.length === 1 ? 'servicio' : 'servicios'}
                            {hayFiltros ? (
                                <>
                                    {' '}
                                    de{' '}
                                    <span className="tabular-nums">
                                        {servicios.length}
                                    </span>
                                </>
                            ) : null}
                        </p>
                        {hayFiltros ? (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <SlidersHorizontal className="size-3.5" />
                                Limpiar filtros
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Listado */}
                {filtrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Scissors className="size-6" />
                        </span>
                        <p className="text-pretty font-medium text-foreground">
                            {hayFiltros
                                ? 'Ningún servicio coincide con los filtros.'
                                : 'Aún no hay servicios registrados.'}
                        </p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            {hayFiltros
                                ? 'Prueba con otros términos de búsqueda o quita alguno de los filtros aplicados.'
                                : 'Crea el primer servicio para que aparezca en el Portal Web.'}
                        </p>
                        {hayFiltros ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={limpiarFiltros}
                            >
                                Limpiar filtros
                            </Button>
                        ) : (
                            <Button asChild size="sm" className="gap-2">
                                <Link href={route('admin.servicios.create')}>
                                    <Plus className="size-4" /> Crear el primero
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Tabla (md+) */}
                        <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent">
                                            <SortHeader
                                                label="Negocio y servicio"
                                                sortKey="negocio"
                                                sort={sort}
                                                onSort={toggleSort}
                                            />
                                            <SortHeader
                                                label="Tipo"
                                                sortKey="tipo"
                                                sort={sort}
                                                onSort={toggleSort}
                                            />
                                            <SortHeader
                                                label="Estado"
                                                sortKey="estado"
                                                sort={sort}
                                                onSort={toggleSort}
                                            />
                                            <TableHead className="w-12 text-right">
                                                <span className="sr-only">
                                                    Acciones
                                                </span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtrados.map((s) => (
                                            <TableRow key={s.id_servicio}>
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Miniatura
                                                            url={s.imagen}
                                                            alt={
                                                                s.nombre_servicio
                                                            }
                                                        />
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={route(
                                                                    'admin.servicios.edit',
                                                                    s.id_servicio,
                                                                )}
                                                                className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
                                                            >
                                                                {
                                                                    s.nombre_negocio
                                                                }
                                                            </Link>
                                                            <p className="truncate text-sm text-muted-foreground">
                                                                {
                                                                    s.nombre_servicio
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {s.tipo_servicio}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={estadoBadge(
                                                            s.activo,
                                                        )}
                                                    >
                                                        {s.activo
                                                            ? 'Activo'
                                                            : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <FilaAcciones
                                                        servicio={s}
                                                        onEliminar={() =>
                                                            setEliminando(s)
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Tarjetas (móvil) */}
                        <div className="flex flex-col gap-3 md:hidden">
                            {filtrados.map((s) => (
                                <div
                                    key={s.id_servicio}
                                    className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm"
                                >
                                    <Miniatura
                                        url={s.imagen}
                                        alt={s.nombre_servicio}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={route(
                                                'admin.servicios.edit',
                                                s.id_servicio,
                                            )}
                                            className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
                                        >
                                            {s.nombre_negocio}
                                        </Link>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {s.nombre_servicio}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            <Badge variant="outline">
                                                {s.tipo_servicio}
                                            </Badge>
                                            <Badge
                                                className={estadoBadge(s.activo)}
                                            >
                                                {s.activo
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <FilaAcciones
                                        servicio={s}
                                        onEliminar={() => setEliminando(s)}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <AlertDialog
                open={eliminando !== null}
                onOpenChange={(o) => !o && setEliminando(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <Trash2 className="size-4" />
                            </span>
                            ¿Eliminar servicio?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar{' '}
                            <strong className="text-foreground">
                                {eliminando?.nombre_servicio}
                            </strong>{' '}
                            de {eliminando?.nombre_negocio}. Se eliminarán también
                            sus horarios, imágenes, beneficios y redes sociales.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={procesando}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={procesando}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                            className="gap-2 bg-destructive text-white hover:bg-destructive/90"
                        >
                            {procesando && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function SortHeader({
    label,
    sortKey,
    sort,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    sort: { key: SortKey; dir: SortDir };
    onSort: (key: SortKey) => void;
}) {
    const active = sort.key === sortKey;

    return (
        <TableHead>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                aria-label={`Ordenar por ${label.toLowerCase()}`}
                className="-mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {label}
                <ChevronsUpDown
                    className={cn(
                        'size-3.5 transition-colors',
                        active
                            ? 'text-mosso-dark dark:text-mosso-yellow'
                            : 'text-muted-foreground/50',
                    )}
                />
                {active ? (
                    <span className="sr-only">
                        {sort.dir === 'asc' ? 'ascendente' : 'descendente'}
                    </span>
                ) : null}
            </button>
        </TableHead>
    );
}

function FilaAcciones({
    servicio,
    onEliminar,
}: {
    servicio: ServicioAdminRow;
    onEliminar: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    aria-label={`Acciones para ${servicio.nombre_negocio}`}
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                    <Link
                        href={route(
                            'admin.servicios.edit',
                            servicio.id_servicio,
                        )}
                    >
                        <Pencil className="mr-2 size-4" /> Editar
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={onEliminar}
                >
                    <Trash2 className="mr-2 size-4" /> Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Servicios', href: '/admin/servicios' }],
};
