import { Head, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import type { DistritoUbigeo } from '@/types/ubigeo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Landmark,
    Loader2,
    MapPinned,
    Pencil,
    Plus,
    Search,
} from 'lucide-react';

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
    ubigeo: string;
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

interface DistritoDataResponse {
    data: Distrito[];
    meta: PaginatedMeta;
}

interface PageProps {
    departamentos: Departamento[];
    provincias: Provincia[];
}

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

const formatoMoneda = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
});

export default function Distrito() {
    const { departamentos, provincias } = usePage<{ props: PageProps }>().props as unknown as PageProps;

    // ------------------------------------------------------------- listado
    const [rows, setRows] = useState<Distrito[]>([]);
    const [meta, setMeta] = useState<PaginatedMeta>({ current_page: 1, per_page: 10, total: 0, last_page: 1 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
    const [filtroProvincia, setFiltroProvincia] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

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
            .get('/distrito/data', {
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
            .then((response: { data: DistritoDataResponse }) => {
                const { data } = response;
                setRows(data.data);
                setMeta(data.meta);
            })
            .catch((err: any) => {
                if (axios.isCancel(err)) return;
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

    // ---------------------------------------------------- modal "Nuevo distrito"
    const [nuevoOpen, setNuevoOpen] = useState(false);
    const [nuevoDep, setNuevoDep] = useState('');
    const [nuevoProv, setNuevoProv] = useState('');
    const [nuevoDist, setNuevoDist] = useState('');
    const [nuevoCosto, setNuevoCosto] = useState('0.00');
    const [opcionesDistrito, setOpcionesDistrito] = useState<DistritoUbigeo[]>([]);
    const [cargandoDistritos, setCargandoDistritos] = useState(false);
    const [nuevoErrors, setNuevoErrors] = useState<Record<string, string>>({});
    const [nuevoProcesando, setNuevoProcesando] = useState(false);

    const provinciasNuevo = useMemo(
        () => (nuevoDep ? provincias.filter((p) => String(p.fk_departamento) === nuevoDep) : []),
        [provincias, nuevoDep],
    );

    function abrirNuevo() {
        setNuevoDep('');
        setNuevoProv('');
        setNuevoDist('');
        setNuevoCosto('0.00');
        setOpcionesDistrito([]);
        setNuevoErrors({});
        setNuevoOpen(true);
    }

    useEffect(() => {
        if (!nuevoProv) {
            setOpcionesDistrito([]);
            return;
        }

        setCargandoDistritos(true);
        axios
            .get<DistritoUbigeo[]>('/ubigeo/distritos', { params: { provincia: nuevoProv } })
            .then((r) => setOpcionesDistrito(r.data))
            .finally(() => setCargandoDistritos(false));
    }, [nuevoProv]);

    // Si el distrito elegido ya tenía un costo cargado, se precarga (se
    // comporta como edición; nunca se duplica una fila en `distritos`).
    function seleccionarNuevoDistrito(id: string) {
        setNuevoDist(id);
        const opcion = opcionesDistrito.find((d) => String(d.id_distrito) === id);
        setNuevoCosto(opcion?.costo_envio != null ? String(opcion.costo_envio) : '0.00');
    }

    async function handleSubmitNuevo(e: FormEvent) {
        e.preventDefault();
        setNuevoProcesando(true);
        setNuevoErrors({});

        try {
            await axios.post('/distrito', {
                id_distrito: nuevoDist,
                costo_envio: nuevoCosto,
            });
            setNuevoOpen(false);
            cargar();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setNuevoErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
            }
        } finally {
            setNuevoProcesando(false);
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

    async function handleSubmitEditar(e: FormEvent) {
        e.preventDefault();
        if (!editando) return;
        setEditProcesando(true);
        setEditErrors({});

        try {
            await axios.put(`/distrito/${editando.id_distrito}`, {
                costo_envio: editCosto,
                activo: editActivo,
            });
            setEditando(null);
            cargar();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setEditErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
            }
        } finally {
            setEditProcesando(false);
        }
    }

    // ------------------------------------------------------ switch por fila
    const [cambiandoEstado, setCambiandoEstado] = useState<number | null>(null);

    async function alternarActivo(d: Distrito) {
        setCambiandoEstado(d.id_distrito);
        try {
            await axios.patch(`/distrito/${d.id_distrito}/activo`);
            cargar();
        } catch {
            // El backend explica el motivo (ej. sin costo configurado) vía toast global si aplica.
        } finally {
            setCambiandoEstado(null);
        }
    }

    const desde = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hasta = Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <>
            <Head title="Distritos" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Encabezado */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                            <MapPinned className="h-6 w-6 text-indigo-500" />
                            Distritos
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Catálogo nacional de distritos. Activa los que tienen reparto y define su costo de envío.
                        </p>
                    </div>
                    <Button onClick={abrirNuevo} className="gap-2 self-start sm:self-auto">
                        <Plus className="h-4 w-4" /> Nuevo distrito
                    </Button>
                </div>

                {/* Métrica rápida */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Total de distritos
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{meta.total}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Departamentos
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{departamentos.length}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Provincias
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{provincias.length}</p>
                    </div>
                </div>

                {/* Filtros — automáticos, sin recargar la página */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por distrito, provincia o departamento..."
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filtroDepartamento}
                        onValueChange={(v) => {
                            setFiltroDepartamento(v);
                            setFiltroProvincia('todos');
                        }}
                    >
                        <SelectTrigger className="sm:w-52">
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
                        <SelectTrigger className="sm:w-52">
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

                    <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
                        <SelectTrigger className="sm:w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="activos">Activos</SelectItem>
                            <SelectItem value="inactivos">Inactivos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={perPage} onValueChange={setPerPage}>
                        <SelectTrigger className="sm:w-28">
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
                </div>

                {/* Tabla */}
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[60px] text-center font-semibold">N°</TableHead>
                                <TableHead className="font-semibold">Distrito</TableHead>
                                <TableHead className="font-semibold">Provincia</TableHead>
                                <TableHead className="font-semibold">Departamento</TableHead>
                                <TableHead className="font-semibold">Costo de envío</TableHead>
                                <TableHead className="font-semibold">Estado</TableHead>
                                <TableHead className="w-12 text-center font-semibold">Editar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="py-2">
                                            <div className="h-9 animate-pulse rounded-md bg-muted/60" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                        No se encontraron distritos con estos filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((d, index) => {
                                    const numero = (meta.current_page - 1) * meta.per_page + index + 1;
                                    const activo = Boolean(d.activo);

                                    return (
                                        <TableRow key={d.id_distrito} className="transition-colors hover:bg-muted/40">
                                            <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground">
                                                {numero}
                                            </TableCell>

                                            <TableCell className="font-medium text-foreground">
                                                {d.nombre}
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {d.provincia}
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className="gap-1.5 border-border/80 bg-background/50 px-2.5 py-0.5 font-normal text-foreground">
                                                    <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {d.departamento}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="font-mono text-sm font-medium text-foreground">
                                                {d.costo_envio == null ? (
                                                    <span className="font-sans text-muted-foreground">Sin configurar</span>
                                                ) : (
                                                    formatoMoneda.format(Number(d.costo_envio))
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={activo}
                                                    disabled={cambiandoEstado === d.id_distrito}
                                                    onClick={() => alternarActivo(d)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                        activo ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                                                    }`}
                                                    title={activo ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                                                >
                                                    <span
                                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                            activo ? 'translate-x-[18px]' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => abrirEditar(d)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{meta.total > 0 ? `Mostrando ${desde}–${hasta} de ${meta.total}` : 'Sin resultados'}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={meta.current_page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>
                            Página {meta.current_page} de {meta.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Modal: Nuevo distrito (activa uno existente del catálogo)    */}
            {/* ---------------------------------------------------------- */}
            <Dialog open={nuevoOpen} onOpenChange={setNuevoOpen}>
                <DialogContent className="sm:max-w-md border-border/60 bg-card p-0 shadow-lg overflow-hidden gap-0">
                    <form onSubmit={handleSubmitNuevo}>
                        <div className="border-b border-border/50 bg-muted/40 p-6 pb-4">
                            <DialogHeader className="gap-1.5">
                                <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                        <MapPinned className="h-5 w-5" />
                                    </div>
                                    Nuevo distrito
                                </DialogTitle>
                                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                    Elige un distrito del catálogo nacional y asígnale un costo de envío para activarlo.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="space-y-4 p-6">
                            {nuevoErrors.general && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{nuevoErrors.general}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Departamento</Label>
                                <Select
                                    value={nuevoDep}
                                    onValueChange={(v) => {
                                        setNuevoDep(v);
                                        setNuevoProv('');
                                        setNuevoDist('');
                                    }}
                                >
                                    <SelectTrigger className="h-9 bg-background/50 border-border/80 text-sm focus:ring-1">
                                        <SelectValue placeholder="Selecciona un departamento" />
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
                                <Label className="text-xs font-medium text-foreground/80">Provincia</Label>
                                <Select
                                    value={nuevoProv}
                                    onValueChange={(v) => {
                                        setNuevoProv(v);
                                        setNuevoDist('');
                                    }}
                                    disabled={!nuevoDep}
                                >
                                    <SelectTrigger className="h-9 bg-background/50 border-border/80 text-sm focus:ring-1">
                                        <SelectValue placeholder="Selecciona una provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinciasNuevo.map((p) => (
                                            <SelectItem key={p.id_provincia} value={String(p.id_provincia)}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Distrito</Label>
                                <Select
                                    value={nuevoDist}
                                    onValueChange={seleccionarNuevoDistrito}
                                    disabled={!nuevoProv || cargandoDistritos}
                                >
                                    <SelectTrigger className="h-9 bg-background/50 border-border/80 text-sm focus:ring-1">
                                        <SelectValue placeholder={cargandoDistritos ? 'Cargando…' : 'Selecciona un distrito'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {opcionesDistrito.map((d) => (
                                            <SelectItem key={d.id_distrito} value={String(d.id_distrito)}>
                                                {d.nombre}
                                                {d.activo ? ' (ya activo)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {nuevoErrors.id_distrito && (
                                    <p className="text-[11px] font-medium text-destructive">{nuevoErrors.id_distrito}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Costo de envío (S/)</Label>
                                <Input
                                    className="h-9 font-mono bg-background/50 border-border/80 text-sm focus:ring-1"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="999999.99"
                                    value={nuevoCosto}
                                    onChange={(e) => setNuevoCosto(e.target.value)}
                                    required
                                />
                                {nuevoErrors.costo_envio && (
                                    <p className="text-[11px] font-medium text-destructive">{nuevoErrors.costo_envio}</p>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-border/50 bg-muted/20 p-4 px-6">
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => setNuevoOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={nuevoProcesando || !nuevoDist}
                                    className="h-9 text-xs font-medium gap-2 bg-primary hover:bg-primary/90 shadow-xs"
                                >
                                    {nuevoProcesando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Activar distrito
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------------------------------------------------------- */}
            {/* Modal: Editar distrito (solo costo + activo)                 */}
            {/* ---------------------------------------------------------- */}
            <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
                <DialogContent className="sm:max-w-md border-border/60 bg-card p-0 shadow-lg overflow-hidden gap-0">
                    <form onSubmit={handleSubmitEditar}>
                        <div className="border-b border-border/50 bg-muted/40 p-6 pb-4">
                            <DialogHeader className="gap-1.5">
                                <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                        <Pencil className="h-5 w-5" />
                                    </div>
                                    Editar distrito
                                </DialogTitle>
                                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                    El departamento, la provincia y el nombre vienen del catálogo nacional y no se editan aquí.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="space-y-4 p-6">
                            {editErrors.general && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{editErrors.general}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Departamento</p>
                                    <p className="font-medium text-foreground">{editando?.departamento}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Provincia</p>
                                    <p className="font-medium text-foreground">{editando?.provincia}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Distrito</p>
                                    <p className="font-medium text-foreground">{editando?.nombre}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Costo de envío (S/)</Label>
                                <Input
                                    className="h-9 font-mono bg-background/50 border-border/80 text-sm focus:ring-1"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="999999.99"
                                    value={editCosto}
                                    onChange={(e) => setEditCosto(e.target.value)}
                                    required
                                    autoFocus
                                />
                                {editErrors.costo_envio && (
                                    <p className="text-[11px] font-medium text-destructive">{editErrors.costo_envio}</p>
                                )}
                            </div>

                            <label className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 px-3 py-2.5">
                                <span className="text-xs font-medium text-foreground/80">Distrito activo (visible en el checkout)</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={editActivo}
                                    onClick={() => setEditActivo((v) => !v)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                        editActivo ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                            editActivo ? 'translate-x-[18px]' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </label>
                        </div>

                        <div className="border-t border-border/50 bg-muted/20 p-4 px-6">
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => setEditando(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={editProcesando}
                                    className="h-9 text-xs font-medium gap-2 bg-primary hover:bg-primary/90 shadow-xs"
                                >
                                    {editProcesando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Guardar cambios
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
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
