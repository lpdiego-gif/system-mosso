import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Loader2,
    MapPinned,
    Pencil,
    Plus,
    Search,
    Truck,
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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { DistritoUbigeo } from '@/types/ubigeo';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Departamento {
    id_departamento: number;
    nombre: string;
}

interface Provincia {
    id_provincia: number;
    nombre: string;
    fk_departamento: number;
}

interface Distrito {
    id_distrito: number;
    nombre: string;
    ubigeo: string | null;
    costo_envio: string | number | null;
    activo: boolean | 0 | 1;
    fk_provincia: number;
    id_departamento: number;
    provincia: string;
    departamento: string;
}

interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface Resumen {
    activos: number;
    configurados: number;
    catalogo: number;
    tarifa_promedio: number;
}

interface PageProps {
    departamentos: Departamento[];
    provincias: Provincia[];
    resumen: Resumen;
}

type EstadoDistrito = 'activa' | 'pausada' | 'sin_tarifa';
type FiltroEstado = 'todos' | 'activos' | 'configurados' | 'sin_tarifa';
type Vista = 'lista' | 'cuadricula';

const VISTA_KEY = 'distrito:vista';

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
const nf = new Intl.NumberFormat('es-PE');

function estadoDe(d: Pick<Distrito, 'activo' | 'costo_envio'>): EstadoDistrito {
    if (d.costo_envio == null) {
        return 'sin_tarifa';
    }

    return d.activo ? 'activa' : 'pausada';
}

