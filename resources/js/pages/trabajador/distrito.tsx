import { Head, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Landmark,
    Loader2,
    MapPinned,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2,
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
    costo_envio: string | number;
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

interface FormValues {
    nombre: string;
    costo_envio: string;
    fk_departamento: string;
    fk_provincia: string;
}

const emptyForm: FormValues = {
    nombre: '',
    costo_envio: '0.00',
    fk_departamento: '',
    fk_provincia: '',
};

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
    }, [search, filtroDepartamento, filtroProvincia, page, perPage]);

    useEffect(() => {
        const t = window.setTimeout(cargar, search ? 400 : 0);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filtroDepartamento, filtroProvincia, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [search, filtroDepartamento, filtroProvincia, perPage]);

    // -------------------------------------------------------- modal crear/editar
    const [formOpen, setFormOpen] = useState(false);
    const [editando, setEditando] = useState<Distrito | null>(null);
    const [values, setValues] = useState<FormValues>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const provinciasForm = useMemo(
        () =>
            values.fk_departamento
                ? provincias.filter((p) => String(p.fk_departamento) === values.fk_departamento)
                : [],
        [provincias, values.fk_departamento],
    );

    function abrirNuevo() {
        setEditando(null);
        setValues(emptyForm);
        setErrors({});
        setFormOpen(true);
    }

    function abrirEditar(d: Distrito) {
        setEditando(d);
        setValues({
            nombre: d.nombre,
            costo_envio: String(d.costo_envio),
            fk_departamento: String(d.id_departamento),
            fk_provincia: String(d.fk_provincia),
        });
        setErrors({});
        setFormOpen(true);
    }

    function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            nombre: values.nombre,
            costo_envio: values.costo_envio,
            fk_provincia: values.fk_provincia,
        };

        try {
            if (editando) {
                await axios.put(`/distrito/${editando.id_distrito}`, payload);
            } else {
                await axios.post('/distrito', payload);
            }
            setFormOpen(false);
            cargar();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
            }
        } finally {
            setProcessing(false);
        }
    }

    // -------------------------------------------------------------- eliminar
    const [eliminando, setEliminando] = useState<Distrito | null>(null);
    const [eliminarError, setEliminarError] = useState<string | null>(null);
    const [eliminarProcesando, setEliminarProcesando] = useState(false);

    async function confirmarEliminar() {
        if (!eliminando) return;
        setEliminarProcesando(true);
        setEliminarError(null);
        try {
            await axios.delete(`/distrito/${eliminando.id_distrito}`);
            setEliminando(null);
            cargar();
        } catch (err: any) {
            const msg =
                err.response?.data?.errors?.general?.[0] ??
                'No se pudo eliminar el distrito. Intenta nuevamente.';
            setEliminarError(msg);
        } finally {
            setEliminarProcesando(false);
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
                            Administra los distritos y su costo de envío asociado a cada provincia.
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
                                <TableHead className="w-12 text-center font-semibold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="py-2">
                                            <div className="h-9 animate-pulse rounded-md bg-muted/60" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No se encontraron distritos con estos filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((d, index) => {
                                    const numero = (page - 1) * 10 + index + 1;

                                    return (
                                        <TableRow key={d.id_distrito} className="transition-colors hover:bg-muted/40">
                                            {/* Contador de Filas */}
                                            <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground">
                                                {numero}
                                            </TableCell>

                                            {/* Nombre del Distrito */}
                                            <TableCell className="font-medium text-foreground">
                                                {d.nombre}
                                            </TableCell>

                                            {/* Provincia */}
                                            <TableCell className="text-sm text-muted-foreground">
                                                {d.provincia}
                                            </TableCell>

                                            {/* Departamento */}
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1.5 border-border/80 bg-background/50 px-2.5 py-0.5 font-normal text-foreground">
                                                    <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {d.departamento}
                                                </Badge>
                                            </TableCell>

                                            {/* Costo de Envío */}
                                            <TableCell className="font-mono text-sm font-medium text-foreground">
                                                {formatoMoneda.format(Number(d.costo_envio))}
                                            </TableCell>

                                            {/* Menú de Acciones */}
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => abrirEditar(d)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => {
                                                                setEliminarError(null);
                                                                setEliminando(d);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
            {/* Modal único: crear y editar                                  */}
            {/* ---------------------------------------------------------- */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md border-border/60 bg-card p-0 shadow-lg overflow-hidden gap-0">
                    <form onSubmit={handleSubmit}>
                        {/* Cabecera del Modal con fondo sutil e ícono decorativo */}
                        <div className="border-b border-border/50 bg-muted/40 p-6 pb-4">
                            <DialogHeader className="gap-1.5">
                                <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                        <MapPinned className="h-5 w-5" />
                                    </div>
                                    {editando ? 'Editar distrito' : 'Nuevo distrito'}
                                </DialogTitle>
                                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                    {editando
                                        ? 'Actualiza el nombre, la provincia o el costo de envío.'
                                        : 'Registra un distrito y su costo de envío dentro de una provincia.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Cuerpo del Formulario */}
                        <div className="space-y-4 p-6">
                            {errors.general && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{errors.general}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Departamento</Label>
                                <Select
                                    value={values.fk_departamento}
                                    onValueChange={(v) => {
                                        set('fk_departamento', v);
                                        set('fk_provincia', '');
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
                                    value={values.fk_provincia}
                                    onValueChange={(v) => set('fk_provincia', v)}
                                    disabled={!values.fk_departamento}
                                >
                                    <SelectTrigger className="h-9 bg-background/50 border-border/80 text-sm focus:ring-1">
                                        <SelectValue placeholder="Selecciona una provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {provinciasForm.map((p) => (
                                            <SelectItem key={p.id_provincia} value={String(p.id_provincia)}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.fk_provincia && (
                                    <p className="text-[11px] font-medium text-destructive">{errors.fk_provincia}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Nombre del distrito</Label>
                                <Input
                                    className="h-9 bg-background/50 border-border/80 text-sm focus:ring-1"
                                    value={values.nombre}
                                    onChange={(e) => set('nombre', e.target.value)}
                                    maxLength={45}
                                    placeholder="Ej. Independencia"
                                    required
                                    autoFocus
                                />
                                {errors.nombre && <p className="text-[11px] font-medium text-destructive">{errors.nombre}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-foreground/80">Costo de envío (S/)</Label>
                                <Input
                                    className="h-9 font-mono bg-background/50 border-border/80 text-sm focus:ring-1"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="999999.99"
                                    value={values.costo_envio}
                                    onChange={(e) => set('costo_envio', e.target.value)}
                                    required
                                />
                                {errors.costo_envio && (
                                    <p className="text-[11px] font-medium text-destructive">{errors.costo_envio}</p>
                                )}
                            </div>
                        </div>

                        {/* Pie del Modal con separación visual limpia */}
                        <div className="border-t border-border/50 bg-muted/20 p-4 px-6">
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs"
                                    onClick={() => setFormOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                    className="h-9 text-xs font-medium gap-2 bg-primary hover:bg-primary/90 shadow-xs"
                                >
                                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {editando ? 'Guardar cambios' : 'Crear distrito'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ---------------------------------------------------------- */}
            {/* Modal de eliminación                                        */}
            {/* ---------------------------------------------------------- */}
            <AlertDialog open={eliminando !== null} onOpenChange={(o) => !o && setEliminando(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            ¿Eliminar distrito?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar <strong>{eliminando?.nombre}</strong> ({eliminando?.provincia}). Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {eliminarError && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {eliminarError}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={eliminarProcesando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={eliminarProcesando}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                            className="gap-2 bg-destructive hover:bg-destructive/90"
                        >
                            {eliminarProcesando && <Loader2 className="h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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