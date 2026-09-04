import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Loader2,
    Map,
    MapPinOff,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
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

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Departamento {
    id_departamento: number;
    nombre: string;
    ubigeo: string | null;
}

interface Provincia {
    id_provincia: number;
    nombre: string;
    ubigeo: string | null;
    fk_departamento: number;
    id_departamento: number;
    departamento: string;
    distritos: number;
}

interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface Resumen {
    provincias: number;
    departamentos: number;
    distritos: number;
    sin_distritos: number;
}

interface PageProps {
    departamentos: Departamento[];
    resumen: Resumen;
}

interface ProvinciaDataResponse {
    data: Provincia[];
    meta: PaginatedMeta;
}

type FiltroDistritos = 'todos' | 'con' | 'sin';
type Vista = 'lista' | 'cuadricula';

const VISTA_KEY = 'provincia:vista';

const nf = new Intl.NumberFormat('es-PE');

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function Provincia() {
    const { departamentos, resumen, misPermisos } = usePage().props as unknown as PageProps & {
        misPermisos: string[];
    };

    const permisos = useMemo(() => new Set(misPermisos ?? []), [misPermisos]);
    const puedeCrear = permisos.has('distritos.crear');
    const puedeEditar = permisos.has('distritos.editar');
    const puedeEliminar = permisos.has('distritos.eliminar');

    // ------------------------------------------------------------- listado
    const [rows, setRows] = useState<Provincia[]>([]);
    const [meta, setMeta] = useState<PaginatedMeta>({ current_page: 1, per_page: 10, total: 0, last_page: 1 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
    const [filtroDistritos, setFiltroDistritos] = useState<FiltroDistritos>('todos');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const [vista, setVista] = useState<Vista>(() => {
        try {
            const guardada = window.localStorage.getItem(VISTA_KEY);

            return guardada === 'cuadricula' || guardada === 'lista' ? guardada : 'lista';
        } catch {
            return 'lista';
        }
    });

    function cambiarVista(v: Vista) {
        setVista(v);

        try {
            window.localStorage.setItem(VISTA_KEY, v);
        } catch {
            /* localStorage no disponible */
        }
    }

    const abortRef = useRef<AbortController | null>(null);

    const cargar = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        axios
            .get<ProvinciaDataResponse>('/provincia/data', {
                params: {
                    search: search || undefined,
                    departamento: filtroDepartamento !== 'todos' ? filtroDepartamento : undefined,
                    distritos: filtroDistritos !== 'todos' ? filtroDistritos : undefined,
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

                toast.error('No se pudo cargar el listado de provincias.');
            })
            .finally(() => setLoading(false));
    }, [search, filtroDepartamento, filtroDistritos, page, perPage]);

    useEffect(() => {
        const t = window.setTimeout(cargar, search ? 400 : 0);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filtroDepartamento, filtroDistritos, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [search, filtroDepartamento, filtroDistritos, perPage]);

    const hayFiltros = search !== '' || filtroDepartamento !== 'todos' || filtroDistritos !== 'todos';

    function limpiarFiltros() {
        setSearch('');
        setFiltroDepartamento('todos');
        setFiltroDistritos('todos');
    }

    const departamentoActivo = useMemo(
        () => departamentos.find((d) => String(d.id_departamento) === filtroDepartamento) ?? null,
        [departamentos, filtroDepartamento],
    );

    // ---------------------------------------------------- modal crear / editar
    const [formOpen, setFormOpen] = useState(false);
    const [editando, setEditando] = useState<Provincia | null>(null);
    const [formNombre, setFormNombre] = useState('');
    const [formDepartamento, setFormDepartamento] = useState('');
    const [formUbigeo, setFormUbigeo] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [guardando, setGuardando] = useState(false);

    function abrirNuevo() {
        setEditando(null);
        setFormNombre('');
        setFormDepartamento(departamentoActivo ? String(departamentoActivo.id_departamento) : '');
        setFormUbigeo('');
        setFormErrors({});
        setFormOpen(true);
    }

    function abrirEditar(p: Provincia) {
        setEditando(p);
        setFormNombre(p.nombre);
        setFormDepartamento(String(p.fk_departamento));
        setFormUbigeo(p.ubigeo ?? '');
        setFormErrors({});
        setFormOpen(true);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setGuardando(true);
        setFormErrors({});

        const payload = {
            nombre: formNombre,
            fk_departamento: formDepartamento,
            ubigeo: formUbigeo || null,
        };

        try {
            if (editando) {
                const { data } = await axios.put(`/provincia/${editando.id_provincia}`, payload);
                toast.success(data.message ?? 'Provincia actualizada.');
            } else {
                const { data } = await axios.post('/provincia', payload);
                toast.success(data.message ?? 'Provincia registrada.');
            }

            setFormOpen(false);
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<string, string[]>;

                setFormErrors(Object.fromEntries(Object.entries(backend).map(([k, v]) => [k, v[0]])));
            } else {
                toast.error('No se pudo guardar la provincia.');
            }
        } finally {
            setGuardando(false);
        }
    }

    // ------------------------------------------------------------ eliminar
    const [eliminar, setEliminar] = useState<Provincia | null>(null);
    const [eliminando, setEliminando] = useState(false);

    async function confirmarEliminar() {
        if (!eliminar) {
            return;
        }

        setEliminando(true);

        try {
            const { data } = await axios.delete(`/provincia/${eliminar.id_provincia}`);

            toast.success(data.message ?? 'Provincia eliminada.');
            setEliminar(null);
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;
            const mensaje = res?.data?.errors?.general?.[0] ?? res?.data?.message;

            toast.error(mensaje ?? 'No se pudo eliminar la provincia.');
        } finally {
            setEliminando(false);
        }
    }

    // --------------------------------------------------------------- derivados
    const desde = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hasta = Math.min(meta.current_page * meta.per_page, meta.total);

    const conDistritos = resumen.provincias - resumen.sin_distritos;

    const segmentos: { clave: FiltroDistritos; label: string; valor: number }[] = [
        { clave: 'todos', label: 'Provincias', valor: resumen.provincias },
        { clave: 'con', label: 'Con distritos', valor: conDistritos },
        { clave: 'sin', label: 'Sin distritos', valor: resumen.sin_distritos },
    ];

    const alcance = departamentoActivo
        ? `${nf.format(meta.total)} ${meta.total === 1 ? 'provincia' : 'provincias'} en ${departamentoActivo.nombre}`
        : `${nf.format(resumen.provincias)} provincias en ${resumen.departamentos} departamentos`;

    return (
        <>
            <Head title="Provincias" />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* ---------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <Map className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">Provincias</h1>
                            <p className="text-sm text-muted-foreground">{alcance}</p>
                        </div>
                    </div>

                    {puedeCrear && (
                        <Button onClick={abrirNuevo} className="gap-2 self-start sm:self-auto">
                            <Plus className="h-4 w-4" /> Nueva provincia
                        </Button>
                    )}
                </header>

                {/* ---------------------------------------------- Superficie de control */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    {/* Métricas = filtros por cantidad de distritos */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                        {segmentos.map((seg) => {
                            const activo = filtroDistritos === seg.clave;

                            return (
                                <button
                                    key={seg.clave}
                                    type="button"
                                    aria-pressed={activo}
                                    onClick={() => setFiltroDistritos(seg.clave)}
                                    className={cn(
                                        'group relative flex flex-col gap-0.5 px-4 py-3.5 text-left transition-colors outline-none',
                                        'focus-visible:bg-accent',
                                        activo ? 'bg-accent/60' : 'hover:bg-accent/40',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute inset-x-0 top-0 h-0.5 transition-colors',
                                            activo ? 'bg-mosso-yellow' : 'bg-transparent',
                                        )}
                                    />
                                    <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                                        {nf.format(seg.valor)}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium',
                                            activo ? 'text-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        {seg.label}
                                    </span>
                                </button>
                            );
                        })}

                        <div className="flex flex-col gap-0.5 px-4 py-3.5">
                            <span className="text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums">
                                {nf.format(resumen.distritos)}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">Distritos en total</span>
                        </div>
                    </div>

                    {/* Barra de búsqueda y filtros */}
                    <div className="flex flex-col gap-2.5 border-t border-border p-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por provincia, ubigeo o departamento…"
                                className="h-9 pl-9"
                                aria-label="Buscar provincias"
                            />
                        </div>

                        <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                            <SelectTrigger className="h-9 lg:w-56">
                                <SelectValue placeholder="Departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los departamentos</SelectItem>
                                {departamentos.map((d) => (
                                    <SelectItem key={d.id_departamento} value={String(d.id_departamento)}>
                                        {d.nombre}
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
                                    ['cuadricula', LayoutGrid, 'Vista de cuadrícula'],
                                ] as const
                            ).map(([modo, Icon, etiqueta]) => (
                                <button
                                    key={modo}
                                    type="button"
                                    onClick={() => cambiarVista(modo)}
                                    aria-label={etiqueta}
                                    aria-pressed={vista === modo}
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
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

                {/* ---------------------------------------------- Resultados */}
                {loading ? (
                    vista === 'lista' ? (
                        <TablaSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-[73px] rounded-xl" />
                            ))}
                        </div>
                    )
                ) : rows.length === 0 ? (
                    <EstadoVacio
                        hayFiltros={hayFiltros}
                        onLimpiar={limpiarFiltros}
                        onNuevo={puedeCrear ? abrirNuevo : undefined}
                    />
                ) : vista === 'lista' ? (
                    <div className="overflow-x-auto rounded-xl border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-14 pl-4 text-right font-medium text-muted-foreground">
                                        #
                                    </TableHead>
                                    <TableHead className="font-medium text-muted-foreground">Provincia</TableHead>
                                    <TableHead className="font-medium text-muted-foreground">Ubigeo</TableHead>
                                    <TableHead className="font-medium text-muted-foreground">Departamento</TableHead>
                                    <TableHead className="text-right font-medium text-muted-foreground">
                                        Distritos
                                    </TableHead>
                                    <TableHead className="w-24 pr-4 text-right font-medium text-muted-foreground">
                                        <span className="sr-only">Acciones</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((p, index) => (
                                    <TableRow key={p.id_provincia} className="group border-border">
                                        <TableCell className="pl-4 text-right text-xs text-muted-foreground tabular-nums">
                                            {(meta.current_page - 1) * meta.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{p.nombre}</TableCell>
                                        <TableCell>
                                            {p.ubigeo ? (
                                                <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                                                    {p.ubigeo}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/60">sin código</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{p.departamento}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {p.distritos > 0 ? (
                                                <span className="font-medium text-foreground">{p.distritos}</span>
                                            ) : (
                                                <span className="text-muted-foreground/50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    disabled={!puedeEditar}
                                                    onClick={() => abrirEditar(p)}
                                                    aria-label={`Editar ${p.nombre}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    disabled={!puedeEliminar}
                                                    onClick={() => setEliminar(p)}
                                                    aria-label={`Eliminar ${p.nombre}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((p) => (
                            <article
                                key={p.id_provincia}
                                className="group relative flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                            >
                                <div className="min-w-0">
                                    <h3 className="truncate font-medium text-foreground">{p.nombre}</h3>
                                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground tabular-nums">
                                        {p.ubigeo ?? 'sin código'} · {p.departamento}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-baseline gap-1.5">
                                    <span
                                        className={cn(
                                            'text-2xl font-semibold tracking-tight tabular-nums',
                                            p.distritos > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                                        )}
                                    >
                                        {p.distritos}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground group-hover:opacity-0 motion-reduce:group-hover:opacity-100">
                                        {p.distritos === 1 ? 'distrito' : 'distritos'}
                                    </span>
                                </div>

                                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        disabled={!puedeEditar}
                                        onClick={() => abrirEditar(p)}
                                        aria-label={`Editar ${p.nombre}`}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        disabled={!puedeEliminar}
                                        onClick={() => setEliminar(p)}
                                        aria-label={`Eliminar ${p.nombre}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* ---------------------------------------------- Paginación */}
                {!loading && rows.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                        <span className="tabular-nums">
                            Mostrando {nf.format(desde)}–{nf.format(hasta)} de {nf.format(meta.total)}
                        </span>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={meta.current_page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                                aria-label="Página siguiente"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Modal: crear / editar provincia                              */}
            {/* ------------------------------------------------------------ */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="space-y-1.5 border-b border-border p-6">
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editando ? 'Editar provincia' : 'Nueva provincia'}
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                {editando
                                    ? 'Cambia el nombre, el departamento o el código ubigeo.'
                                    : 'El nombre se guarda en mayúsculas, como el resto del catálogo.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 p-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="prov-nombre" className="text-xs font-medium text-foreground">
                                    Nombre
                                </Label>
                                <Input
                                    id="prov-nombre"
                                    className="h-9 uppercase"
                                    value={formNombre}
                                    onChange={(e) => setFormNombre(e.target.value)}
                                    placeholder="CHACHAPOYAS"
                                    maxLength={45}
                                    autoFocus
                                    required
                                    aria-invalid={Boolean(formErrors.nombre)}
                                />
                                {formErrors.nombre && (
                                    <p className="text-[11px] font-medium text-destructive">{formErrors.nombre}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground">Departamento</Label>
                                <Select value={formDepartamento} onValueChange={setFormDepartamento}>
                                    <SelectTrigger
                                        className="h-9"
                                        aria-invalid={Boolean(formErrors.fk_departamento)}
                                    >
                                        <SelectValue placeholder="Elige un departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departamentos.map((d) => (
                                            <SelectItem key={d.id_departamento} value={String(d.id_departamento)}>
                                                {d.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.fk_departamento && (
                                    <p className="text-[11px] font-medium text-destructive">
                                        {formErrors.fk_departamento}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="prov-ubigeo" className="text-xs font-medium text-foreground">
                                    Código ubigeo{' '}
                                    <span className="font-normal text-muted-foreground">— opcional</span>
                                </Label>
                                <Input
                                    id="prov-ubigeo"
                                    className="h-9 font-mono tabular-nums"
                                    value={formUbigeo}
                                    onChange={(e) => setFormUbigeo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="0101"
                                    inputMode="numeric"
                                    aria-invalid={Boolean(formErrors.ubigeo)}
                                    aria-describedby="prov-ubigeo-ayuda"
                                />
                                <p id="prov-ubigeo-ayuda" className="text-[11px] text-muted-foreground">
                                    Cuatro dígitos: los dos del departamento y los dos de la provincia.
                                </p>
                                {formErrors.ubigeo && (
                                    <p className="text-[11px] font-medium text-destructive">{formErrors.ubigeo}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-border bg-muted/30 p-4 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                onClick={() => setFormOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={guardando || !formNombre.trim() || !formDepartamento}
                                className="h-9 gap-2"
                            >
                                {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {editando ? 'Guardar cambios' : 'Registrar provincia'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ------------------------------------------------------------ */}
            {/* Confirmación de borrado                                      */}
            {/* ------------------------------------------------------------ */}
            <AlertDialog open={eliminar !== null} onOpenChange={(o) => !o && setEliminar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar {eliminar?.nombre}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {eliminar && eliminar.distritos > 0
                                ? `${eliminar.nombre} tiene ${eliminar.distritos} distrito${eliminar.distritos === 1 ? '' : 's'} asociado${eliminar.distritos === 1 ? '' : 's'}. Reasigna o elimina esos distritos antes de continuar.`
                                : 'La provincia se quita del catálogo geográfico. Esta acción no se puede deshacer.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={eliminando || (eliminar?.distritos ?? 0) > 0}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {eliminando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Eliminar
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

function TablaSkeleton() {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="ml-auto h-4 w-8" />
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
                <MapPinOff className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                    {hayFiltros ? 'Ninguna provincia coincide con estos filtros' : 'Todavía no hay provincias'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hayFiltros
                        ? 'Prueba con otro departamento o quita la búsqueda.'
                        : 'Registra la primera provincia para empezar a organizar el catálogo.'}
                </p>
            </div>
            {hayFiltros ? (
                <Button variant="outline" size="sm" onClick={onLimpiar} className="mt-1 gap-1.5">
                    <X className="h-4 w-4" /> Limpiar filtros
                </Button>
            ) : (
                onNuevo && (
                    <Button size="sm" onClick={onNuevo} className="mt-1 gap-1.5">
                        <Plus className="h-4 w-4" /> Nueva provincia
                    </Button>
                )
            )}
        </div>
    );
}

Provincia.layout = {
    breadcrumbs: [
        {
            title: 'Provincias',
            href: '/provincia',
        },
    ],
};