const ESTADO_META: Record<EstadoDistrito, { label: string; dot: string; text: string }> = {
    activa: { label: 'Zona activa', dot: 'bg-mosso-yellow', text: 'text-foreground' },
    pausada: { label: 'En pausa', dot: 'border border-muted-foreground/50 bg-transparent', text: 'text-muted-foreground' },
    sin_tarifa: {
        label: 'Sin tarifa',
        dot: 'border border-dashed border-muted-foreground/40 bg-transparent',
        text: 'text-muted-foreground',
    },
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function Distrito() {
    const { departamentos, provincias, resumen, misPermisos } = usePage().props as unknown as PageProps & {
        misPermisos: string[];
    };

    const permisos = useMemo(() => new Set(misPermisos ?? []), [misPermisos]);
    const puedeActivar = permisos.has('distritos.crear');
    const puedeEditar = permisos.has('distritos.editar');

    const sinTarifa = Math.max(0, resumen.catalogo - resumen.activos - resumen.configurados);

    // ------------------------------------------------------------- listado
    const [rows, setRows] = useState<Distrito[]>([]);
    const [meta, setMeta] = useState<PaginatedMeta>({ current_page: 1, per_page: 25, total: 0, last_page: 1 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
    const [filtroProvincia, setFiltroProvincia] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('25');

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

    const provinciasFiltro = useMemo(
        () =>
            filtroDepartamento === 'todos'
                ? provincias
                : provincias.filter((p) => String(p.fk_departamento) === filtroDepartamento),
        [provincias, filtroDepartamento],
    );

    const cargar = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        axios
            .get<{ data: Distrito[]; meta: PaginatedMeta }>('/distrito/data', {
                params: {
                    search: search || undefined,
                    departamento: filtroDepartamento !== 'todos' ? filtroDepartamento : undefined,
                    provincia: filtroProvincia !== 'todos' ? filtroProvincia : undefined,
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

                toast.error('No se pudo cargar el listado de distritos.');
            })
            .finally(() => setLoading(false));
    }, [search, filtroDepartamento, filtroProvincia, filtroEstado, page, perPage]);

    useEffect(() => {
        const t = window.setTimeout(cargar, search ? 400 : 0);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filtroDepartamento, filtroProvincia, filtroEstado, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [search, filtroDepartamento, filtroProvincia, filtroEstado, perPage]);

    function refrescarResumen() {
        router.reload({ only: ['resumen'] });
    }

    const hayFiltros =
        search !== '' || filtroDepartamento !== 'todos' || filtroProvincia !== 'todos' || filtroEstado !== 'todos';

    function limpiarFiltros() {
        setSearch('');
        setFiltroDepartamento('todos');
        setFiltroProvincia('todos');
        setFiltroEstado('todos');
    }

    // ------------------------------------------------------------ selección
    const [seleccion, setSeleccion] = useState<Set<number>>(new Set());

    useEffect(() => {
        setSeleccion(new Set());
    }, [search, filtroDepartamento, filtroProvincia, filtroEstado, page, perPage]);

    function alternarSeleccion(id: number) {
        setSeleccion((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    const todosSeleccionados = rows.length > 0 && rows.every((r) => seleccion.has(r.id_distrito));

    function alternarTodos() {
        setSeleccion((prev) => {
            if (rows.every((r) => prev.has(r.id_distrito))) {
                const next = new Set(prev);

                rows.forEach((r) => next.delete(r.id_distrito));

                return next;
            }

            return new Set([...prev, ...rows.map((r) => r.id_distrito)]);
        });
    }

    // ---------------------------------------------------- modal "Activar distrito"
    const [activarOpen, setActivarOpen] = useState(false);
    const [aDep, setADep] = useState('');
    const [aProv, setAProv] = useState('');
    const [aDistritos, setADistritos] = useState<Set<number>>(new Set());
    const [aCosto, setACosto] = useState('0.00');
    const [opciones, setOpciones] = useState<DistritoUbigeo[]>([]);
    const [cargandoOpciones, setCargandoOpciones] = useState(false);
    const [activarErrors, setActivarErrors] = useState<Record<string, string>>({});
    const [activando, setActivando] = useState(false);

    const provinciasActivar = useMemo(
        () => (aDep ? provincias.filter((p) => String(p.fk_departamento) === aDep) : []),
        [provincias, aDep],
    );

    function abrirActivar() {
        setADep(filtroDepartamento !== 'todos' ? filtroDepartamento : '');
        setAProv(filtroProvincia !== 'todos' ? filtroProvincia : '');
        setADistritos(new Set());
        setACosto('0.00');
        setOpciones([]);
        setActivarErrors({});
        setActivarOpen(true);
    }

    useEffect(() => {
        if (!activarOpen || !aProv) {
            setOpciones([]);

            return;
        }

        setCargandoOpciones(true);
        axios
            .get<DistritoUbigeo[]>('/ubigeo/distritos', { params: { provincia: aProv } })
            .then((r) => setOpciones(r.data))
            .catch(() => toast.error('No se pudieron cargar los distritos de esa provincia.'))
            .finally(() => setCargandoOpciones(false));
    }, [activarOpen, aProv]);

    function alternarADistrito(id: number) {
        setADistritos((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    async function handleActivar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setActivando(true);
        setActivarErrors({});

        const ids = [...aDistritos];

        try {
            if (ids.length === 1) {
                await axios.post('/distrito', { id_distrito: ids[0], costo_envio: aCosto });
            } else {
                await axios.post('/distrito/bulk/activar', { ids, costo_envio: aCosto });
            }

            toast.success(
                ids.length === 1 ? 'Distrito activado como zona de reparto.' : `${ids.length} distritos activados.`,
            );
            setActivarOpen(false);
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<string, string[]>;

                setActivarErrors(Object.fromEntries(Object.entries(backend).map(([k, v]) => [k, v[0]])));
            } else {
                toast.error('No se pudo completar la activación.');
            }
        } finally {
            setActivando(false);
        }
    }

    // -------------------------------------------------------- modal "Editar"
    const [editando, setEditando] = useState<Distrito | null>(null);
    const [editCosto, setEditCosto] = useState('0.00');
    const [editActivo, setEditActivo] = useState(true);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editProcesando, setEditProcesando] = useState(false);

    function abrirEditar(d: Distrito) {
        setEditando(d);
        setEditCosto(d.costo_envio != null ? String(d.costo_envio) : '0.00');
        setEditActivo(Boolean(d.activo));
        setEditErrors({});
    }

    async function handleEditar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!editando) {
            return;
        }

        setEditProcesando(true);
        setEditErrors({});

        try {
            await axios.put(`/distrito/${editando.id_distrito}`, { costo_envio: editCosto, activo: editActivo });
            toast.success('Distrito actualizado.');
            setEditando(null);
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<string, string[]>;

                setEditErrors(Object.fromEntries(Object.entries(backend).map(([k, v]) => [k, v[0]])));
            } else {
                toast.error('No se pudo actualizar el distrito.');
            }
        } finally {
            setEditProcesando(false);
        }
    }

    // ---------------------------------------------- confirmación de baja de cobertura
    const [confirmar, setConfirmar] = useState<{ tipo: 'fila'; distrito: Distrito } | { tipo: 'bulk'; ids: number[] } | null>(
        null,
    );
    const [confirmando, setConfirmando] = useState(false);

    async function ejecutarBaja() {
        if (!confirmar) {
            return;
        }

        setConfirmando(true);

        try {
            if (confirmar.tipo === 'fila') {
                await axios.patch(`/distrito/${confirmar.distrito.id_distrito}/activo`);
                toast.success(`${confirmar.distrito.nombre} ya no recibe envíos.`);
            } else {
                await axios.post('/distrito/bulk/desactivar', { ids: confirmar.ids });
                toast.success(`${confirmar.ids.length} distritos dados de baja.`);
                setSeleccion(new Set());
            }

            setConfirmar(null);
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;
            const msg = res?.data?.errors?.general?.[0] ?? res?.data?.message;

            toast.error(msg ?? 'No se pudo dar de baja la cobertura.');
        } finally {
            setConfirmando(false);
        }
    }

    // ------------------------------------------------ switch por fila (encender)
    const [cambiando, setCambiando] = useState<number | null>(null);

    async function encender(d: Distrito) {
        setCambiando(d.id_distrito);

        try {
            await axios.patch(`/distrito/${d.id_distrito}/activo`);
            toast.success(`${d.nombre} ya recibe envíos.`);
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;
            const msg = res?.data?.errors?.general?.[0] ?? res?.data?.message;

            toast.error(msg ?? 'No se pudo activar el distrito.');
        } finally {
            setCambiando(null);
        }
    }

    function alternarFila(d: Distrito) {
        const estado = estadoDe(d);

        if (estado === 'sin_tarifa') {
            toast.warning('Asigna una tarifa de envío antes de activar este distrito.', {
                action: { label: 'Editar', onClick: () => abrirEditar(d) },
            });

            return;
        }

        if (d.activo) {
            setConfirmar({ tipo: 'fila', distrito: d });
        } else {
            encender(d);
        }
    }

    // ------------------------------------------------------------ bulk cost
    const [bulkCosto, setBulkCosto] = useState('');
    const [bulkAplicando, setBulkAplicando] = useState<'activar' | null>(null);

    async function bulkActivar() {
        if (seleccion.size === 0) {
            return;
        }

        const costo = bulkCosto.trim();

        if (costo === '' || Number.isNaN(Number(costo)) || Number(costo) < 0) {
            toast.error('Escribe una tarifa válida para aplicar a la selección.');

            return;
        }

        setBulkAplicando('activar');

        try {
            await axios.post('/distrito/bulk/activar', { ids: [...seleccion], costo_envio: costo });
            toast.success(`${seleccion.size} distritos activados a ${money.format(Number(costo))}.`);
            setSeleccion(new Set());
            setBulkCosto('');
            refrescarResumen();
            cargar();
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;
            const msg = res?.data?.errors?.ids?.[0] ?? res?.data?.errors?.costo_envio?.[0];

            toast.error(msg ?? 'No se pudo aplicar la activación masiva.');
        } finally {
            setBulkAplicando(null);
        }
    }

    // --------------------------------------------------------------- derivados
    const desde = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hasta = Math.min(meta.current_page * meta.per_page, meta.total);

    const segmentos: { clave: FiltroEstado; label: string; valor: number }[] = [
        { clave: 'activos', label: 'Zonas activas', valor: resumen.activos },
        { clave: 'configurados', label: 'En pausa', valor: resumen.configurados },
        { clave: 'sin_tarifa', label: 'Sin tarifa', valor: sinTarifa },
    ];

    return (
        <>
            <Head title="Distritos" />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pb-24 sm:p-6">
                {/* --------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <Truck className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">Distritos</h1>
                            <p className="text-sm text-muted-foreground">
                                {nf.format(resumen.activos)} zonas de reparto activas de {nf.format(resumen.catalogo)} en
                                el catálogo nacional
                            </p>
                        </div>
                    </div>

                    {puedeActivar && (
                        <Button onClick={abrirActivar} className="gap-2 self-start sm:self-auto">
                            <Plus className="h-4 w-4" /> Activar distrito
                        </Button>
                    )}
                </header>

                {/* --------------------------------------------- Superficie de control */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                        {segmentos.map((seg) => {
                            const activo = filtroEstado === seg.clave;

                            return (
                                <button
                                    key={seg.clave}
                                    type="button"
                                    aria-pressed={activo}
                                    onClick={() => setFiltroEstado(activo ? 'todos' : seg.clave)}
                                    className={cn(
                                        'relative flex flex-col gap-0.5 px-4 py-3.5 text-left outline-none transition-colors focus-visible:bg-accent',
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
                                {resumen.tarifa_promedio > 0 ? money.format(resumen.tarifa_promedio) : '—'}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">Tarifa promedio</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-border p-3 lg:flex-row lg:flex-wrap lg:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por distrito, provincia o departamento…"
                                className="h-9 pl-9"
                                aria-label="Buscar distritos"
                            />
                        </div>

                        <Select
                            value={filtroDepartamento}
                            onValueChange={(v) => {
                                setFiltroDepartamento(v);
                                setFiltroProvincia('todos');
                            }}
                        >
                            <SelectTrigger className="h-9 lg:w-52">
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

                        <Select value={filtroProvincia} onValueChange={setFiltroProvincia}>
                            <SelectTrigger className="h-9 lg:w-48">
                                <SelectValue placeholder="Provincia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas las provincias</SelectItem>
                                {provinciasFiltro.map((p) => (
                                    <SelectItem key={p.id_provincia} value={String(p.id_provincia)}>
                                        {p.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={perPage} onValueChange={setPerPage}>
                            <SelectTrigger className="h-9 lg:w-[7.5rem]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['25', '50', '100'].map((n) => (
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

                {/* --------------------------------------------- Resultados */}
                {loading ? (
                    <ListaSkeleton vista={vista} />
                ) : rows.length === 0 ? (
                    <EstadoVacio
                        hayFiltros={hayFiltros}
                        onLimpiar={limpiarFiltros}
                        onActivar={puedeActivar ? abrirActivar : undefined}
                    />
                ) : vista === 'lista' ? (
                    <div className="overflow-x-auto rounded-xl border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    {puedeEditar && (
                                        <TableHead className="w-10 pl-4">
                                            <Checkbox
                                                checked={todosSeleccionados}
                                                onCheckedChange={alternarTodos}
                                                aria-label="Seleccionar todos los distritos de la página"
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead className="font-medium text-muted-foreground">Distrito</TableHead>
                                    <TableHead className="font-medium text-muted-foreground">Ubicación</TableHead>
                                    <TableHead className="text-right font-medium text-muted-foreground">Tarifa</TableHead>
                                    <TableHead className="font-medium text-muted-foreground">Estado</TableHead>
                                    <TableHead className="w-12 pr-4 text-right font-medium text-muted-foreground">
                                        <span className="sr-only">Editar</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((d) => {
                                    const estado = estadoDe(d);
                                    const em = ESTADO_META[estado];
                                    const marcado = seleccion.has(d.id_distrito);

                                    return (
                                        <TableRow
                                            key={d.id_distrito}
                                            data-state={marcado ? 'selected' : undefined}
                                            className="group border-border"
                                        >
                                            {puedeEditar && (
                                                <TableCell className="pl-4">
                                                    <Checkbox
                                                        checked={marcado}
                                                        onCheckedChange={() => alternarSeleccion(d.id_distrito)}
                                                        aria-label={`Seleccionar ${d.nombre}`}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="font-medium text-foreground">
                                                {d.nombre}
                                                {d.ubigeo && (
                                                    <span className="ml-2 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                                                        {d.ubigeo}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {d.provincia} · {d.departamento}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {d.costo_envio == null ? (
                                                    <span className="text-muted-foreground/50">—</span>
                                                ) : (
                                                    <span className="font-medium text-foreground">
                                                        {money.format(Number(d.costo_envio))}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <SwitchZona
                                                        estado={estado}
                                                        pendiente={cambiando === d.id_distrito}
                                                        onToggle={() => alternarFila(d)}
                                                        disabled={!puedeEditar}
                                                        label={`Cobertura de ${d.nombre}`}
                                                    />
                                                    <span className={cn('flex items-center gap-1.5 text-xs', em.text)}>
                                                        <span className={cn('h-1.5 w-1.5 rounded-full', em.dot)} />
                                                        {em.label}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100"
                                                    disabled={!puedeEditar}
                                                    onClick={() => abrirEditar(d)}
                                                    aria-label={`Editar ${d.nombre}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((d) => {
                            const estado = estadoDe(d);
                            const em = ESTADO_META[estado];
                            const marcado = seleccion.has(d.id_distrito);

                            return (
                                <article
                                    key={d.id_distrito}
                                    className={cn(
                                        'group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors',
                                        marcado ? 'border-foreground/30' : 'border-border hover:border-foreground/20',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {puedeEditar && (
                                                    <Checkbox
                                                        checked={marcado}
                                                        onCheckedChange={() => alternarSeleccion(d.id_distrito)}
                                                        aria-label={`Seleccionar ${d.nombre}`}
                                                    />
                                                )}
                                                <h3 className="truncate font-medium text-foreground">{d.nombre}</h3>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {d.provincia} · {d.departamento}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-right text-base font-semibold text-foreground tabular-nums">
                                            {d.costo_envio == null ? (
                                                <span className="text-sm font-normal text-muted-foreground/50">
                                                    sin tarifa
                                                </span>
                                            ) : (
                                                money.format(Number(d.costo_envio))
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={cn('flex items-center gap-1.5 text-xs', em.text)}>
                                            <span className={cn('h-1.5 w-1.5 rounded-full', em.dot)} />
                                            {em.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <SwitchZona
                                                estado={estado}
                                                pendiente={cambiando === d.id_distrito}
                                                onToggle={() => alternarFila(d)}
                                                disabled={!puedeEditar}
                                                label={`Cobertura de ${d.nombre}`}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                disabled={!puedeEditar}
                                                onClick={() => abrirEditar(d)}
                                                aria-label={`Editar ${d.nombre}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
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

            {/* --------------------------------------------- Barra de selección */}
            {puedeEditar && seleccion.size > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
                    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-lg sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-semibold text-background tabular-nums">
                                {seleccion.size}
                            </span>
                            <span className="text-muted-foreground">
                                {seleccion.size === 1 ? 'distrito seleccionado' : 'distritos seleccionados'}
                            </span>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    S/
                                </span>
                                <Input
                                    value={bulkCosto}
                                    onChange={(e) => setBulkCosto(e.target.value.replace(/[^\d.]/g, ''))}
                                    inputMode="decimal"
                                    placeholder="Tarifa común"
                                    aria-label="Tarifa común para la selección"
                                    className="h-9 w-32 pl-7 font-mono tabular-nums"
                                />
                            </div>
                            {puedeActivar && (
                                <Button size="sm" className="h-9 gap-1.5" disabled={bulkAplicando !== null} onClick={bulkActivar}>
                                    {bulkAplicando === 'activar' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Activar {seleccion.size}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => setConfirmar({ tipo: 'bulk', ids: [...seleccion] })}
                            >
                                Dar de baja
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => setSeleccion(new Set())}
                                aria-label="Cancelar selección"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --------------------------------------------- Modal: Activar distrito */}
            <Dialog open={activarOpen} onOpenChange={setActivarOpen}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                    <form onSubmit={handleActivar}>
                        <DialogHeader className="space-y-1.5 border-b border-border p-6">
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                Activar zona de reparto
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                Elige uno o varios distritos del catálogo y asígnales una tarifa de envío. Quedan visibles
                                en el checkout de inmediato.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-foreground">Departamento</Label>
                                    <Select
                                        value={aDep}
                                        onValueChange={(v) => {
                                            setADep(v);
                                            setAProv('');
                                            setADistritos(new Set());
                                        }}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Elige" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departamentos.map((d) => (
                                                <SelectItem key={d.id_departamento} value={String(d.id_departamento)}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-foreground">Provincia</Label>
                                    <Select
                                        value={aProv}
                                        onValueChange={(v) => {
                                            setAProv(v);
                                            setADistritos(new Set());
                                        }}
                                        disabled={!aDep}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Elige" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinciasActivar.map((p) => (
                                                <SelectItem key={p.id_provincia} value={String(p.id_provincia)}>
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-foreground">Distritos</Label>
                                    {opciones.length > 0 && (
                                        <button
                                            type="button"
                                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setADistritos((prev) =>
                                                    prev.size === opciones.length
                                                        ? new Set()
                                                        : new Set(opciones.map((o) => o.id_distrito)),
                                                )
                                            }
                                        >
                                            {aDistritos.size === opciones.length ? 'Quitar todos' : 'Todos'}
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
                                    {!aProv ? (
                                        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                                            Elige una provincia para ver sus distritos.
                                        </p>
                                    ) : cargandoOpciones ? (
                                        <p className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando distritos…
                                        </p>
                                    ) : opciones.length === 0 ? (
                                        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                                            Esta provincia no tiene distritos en el catálogo.
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-border">
                                            {opciones.map((o) => {
                                                const yaActivo = Boolean(o.activo);

                                                return (
                                                    <li key={o.id_distrito}>
                                                        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent/40">
                                                            <Checkbox
                                                                checked={aDistritos.has(o.id_distrito)}
                                                                onCheckedChange={() => alternarADistrito(o.id_distrito)}
                                                            />
                                                            <span className="flex-1 text-foreground">{o.nombre}</span>
                                                            {yaActivo && (
                                                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-mosso-yellow" />
                                                                    activo · {money.format(Number(o.costo_envio ?? 0))}
                                                                </span>
                                                            )}
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                                {activarErrors.ids && (
                                    <p className="text-[11px] font-medium text-destructive">{activarErrors.ids}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="activar-costo" className="text-xs font-medium text-foreground">
                                    Tarifa de envío por distrito
                                </Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        S/
                                    </span>
                                    <Input
                                        id="activar-costo"
                                        className="h-9 pl-8 font-mono tabular-nums"
                                        inputMode="decimal"
                                        value={aCosto}
                                        onChange={(e) => setACosto(e.target.value.replace(/[^\d.]/g, ''))}
                                        onBlur={() => setACosto(normalizaMonto(aCosto))}
                                        required
                                        aria-invalid={Boolean(activarErrors.costo_envio)}
                                    />
                                </div>
                                {activarErrors.costo_envio ? (
                                    <p className="text-[11px] font-medium text-destructive">{activarErrors.costo_envio}</p>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">
                                        Usa <span className="font-mono">0.00</span> para envío gratis. Se aplica la misma
                                        tarifa a todos los distritos elegidos.
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="items-center gap-2 border-t border-border bg-muted/30 p-4 sm:justify-between sm:gap-2">
                            <span className="text-xs text-muted-foreground">
                                {aDistritos.size > 0
                                    ? `${aDistritos.size} ${aDistritos.size === 1 ? 'distrito' : 'distritos'} · ${money.format(Number(aCosto) || 0)} c/u`
                                    : 'Ningún distrito elegido'}
                            </span>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setActivarOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm" className="h-9 gap-2" disabled={activando || aDistritos.size === 0}>
                                    {activando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Activar {aDistritos.size > 0 ? aDistritos.size : ''}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --------------------------------------------- Modal: Editar */}
            <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <form onSubmit={handleEditar}>
                        <DialogHeader className="space-y-1.5 border-b border-border p-6">
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editando?.nombre}
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                {editando?.provincia} · {editando?.departamento}. El nombre y la ubicación vienen del
                                catálogo nacional y no se editan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 p-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-costo" className="text-xs font-medium text-foreground">
                                    Tarifa de envío
                                </Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        S/
                                    </span>
                                    <Input
                                        id="edit-costo"
                                        className="h-9 pl-8 font-mono tabular-nums"
                                        inputMode="decimal"
                                        value={editCosto}
                                        onChange={(e) => setEditCosto(e.target.value.replace(/[^\d.]/g, ''))}
                                        onBlur={() => setEditCosto(normalizaMonto(editCosto))}
                                        required
                                        autoFocus
                                        aria-invalid={Boolean(editErrors.costo_envio)}
                                    />
                                </div>
                                {editErrors.costo_envio && (
                                    <p className="text-[11px] font-medium text-destructive">{editErrors.costo_envio}</p>
                                )}
                            </div>

                            <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                                <span>
                                    <span className="block text-xs font-medium text-foreground">Zona activa</span>
                                    <span className="block text-[11px] text-muted-foreground">
                                        Visible como opción de envío en el checkout.
                                    </span>
                                </span>
                                <SwitchZona
                                    estado={editActivo ? 'activa' : 'pausada'}
                                    pendiente={false}
                                    onToggle={() => setEditActivo((v) => !v)}
                                    disabled={false}
                                    label="Zona activa"
                                />
                            </label>

                            {editando && Boolean(editando.activo) && !editActivo && (
                                <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] text-destructive">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    Al guardar, los clientes de {editando.nombre} dejarán de ver el envío a domicilio en el
                                    checkout.
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 border-t border-border bg-muted/30 p-4 sm:gap-2">
                            <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setEditando(null)}>
                                Cancelar
                            </Button>
                            <Button type="submit" size="sm" className="h-9 gap-2" disabled={editProcesando}>
                                {editProcesando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Guardar cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --------------------------------------------- Confirmar baja de cobertura */}
            <AlertDialog open={confirmar !== null} onOpenChange={(o) => !o && setConfirmar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmar?.tipo === 'bulk'
                                ? `Dar de baja ${confirmar.ids.length} distritos`
                                : `Dar de baja ${confirmar?.tipo === 'fila' ? confirmar.distrito.nombre : ''}`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmar?.tipo === 'bulk'
                                ? 'Los clientes de esos distritos dejarán de ver el envío a domicilio en el checkout. La tarifa se conserva y puedes reactivarlos cuando quieras.'
                                : 'Los clientes de este distrito dejarán de ver el envío a domicilio en el checkout. La tarifa se conserva y puedes reactivarlo con un clic.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={confirmando}
                            onClick={(e) => {
                                e.preventDefault();
                                ejecutarBaja();
                            }}
                        >
                            {confirmando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Dar de baja
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

function normalizaMonto(v: string): string {
    const n = Number(v);

    return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : '0.00';
}

function SwitchZona({
    estado,
    pendiente,
    onToggle,
    disabled,
    label,
}: {
    estado: EstadoDistrito;
    pendiente: boolean;
    onToggle: () => void;
    disabled: boolean;
    label: string;
}) {
    const encendido = estado === 'activa';
    const bloqueado = estado === 'sin_tarifa';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={encendido}
            aria-label={label}
            disabled={disabled || pendiente}
            onClick={onToggle}
            title={bloqueado ? 'Asigna una tarifa para activar este distrito' : undefined}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
                encendido ? 'bg-mosso-yellow' : bloqueado ? 'bg-muted' : 'bg-muted-foreground/30',
            )}
        >
            <span
                className={cn(
                    'inline-flex h-3.5 w-3.5 transform items-center justify-center rounded-full bg-white shadow transition-transform motion-reduce:transition-none',
                    encendido ? 'translate-x-[18px]' : 'translate-x-1',
                )}
            >
                {pendiente && <Loader2 className="h-2.5 w-2.5 animate-spin text-mosso-dark" />}
            </span>
        </button>
    );
}

function ListaSkeleton({ vista }: { vista: Vista }) {
    if (vista === 'cuadricula') {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[104px] rounded-xl" />
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
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="ml-auto h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function EstadoVacio({
    hayFiltros,
    onLimpiar,
    onActivar,
}: {
    hayFiltros: boolean;
    onLimpiar: () => void;
    onActivar?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPinned className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                    {hayFiltros ? 'Ningún distrito coincide con estos filtros' : 'Aún no hay zonas de reparto'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {hayFiltros
                        ? 'Prueba con otra provincia o cambia el estado.'
                        : 'Activa el primer distrito para empezar a ofrecer envío a domicilio.'}
                </p>
            </div>
            {hayFiltros ? (
                <Button variant="outline" size="sm" onClick={onLimpiar} className="mt-1 gap-1.5">
                    <X className="h-4 w-4" /> Limpiar filtros
                </Button>
            ) : (
                onActivar && (
                    <Button size="sm" onClick={onActivar} className="mt-1 gap-1.5">
                        <Plus className="h-4 w-4" /> Activar distrito
                    </Button>
                )
            )}
        </div>
    );
}

Distrito.layout = {
    breadcrumbs: [
        {
            title: 'Distritos',
            href: '/distrito',
        },
    ],
};
