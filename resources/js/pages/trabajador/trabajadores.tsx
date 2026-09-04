import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Loader2,
    Mail,
    Pencil,
    Phone,
    Plus,
    Power,
    Search,
    Trash2,
    UserRoundX,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
    Rol,
    Trabajador,
    TrabajadoresResponse,
    TrabajadorResumen,
} from '@/types/trabajador';

// ---------------------------------------------------------------------------
// Tipos y constantes
// ---------------------------------------------------------------------------

interface PageProps {
    roles: Rol[];
    resumen: TrabajadorResumen;
    misPermisos: string[];
}

interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

type FiltroEstado = 'todos' | 'activo' | 'inactivo';
type Vista = 'lista' | 'cuadricula';

const VISTA_KEY = 'trabajador:vista';

const nf = new Intl.NumberFormat('es-PE');
const fechaFmt = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function nombreCompleto(t: Trabajador) {
    return `${t.nombres} ${t.apellido_paterno} ${t.apellido_materno ?? ''}`.trim();
}

function iniciales(t: Trabajador) {
    return `${t.nombres.charAt(0)}${t.apellido_paterno.charAt(0)}`.toUpperCase();
}

function formatearFecha(iso: string) {
    const d = new Date(iso);

    return Number.isNaN(d.getTime())
        ? '—'
        : fechaFmt.format(d).replace('.', '');
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function Trabajadores() {
    const {
        roles,
        resumen: resumenInicial,
        misPermisos,
    } = usePage().props as unknown as PageProps;

    const permisos = useMemo(() => new Set(misPermisos ?? []), [misPermisos]);
    const puedeCrear = permisos.has('trabajadores.crear');
    const puedeEditar = permisos.has('trabajadores.editar');
    const puedeEliminar = permisos.has('trabajadores.eliminar');

    const [resumen, setResumen] = useState<TrabajadorResumen>(resumenInicial);

    // ------------------------------------------------------------- listado
    const [rows, setRows] = useState<Trabajador[]>([]);
    const [meta, setMeta] = useState<PaginatedMeta>({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filtroRol, setFiltroRol] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const [vista, setVista] = useState<Vista>(() => {
        try {
            const v = window.localStorage.getItem(VISTA_KEY);

            return v === 'cuadricula' || v === 'lista' ? v : 'lista';
        } catch {
            return 'lista';
        }
    });

    function cambiarVista(v: Vista) {
        setVista(v);

        try {
            window.localStorage.setItem(VISTA_KEY, v);
        } catch {
            /* sin localStorage */
        }
    }

    const abortRef = useRef<AbortController | null>(null);

    const cargar = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        axios
            .get<TrabajadoresResponse>('/trabajador/data', {
                params: {
                    search: search || undefined,
                    rol: filtroRol !== 'todos' ? filtroRol : undefined,
                    estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
                    page,
                    per_page: perPage,
                },
                signal: controller.signal,
            })
            .then(({ data }) => {
                setRows(data.data);
                setMeta(data.meta);
            })
            .catch((err: unknown) => {
                if (axios.isCancel(err)) {
                    return;
                }

                toast.error('No se pudo cargar el listado de trabajadores.');
            })
            .finally(() => setLoading(false));
    }, [search, filtroRol, filtroEstado, page, perPage]);

    useEffect(() => {
        const t = window.setTimeout(cargar, search ? 400 : 0);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filtroRol, filtroEstado, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [search, filtroRol, filtroEstado, perPage]);

    function refrescarResumen() {
        router.reload({
            only: ['resumen'],
            onSuccess: (pagina) => {
                const nuevo = (pagina.props as unknown as PageProps).resumen;

                if (nuevo) {
                    setResumen(nuevo);
                }
            },
        });
    }

    const hayFiltros =
        search !== '' || filtroRol !== 'todos' || filtroEstado !== 'todos';

    function limpiarFiltros() {
        setSearch('');
        setFiltroRol('todos');
        setFiltroEstado('todos');
    }

    // ------------------------------------------------------- acciones de fila
    const [confirmar, setConfirmar] = useState<{
        tipo: 'estado' | 'eliminar';
        trabajador: Trabajador;
    } | null>(null);
    const [procesando, setProcesando] = useState(false);

    async function ejecutarAccion() {
        if (!confirmar) {
            return;
        }

        setProcesando(true);

        try {
            if (confirmar.tipo === 'estado') {
                const { data } = await axios.patch(
                    `/trabajador/${confirmar.trabajador.id_trabajador}/estado`,
                );

                toast.success(data.message ?? 'Estado actualizado.');
            } else {
                const { data } = await axios.delete(
                    `/trabajador/${confirmar.trabajador.id_trabajador}`,
                );

                toast.success(data.message ?? 'Trabajador eliminado.');
            }

            setConfirmar(null);
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;
            const msg = res?.data?.errors?.general?.[0] ?? res?.data?.message;

            toast.error(msg ?? 'No se pudo completar la acción.');
        } finally {
            setProcesando(false);
        }
    }

    // --------------------------------------------------------------- derivados
    const desde =
        meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hasta = Math.min(meta.current_page * meta.per_page, meta.total);

    const segmentos: { clave: FiltroEstado; label: string; valor: number }[] = [
        { clave: 'todos', label: 'Todo el personal', valor: resumen.total },
        { clave: 'activo', label: 'Con acceso activo', valor: resumen.activos },
        {
            clave: 'inactivo',
            label: 'Acceso suspendido',
            valor: resumen.inactivos,
        },
    ];

    return (
        <>
            <Head title="Trabajadores" />

            <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-4 pb-16 sm:p-6">
                {/* --------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <Users className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                Trabajadores
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {nf.format(resumen.activos)} con acceso activo
                                de {nf.format(resumen.total)} registrados ·{' '}
                                {nf.format(resumen.roles)} roles
                            </p>
                        </div>
                    </div>

                    {puedeCrear && (
                        <Button
                            asChild
                            className="gap-2 self-start sm:self-auto"
                        >
                            <Link href="/trabajador/crear">
                                <Plus className="h-4 w-4" /> Nuevo trabajador
                            </Link>
                        </Button>
                    )}
                </header>

                {/* --------------------------------------------- Superficie de control */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                        {segmentos.map((seg) => {
                            const activo =
                                filtroEstado === seg.clave ||
                                (seg.clave === 'todos' &&
                                    filtroEstado === 'todos');

                            return (
                                <button
                                    key={seg.clave}
                                    type="button"
                                    aria-pressed={activo}
                                    onClick={() => setFiltroEstado(seg.clave)}
                                    className={cn(
                                        'relative flex flex-col gap-0.5 px-4 py-3.5 text-left transition-colors outline-none focus-visible:bg-accent',
                                        activo
                                            ? 'bg-accent/60'
                                            : 'hover:bg-accent/40',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute inset-x-0 top-0 h-0.5 transition-colors',
                                            activo
                                                ? 'bg-mosso-yellow'
                                                : 'bg-transparent',
                                        )}
                                    />
                                    <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                                        {nf.format(seg.valor)}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium',
                                            activo
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {seg.label}
                                    </span>
                                </button>
                            );
                        })}

                        <div className="flex flex-col gap-0.5 px-4 py-3.5">
                            <span className="text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums">
                                {nf.format(resumen.roles)}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                Roles definidos
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-border p-3 lg:flex-row lg:flex-wrap lg:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, documento o correo…"
                                className="h-9 pl-9"
                                aria-label="Buscar trabajadores"
                            />
                        </div>

                        <Select value={filtroRol} onValueChange={setFiltroRol}>
                            <SelectTrigger className="h-9 lg:w-52">
                                <SelectValue placeholder="Rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">
                                    Todos los roles
                                </SelectItem>
                                {roles.map((r) => (
                                    <SelectItem
                                        key={r.id_rol}
                                        value={String(r.id_rol)}
                                    >
                                        {r.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={perPage} onValueChange={setPerPage}>
                            <SelectTrigger className="h-9 lg:w-[7.5rem]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['10', '25', '50'].map((n) => (
                                    <SelectItem key={n} value={n}>
                                        {n} / pág.
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                            {(
                                [
                                    ['lista', List, 'Vista de lista'],
                                    [
                                        'cuadricula',
                                        LayoutGrid,
                                        'Vista de cuadrícula',
                                    ],
                                ] as const
                            ).map(([modo, Icon, etiqueta]) => (
                                <button
                                    key={modo}
                                    type="button"
                                    onClick={() => cambiarVista(modo)}
                                    aria-label={etiqueta}
                                    aria-pressed={vista === modo}
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        vista === modo
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            ))}
                        </div>

                        {hayFiltros && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={limpiarFiltros}
                                className="h-9 shrink-0 gap-1.5 text-muted-foreground"
                            >
                                <X className="h-4 w-4" /> Limpiar
                            </Button>
                        )}
                    </div>
                </section>

                {/* --------------------------------------------- Resultados */}
                {loading ? (
                    <ListaSkeleton vista={vista} />
                ) : rows.length === 0 ? (
                    <EstadoVacio
                        hayFiltros={hayFiltros}
                        onLimpiar={limpiarFiltros}
                        onNuevo={
                            puedeCrear
                                ? () => router.visit('/trabajador/crear')
                                : undefined
                        }
                    />
                ) : vista === 'lista' ? (
                    <div className="overflow-x-auto rounded-xl border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="font-medium text-muted-foreground">
                                        Trabajador
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">
                                        Documento
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">
                                        Rol
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">
                                        Contacto
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">
                                        Ingreso
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">
                                        Acceso
                                    </TableHead>
                                    <TableHead className="w-24 pr-4 text-right font-medium text-muted-foreground">
                                        <span className="sr-only">
                                            Acciones
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((t) => {
                                    const activo = Boolean(t.activo);

                                    return (
                                        <TableRow
                                            key={t.id_trabajador}
                                            className="group border-border"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar t={t} />
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-foreground">
                                                            {nombreCompleto(t)}
                                                        </div>
                                                        {t.direccion && (
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {t.direccion}
                                                                {t.distrito
                                                                    ? `, ${t.distrito}`
                                                                    : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                                                    {t.num_documento}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                                                    {t.rol}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-foreground">
                                                    {t.email}
                                                </div>
                                                <div className="text-xs text-muted-foreground tabular-nums">
                                                    {t.telefono}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                {formatearFecha(
                                                    t.fecha_ingreso,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <EstadoAcceso activo={activo} />
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <AccionesFila
                                                    trabajador={t}
                                                    activo={activo}
                                                    puedeEditar={puedeEditar}
                                                    puedeEliminar={
                                                        puedeEliminar
                                                    }
                                                    onEstado={() =>
                                                        setConfirmar({
                                                            tipo: 'estado',
                                                            trabajador: t,
                                                        })
                                                    }
                                                    onEliminar={() =>
                                                        setConfirmar({
                                                            tipo: 'eliminar',
                                                            trabajador: t,
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((t) => {
                            const activo = Boolean(t.activo);

                            return (
                                <article
                                    key={t.id_trabajador}
                                    className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar t={t} />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-medium text-foreground">
                                                {nombreCompleto(t)}
                                            </h3>
                                            <p className="truncate text-xs text-muted-foreground">
                                                <span className="font-mono tabular-nums">
                                                    {t.num_documento}
                                                </span>{' '}
                                                · {t.rol}
                                            </p>
                                        </div>
                                    </div>

                                    <dl className="space-y-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">
                                                {t.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            <span className="tabular-nums">
                                                {t.telefono || '—'}
                                            </span>
                                        </div>
                                    </dl>

                                    <div className="flex items-center justify-between border-t border-border pt-3">
                                        <EstadoAcceso activo={activo} />
                                        <AccionesFila
                                            trabajador={t}
                                            activo={activo}
                                            puedeEditar={puedeEditar}
                                            puedeEliminar={puedeEliminar}
                                            siempreVisible
                                            onEstado={() =>
                                                setConfirmar({
                                                    tipo: 'estado',
                                                    trabajador: t,
                                                })
                                            }
                                            onEliminar={() =>
                                                setConfirmar({
                                                    tipo: 'eliminar',
                                                    trabajador: t,
                                                })
                                            }
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* --------------------------------------------- Paginación */}
                {!loading && rows.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                        <span className="tabular-nums">
                            Mostrando {nf.format(desde)}–{nf.format(hasta)} de{' '}
                            {nf.format(meta.total)}
                        </span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={meta.current_page <= 1}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="tabular-nums">
                                Página {meta.current_page} de {meta.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(meta.last_page, p + 1),
                                    )
                                }
                                aria-label="Página siguiente"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* --------------------------------------------- Confirmaciones */}
            <AlertDialog
                open={confirmar !== null}
                onOpenChange={(o) => !o && setConfirmar(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmar?.tipo === 'eliminar'
                                ? `Eliminar a ${confirmar ? nombreCompleto(confirmar.trabajador) : ''}`
                                : confirmar?.trabajador.activo
                                  ? `Suspender el acceso de ${confirmar ? nombreCompleto(confirmar.trabajador) : ''}`
                                  : `Reactivar el acceso de ${confirmar ? nombreCompleto(confirmar.trabajador) : ''}`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmar?.tipo === 'eliminar'
                                ? 'Se elimina su cuenta de acceso al sistema de forma permanente. El historial de la persona se conserva. Esta acción no se puede deshacer.'
                                : confirmar?.trabajador.activo
                                  ? 'No podrá iniciar sesión hasta que se reactive su cuenta. Sus datos y su rol se conservan.'
                                  : 'Volverá a poder iniciar sesión en el sistema con su rol actual.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant={
                                confirmar?.tipo === 'eliminar'
                                    ? 'destructive'
                                    : 'default'
                            }
                            disabled={procesando}
                            onClick={(e) => {
                                e.preventDefault();
                                ejecutarAccion();
                            }}
                        >
                            {procesando && (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            )}
                            {confirmar?.tipo === 'eliminar'
                                ? 'Eliminar'
                                : confirmar?.trabajador.activo
                                  ? 'Suspender acceso'
                                  : 'Reactivar acceso'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Piezas auxiliares
// ---------------------------------------------------------------------------

function Avatar({ t }: { t: Trabajador }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground/70 ring-1 ring-border">
            {iniciales(t)}
        </div>
    );
}

function EstadoAcceso({ activo }: { activo: boolean }) {
    return (
        <span
            className={cn(
                'flex items-center gap-1.5 text-xs',
                activo ? 'text-foreground' : 'text-muted-foreground',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    activo
                        ? 'bg-mosso-yellow'
                        : 'border border-muted-foreground/50 bg-transparent',
                )}
            />
            {activo ? 'Activo' : 'Suspendido'}
        </span>
    );
}

function AccionesFila({
    trabajador,
    activo,
    puedeEditar,
    puedeEliminar,
    siempreVisible = false,
    onEstado,
    onEliminar,
}: {
    trabajador: Trabajador;
    activo: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    siempreVisible?: boolean;
    onEstado: () => void;
    onEliminar: () => void;
}) {
    if (!puedeEditar && !puedeEliminar) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex items-center justify-end gap-0.5 transition-opacity',
                siempreVisible
                    ? 'opacity-100'
                    : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:opacity-100',
            )}
        >
            {puedeEditar && (
                <>
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Editar ${nombreCompleto(trabajador)}`}
                    >
                        <Link
                            href={`/trabajador/${trabajador.id_trabajador}/editar`}
                        >
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onEstado}
                        aria-label={
                            activo
                                ? `Suspender acceso de ${nombreCompleto(trabajador)}`
                                : `Reactivar acceso de ${nombreCompleto(trabajador)}`
                        }
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                </>
            )}
            {puedeEliminar && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={onEliminar}
                    aria-label={`Eliminar ${nombreCompleto(trabajador)}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

function ListaSkeleton({ vista }: { vista: Vista }) {
    if (vista === 'cuadricula') {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[164px] rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-4 py-3.5"
                    >
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="ml-auto h-4 w-28" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function EstadoVacio({
    hayFiltros,
    onLimpiar,
    onNuevo,
}: {
    hayFiltros: boolean;
    onLimpiar: () => void;
    onNuevo?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRoundX className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                    {hayFiltros
                        ? 'Ningún trabajador coincide con estos filtros'
                        : 'Todavía no hay trabajadores'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hayFiltros
                        ? 'Prueba con otro rol o quita la búsqueda.'
                        : 'Registra al primer trabajador para darle acceso al sistema.'}
                </p>
            </div>
            {hayFiltros ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLimpiar}
                    className="mt-1 gap-1.5"
                >
                    <X className="h-4 w-4" /> Limpiar filtros
                </Button>
            ) : (
                onNuevo && (
                    <Button
                        size="sm"
                        onClick={onNuevo}
                        className="mt-1 gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Nuevo trabajador
                    </Button>
                )
            )}
        </div>
    );
}

Trabajadores.layout = {
    breadcrumbs: [
        {
            title: 'Trabajadores',
            href: '/trabajador',
        },
    ],
};
