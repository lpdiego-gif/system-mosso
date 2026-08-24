import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import TrabajadorForm from './trabajador-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Pencil,
    Plus,
    Power,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import type {
    Departamento,
    Rol,
    TipoDocumento,
    Trabajador,
    TrabajadoresResponse,
} from '@/types/trabajador';

interface PageProps {
    roles: Rol[];
    tiposDocumento: TipoDocumento[];
    departamentos: Departamento[];
}

function iniciales(nombres: string, apellido: string) {
    return `${nombres.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

// Color determinístico por nombre, sin servicios externos.
function colorAvatar(seed: string) {
    const paleta = [
        'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return paleta[Math.abs(hash) % paleta.length];
}

export default function Trabajadores() {
    const { roles, tiposDocumento, departamentos } = usePage<{ props: PageProps }>().props as unknown as PageProps;

    const [rows, setRows] = useState<Trabajador[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0, last_page: 1 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [rol, setRol] = useState('todos');
    const [estado, setEstado] = useState('todos');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const [formOpen, setFormOpen] = useState(false);
    const [editando, setEditando] = useState<Trabajador | null>(null);

    const [confirmar, setConfirmar] = useState<{ tipo: 'estado' | 'eliminar'; trabajador: Trabajador } | null>(null);
    const [confirmando, setConfirmando] = useState(false);

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
                    rol: rol !== 'todos' ? rol : undefined,
                    estado: estado !== 'todos' ? estado : undefined,
                    page,
                    per_page: perPage,
                },
                signal: controller.signal,
            })
            .then((response: { data: TrabajadoresResponse }) => {
                const { data } = response;
                setRows(data.data);
                setMeta(data.meta);
            })
            .catch((err: any) => {
                if (axios.isCancel(err)) return;
            })
            .finally(() => setLoading(false));
    }, [search, rol, estado, page, perPage]);

    // Filtros automáticos sin recargar la página: debounce solo para el texto de búsqueda.
    useEffect(() => {
        const t = window.setTimeout(cargar, search ? 400 : 0);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, rol, estado, page, perPage]);

    // Cualquier cambio de filtro regresa a la página 1.
    useEffect(() => {
        setPage(1);
    }, [search, rol, estado, perPage]);

    function abrirNuevo() {
        setEditando(null);
        setFormOpen(true);
    }

    function abrirEditar(t: Trabajador) {
        setEditando(t);
        setFormOpen(true);
    }

    async function confirmarAccion() {
        if (!confirmar) return;
        setConfirmando(true);
        try {
            if (confirmar.tipo === 'estado') {
                await axios.patch(`/trabajador/${confirmar.trabajador.id_trabajador}/estado`);
            } else {
                await axios.delete(`/trabajador/${confirmar.trabajador.id_trabajador}`);
            }
            cargar();
        } finally {
            setConfirmando(false);
            setConfirmar(null);
        }
    }

    const desde = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hasta = Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <>
            <Head title="Trabajadores" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                            <Users className="h-6 w-6 text-indigo-500" />
                            Trabajadores
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona el personal con acceso al sistema: datos, roles y estado de la cuenta.
                        </p>
                    </div>
                    <Button onClick={abrirNuevo} className="gap-2 self-start sm:self-auto">
                        <Plus className="h-4 w-4" /> Nuevo trabajador
                    </Button>
                </div>

                {/* Filtros — automáticos, sin recargar la página */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, documento o correo..."
                            className="pl-9"
                        />
                    </div>

                    <Select value={rol} onValueChange={setRol}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los roles</SelectItem>
                            {roles.map((r) => (
                                <SelectItem key={r.id_rol} value={String(r.id_rol)}>
                                    {r.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={estado} onValueChange={setEstado}>
                        <SelectTrigger className="sm:w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="activo">Activos</SelectItem>
                            <SelectItem value="inactivo">Inactivos</SelectItem>
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
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Trabajador</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Ingreso</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}>
                                            <div className="h-10 animate-pulse rounded-md bg-muted" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                        No se encontraron trabajadores con estos filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((t) => {
                                    const nombreCompleto = `${t.nombres} ${t.apellido_paterno} ${t.apellido_materno ?? ''}`.trim();
                                    return (
                                        <TableRow key={t.id_trabajador}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${colorAvatar(nombreCompleto)}`}
                                                    >
                                                        {iniciales(t.nombres, t.apellido_paterno)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{nombreCompleto}</div>
                                                        {t.direccion && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {t.direccion}{t.distrito ? `, ${t.distrito}` : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{t.num_documento}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{t.rol}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{t.email}</div>
                                                <div className="text-xs text-muted-foreground">{t.telefono}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(t.fecha_ingreso).toLocaleDateString('es-PE')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        t.activo
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400'
                                                    }
                                                >
                                                    {t.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => abrirEditar(t)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setConfirmar({ tipo: 'estado', trabajador: t })}
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {t.activo ? 'Desactivar' : 'Activar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setConfirmar({ tipo: 'eliminar', trabajador: t })}
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
                    <span>
                        {meta.total > 0 ? `Mostrando ${desde}–${hasta} de ${meta.total}` : 'Sin resultados'}
                    </span>
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

            <TrabajadorForm
                open={formOpen}
                onOpenChange={setFormOpen}
                trabajador={editando}
                roles={roles}
                tiposDocumento={tiposDocumento}
                departamentos={departamentos}
                onSuccess={cargar}
            />

            <AlertDialog open={confirmar !== null} onOpenChange={(o) => !o && setConfirmar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmar?.tipo === 'eliminar'
                                ? '¿Eliminar trabajador?'
                                : confirmar?.trabajador.activo
                                    ? '¿Desactivar trabajador?'
                                    : '¿Activar trabajador?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmar?.tipo === 'eliminar'
                                ? 'Esta acción eliminará su cuenta de acceso al sistema de forma permanente. No se puede deshacer.'
                                : confirmar?.trabajador.activo
                                    ? 'El trabajador no podrá iniciar sesión en el sistema hasta que se reactive su cuenta.'
                                    : 'El trabajador podrá volver a iniciar sesión en el sistema.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={confirmando}
                            onClick={confirmarAccion}
                            className={confirmar?.tipo === 'eliminar' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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