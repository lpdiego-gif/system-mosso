import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    CircleCheck,
    Eye,
    EyeOff,
    Link as LinkIcon,
    ListTree,
    Loader2,
    Pencil,
    Plus,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                      */
/* -------------------------------------------------------------------------- */

type TipoEnlace = 'animal' | 'tipo_animal' | 'marca' | 'tipo_servicio' | 'url';

interface Menu {
    id_menu: number;
    nombre: string;
    tipo_enlace: TipoEnlace;
    fk_animal: number | null;
    fk_tipo_animal: number | null;
    url: string | null;
    icono: string | null;
    orden: number;
    destacado: boolean;
    activo: boolean;
    /** Etiqueta legible del destino, resuelta en el servidor. */
    destino: string;
}

interface MenuFiltros {
    search: string | null;
    sort: string;
    dir: 'asc' | 'desc';
    perPage: number;
}

interface OpcionAnimal {
    id_animal: number;
    nombre: string;
}

interface OpcionTipoAnimal {
    id_tipo_animal: number;
    nombre: string;
}

interface Opciones {
    tiposEnlace: TipoEnlace[];
    porPagina: number[];
    animales: OpcionAnimal[];
    tiposAnimal: OpcionTipoAnimal[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface PageProps {
    menus: Paginated<Menu>;
    filtros: MenuFiltros;
    opciones: Opciones;
}

interface MenuFormData {
    nombre: string;
    tipo_enlace: TipoEnlace;
    fk_animal: string;
    fk_tipo_animal: string;
    url: string;
    icono: string;
    orden: number;
    destacado: boolean;
    activo: boolean;
}

interface RecargaParams {
    search?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    perPage?: number;
}

/* -------------------------------------------------------------------------- */
/*  Constantes de estilo y etiquetas                                           */
/* -------------------------------------------------------------------------- */

const TIPO_ENLACE_LABEL: Record<TipoEnlace, string> = {
    animal: 'Animal',
    tipo_animal: 'Tipo de animal',
    marca: 'Marcas',
    tipo_servicio: 'Servicios',
    url: 'URL',
};

const inputBase =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#FFC527] focus:ring-2 focus:ring-[#FFC527]/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFC527] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-[#F0B400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950';

const btnGhost =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950';

const btnDanger =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF4B4B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E53E3E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B4B]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950';

/* -------------------------------------------------------------------------- */
/*  Página                                                                     */
/* -------------------------------------------------------------------------- */

export default function Index({ menus, filtros, opciones }: PageProps) {
    const [search, setSearch] = useState(filtros.search ?? '');
    const [cargando, setCargando] = useState(false);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Menu | null>(null);

    const [eliminando, setEliminando] = useState<Menu | null>(null);
    const [borrando, setBorrando] = useState(false);
    const [alternandoId, setAlternandoId] = useState<number | null>(null);

    const primeraCarga = useRef(true);

    const form = useForm<MenuFormData>({
        nombre: '',
        tipo_enlace: 'url',
        fk_animal: '',
        fk_tipo_animal: '',
        url: '',
        icono: '',
        orden: 0,
        destacado: false,
        activo: true,
    });

    /* Indicador de carga global para recargas del listado y acciones. */
    useEffect(() => {
        const detenerInicio = router.on('start', () => setCargando(true));
        const detenerFin = router.on('finish', () => setCargando(false));

        return () => {
            detenerInicio();
            detenerFin();
        };
    }, []);

    /* Búsqueda en tiempo real con debounce; ignora el primer render. */
    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;

            return;
        }

        const t = window.setTimeout(() => {
            const params: Record<string, string | number> = {
                sort: filtros.sort,
                dir: filtros.dir,
                perPage: filtros.perPage,
            };

            if (search.trim() !== '') {
                params.search = search.trim();
            }

            router.get(route('admin.menus.index'), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['menus', 'filtros'],
            });
        }, 350);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe dispararse al cambiar el texto de búsqueda
    }, [search]);

    function recargar(overrides: RecargaParams = {}) {
        const params: Record<string, string | number> = {
            sort: overrides.sort ?? filtros.sort,
            dir: overrides.dir ?? filtros.dir,
            perPage: overrides.perPage ?? filtros.perPage,
        };

        const texto = overrides.search ?? search;

        if (texto.trim() !== '') {
            params.search = texto.trim();
        }

        router.get(route('admin.menus.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['menus', 'filtros'],
        });
    }

    function ordenarPor(columna: string) {
        const dir =
            filtros.sort === columna && filtros.dir === 'asc' ? 'desc' : 'asc';

        recargar({ sort: columna, dir });
    }

    function irA(url: string) {
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['menus', 'filtros'],
            },
        );
    }

    function siguienteOrden(): number {
        if (menus.data.length === 0) {
            return menus.total + 1;
        }

        return Math.max(...menus.data.map((m) => m.orden)) + 1;
    }

    function abrirCreacion() {
        setEditando(null);
        form.clearErrors();
        form.setData({
            nombre: '',
            tipo_enlace: 'url',
            fk_animal: '',
            fk_tipo_animal: '',
            url: '',
            icono: '',
            orden: siguienteOrden(),
            destacado: false,
            activo: true,
        });
        setModalAbierto(true);
    }

    function abrirEdicion(menu: Menu) {
        setEditando(menu);
        form.clearErrors();
        form.setData({
            nombre: menu.nombre,
            tipo_enlace: menu.tipo_enlace,
            fk_animal: menu.fk_animal ? String(menu.fk_animal) : '',
            fk_tipo_animal: menu.fk_tipo_animal ? String(menu.fk_tipo_animal) : '',
            url: menu.url ?? '',
            icono: menu.icono ?? '',
            orden: menu.orden,
            destacado: menu.destacado,
            activo: menu.activo,
        });
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
        setEditando(null);
        form.reset();
        form.clearErrors();
    }

    function enviarFormulario(e: FormEvent) {
        e.preventDefault();

        const opts = {
            preserveScroll: true,
            onSuccess: () => cerrarModal(),
        };

        if (editando) {
            form.put(route('admin.menus.update', editando.id_menu), opts);
        } else {
            form.post(route('admin.menus.store'), opts);
        }
    }

    function alternarEstado(menu: Menu) {
        router.patch(
            route('admin.menus.toggle-status', menu.id_menu),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setAlternandoId(menu.id_menu),
                onFinish: () => setAlternandoId(null),
            },
        );
    }

    function confirmarEliminacion() {
        if (!eliminando) {
            return;
        }

        router.delete(route('admin.menus.destroy', eliminando.id_menu), {
            preserveScroll: true,
            onStart: () => setBorrando(true),
            onFinish: () => {
                setBorrando(false);
                setEliminando(null);
            },
        });
    }

    const buscando = filtros.search !== null && filtros.search !== '';
    const sinResultados = menus.data.length === 0;

    return (
        <>
            <Head title="Menús" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                            Menús
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Gestiona los elementos del mega menú que se muestra en
                            el Portal Web.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirCreacion}
                        className={cn(btnPrimary, 'shrink-0')}
                    >
                        <Plus className="size-4" /> Nuevo menú
                    </button>
                </div>

                {/* Barra de herramientas */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, tipo o URL…"
                            aria-label="Buscar menús"
                            className={cn(inputBase, 'pl-9', search && 'pr-9')}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Limpiar búsqueda"
                                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="por-pagina"
                            className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400"
                        >
                            Por página
                        </label>
                        <select
                            id="por-pagina"
                            value={filtros.perPage}
                            onChange={(e) =>
                                recargar({ perPage: Number(e.target.value) })
                            }
                            className={cn(inputBase, 'w-auto py-1.5')}
                        >
                            {opciones.porPagina.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Listado */}
                <div className="relative">
                    {cargando && (
                        <div
                            className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-white/60 backdrop-blur-[1px] dark:bg-slate-950/50"
                            aria-hidden="true"
                        />
                    )}

                    {sinResultados ? (
                        <EmptyState
                            buscando={buscando}
                            termino={filtros.search ?? ''}
                            onLimpiar={() => setSearch('')}
                            onCrear={abrirCreacion}
                        />
                    ) : (
                        <>
                            {/* Tabla (md+) */}
                            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
                                <div className="overflow-x-auto [scrollbar-width:thin]">
                                    <table className="w-full min-w-[860px] border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Orden"
                                                        columna="orden"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Menú"
                                                        columna="nombre"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Tipo"
                                                        columna="tipo_enlace"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    Destino
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Destacado"
                                                        columna="destacado"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3">
                                                    <SortButton
                                                        label="Estado"
                                                        columna="activo"
                                                        filtros={filtros}
                                                        onSort={ordenarPor}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {menus.data.map((menu) => (
                                                <tr
                                                    key={menu.id_menu}
                                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                >
                                                    <td className="px-4 py-3 text-slate-500 tabular-nums dark:text-slate-400">
                                                        {menu.orden}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <IconoMenu
                                                                icono={menu.icono}
                                                            />
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {menu.nombre}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge tone="slate">
                                                            {
                                                                TIPO_ENLACE_LABEL[
                                                                    menu
                                                                        .tipo_enlace
                                                                ]
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                        {menu.destino}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {menu.destacado ? (
                                                            <Badge
                                                                tone="amber"
                                                                icon={Star}
                                                            >
                                                                Destacado
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-300 dark:text-slate-600">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {menu.activo ? (
                                                            <Badge
                                                                tone="green"
                                                                icon={CircleCheck}
                                                            >
                                                                Activo
                                                            </Badge>
                                                        ) : (
                                                            <Badge tone="gray">
                                                                Inactivo
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RowActions
                                                            menu={menu}
                                                            alternando={
                                                                alternandoId ===
                                                                menu.id_menu
                                                            }
                                                            onEdit={abrirEdicion}
                                                            onToggle={
                                                                alternarEstado
                                                            }
                                                            onDelete={
                                                                setEliminando
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tarjetas (móvil) */}
                            <div className="space-y-3 md:hidden">
                                {menus.data.map((menu) => (
                                    <div
                                        key={menu.id_menu}
                                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <IconoMenu icono={menu.icono} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                        {menu.nombre}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        #{menu.orden} ·{' '}
                                                        {menu.destino}
                                                    </p>
                                                </div>
                                            </div>
                                            <RowActions
                                                menu={menu}
                                                alternando={
                                                    alternandoId === menu.id_menu
                                                }
                                                onEdit={abrirEdicion}
                                                onToggle={alternarEstado}
                                                onDelete={setEliminando}
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            <Badge tone="slate">
                                                {
                                                    TIPO_ENLACE_LABEL[
                                                        menu.tipo_enlace
                                                    ]
                                                }
                                            </Badge>
                                            {menu.destacado && (
                                                <Badge tone="amber" icon={Star}>
                                                    Destacado
                                                </Badge>
                                            )}
                                            {menu.activo ? (
                                                <Badge
                                                    tone="green"
                                                    icon={CircleCheck}
                                                >
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge tone="gray">
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Paginación */}
                {!sinResultados && (
                    <Pagination
                        menus={menus}
                        disabled={cargando}
                        onNavigate={irA}
                    />
                )}
            </div>

            {/* Modal crear / editar */}
            <Modal
                open={modalAbierto}
                onClose={cerrarModal}
                title={editando ? 'Editar menú' : 'Nuevo menú'}
                description={
                    editando
                        ? `Actualiza los datos de «${editando.nombre}».`
                        : 'Añade un elemento al mega menú del Portal Web.'
                }
                footer={
                    <>
                        <button
                            type="button"
                            onClick={cerrarModal}
                            className={btnGhost}
                            disabled={form.processing}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="menu-form"
                            className={btnPrimary}
                            disabled={form.processing}
                        >
                            {form.processing && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            {editando ? 'Guardar cambios' : 'Crear menú'}
                        </button>
                    </>
                }
            >
                <MenuForm
                    form={form}
                    opciones={opciones}
                    onSubmit={enviarFormulario}
                />
            </Modal>

            {/* Modal confirmar eliminación */}
            <Modal
                open={eliminando !== null}
                onClose={() => !borrando && setEliminando(null)}
                title="Eliminar menú"
                description="Esta acción no se puede deshacer."
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setEliminando(null)}
                            className={btnGhost}
                            disabled={borrando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmarEliminacion}
                            className={btnDanger}
                            disabled={borrando}
                        >
                            {borrando && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Eliminar
                        </button>
                    </>
                }
            >
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    ¿Seguro que deseas eliminar{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {eliminando?.nombre}
                    </span>{' '}
                    del mega menú del Portal Web?
                </p>
            </Modal>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Menús', href: '/admin/menus' }],
};

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function IconoMenu({ icono }: { icono: string | null }) {
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
            {icono && icono.trim() !== '' && icono.trim() !== '?' ? (
                <span className="leading-none">{icono}</span>
            ) : (
                <LinkIcon className="size-4 text-slate-400" />
            )}
        </span>
    );
}

function Badge({
    tone,
    icon: Icon,
    children,
}: {
    tone: 'green' | 'gray' | 'amber' | 'slate';
    icon?: ComponentType<{ className?: string }>;
    children: ReactNode;
}) {
    const tones: Record<typeof tone, string> = {
        green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30',
        gray: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-100/10',
        amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/30',
        slate: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-100/10',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                tones[tone],
            )}
        >
            {Icon && <Icon className="size-3" />}
            {children}
        </span>
    );
}

function SortButton({
    label,
    columna,
    filtros,
    onSort,
}: {
    label: string;
    columna: string;
    filtros: MenuFiltros;
    onSort: (columna: string) => void;
}) {
    const activo = filtros.sort === columna;

    return (
        <button
            type="button"
            onClick={() => onSort(columna)}
            className="group inline-flex items-center gap-1 font-medium tracking-wide uppercase transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:text-slate-900 dark:hover:text-slate-100 dark:focus-visible:text-slate-100"
        >
            {label}
            <span className="text-slate-400">
                {activo ? (
                    filtros.dir === 'asc' ? (
                        <ArrowUp className="size-3.5" />
                    ) : (
                        <ArrowDown className="size-3.5" />
                    )
                ) : (
                    <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
            </span>
        </button>
    );
}

function RowActions({
    menu,
    alternando,
    onEdit,
    onToggle,
    onDelete,
}: {
    menu: Menu;
    alternando: boolean;
    onEdit: (menu: Menu) => void;
    onToggle: (menu: Menu) => void;
    onDelete: (menu: Menu) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1">
            <ActionButton
                title="Editar menú"
                onClick={() => onEdit(menu)}
            >
                <Pencil />
            </ActionButton>
            <ActionButton
                title={menu.activo ? 'Desactivar menú' : 'Activar menú'}
                onClick={() => onToggle(menu)}
                loading={alternando}
            >
                {menu.activo ? <Eye /> : <EyeOff />}
            </ActionButton>
            <ActionButton
                title="Eliminar menú"
                tone="danger"
                onClick={() => onDelete(menu)}
            >
                <Trash2 />
            </ActionButton>
        </div>
    );
}

function ActionButton({
    title,
    onClick,
    children,
    tone = 'default',
    loading = false,
}: {
    title: string;
    onClick: () => void;
    children: ReactNode;
    tone?: 'default' | 'danger';
    loading?: boolean;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={loading}
            className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 [&_svg]:size-4 dark:focus-visible:ring-offset-slate-900',
                tone === 'danger'
                    ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-rose-400/60 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-[#FFC527]/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            )}
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : children}
        </button>
    );
}

function Pagination({
    menus,
    disabled,
    onNavigate,
}: {
    menus: Paginated<Menu>;
    disabled: boolean;
    onNavigate: (url: string) => void;
}) {
    const paginas = menus.links.slice(1, -1);

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando{' '}
                <span className="font-medium text-slate-700 tabular-nums dark:text-slate-200">
                    {menus.from ?? 0}
                </span>
                –
                <span className="font-medium text-slate-700 tabular-nums dark:text-slate-200">
                    {menus.to ?? 0}
                </span>{' '}
                de{' '}
                <span className="font-medium text-slate-700 tabular-nums dark:text-slate-200">
                    {menus.total}
                </span>
            </p>

            {menus.last_page > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={disabled || !menus.prev_page_url}
                        onClick={() =>
                            menus.prev_page_url && onNavigate(menus.prev_page_url)
                        }
                        aria-label="Página anterior"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    {paginas.map((link, i) =>
                        link.url === null ? (
                            <span
                                key={`gap-${i}`}
                                className="px-1.5 text-sm text-slate-400"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={link.label}
                                type="button"
                                disabled={disabled}
                                onClick={() => onNavigate(link.url as string)}
                                aria-current={link.active ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition-colors disabled:cursor-not-allowed',
                                    link.active
                                        ? 'bg-[#FFC527] text-slate-900'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                                )}
                            >
                                {link.label}
                            </button>
                        ),
                    )}

                    <button
                        type="button"
                        disabled={disabled || !menus.next_page_url}
                        onClick={() =>
                            menus.next_page_url && onNavigate(menus.next_page_url)
                        }
                        aria-label="Página siguiente"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

function EmptyState({
    buscando,
    termino,
    onLimpiar,
    onCrear,
}: {
    buscando: boolean;
    termino: string;
    onLimpiar: () => void;
    onCrear: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#FFC527]/15 text-[#8a6d00] ring-1 ring-inset ring-[#FFC527]/30 dark:text-[#FFC527]">
                <ListTree className="size-6" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {buscando ? 'Sin resultados' : 'Aún no hay menús'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {buscando
                    ? `No encontramos menús que coincidan con «${termino}».`
                    : 'Crea el primer elemento del mega menú del Portal Web.'}
            </p>
            <div className="mt-4">
                {buscando ? (
                    <button
                        type="button"
                        onClick={onLimpiar}
                        className={btnGhost}
                    >
                        Limpiar búsqueda
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onCrear}
                        className={btnPrimary}
                    >
                        <Plus className="size-4" /> Nuevo menú
                    </button>
                )}
            </div>
        </div>
    );
}

function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md';
}) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();

                return;
            }

            if (e.key !== 'Tab' || !panelRef.current) {
                return;
            }

            const focusables = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );

            if (focusables.length === 0) {
                return;
            }

            const primero = focusables[0];
            const ultimo = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        };

        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previo;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div
                className="animate-in fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm duration-150"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    'animate-in fade-in zoom-in-95 relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl duration-200 sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900',
                    size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg',
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]/60 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block space-y-1.5">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="ml-0.5 text-rose-500">*</span>}
                </span>
                {children}
            </label>
            {hint && !error && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {hint}
                </p>
            )}
            {error && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
                    checked
                        ? 'bg-[#FFC527]'
                        : 'bg-slate-300 dark:bg-slate-700',
                )}
            >
                <span
                    className={cn(
                        'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
                        checked ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                />
            </button>
        </div>
    );
}

function MenuForm({
    form,
    opciones,
    onSubmit,
}: {
    form: ReturnType<typeof useForm<MenuFormData>>;
    opciones: Opciones;
    onSubmit: (e: FormEvent) => void;
}) {
    const nombreRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const t = window.setTimeout(() => nombreRef.current?.focus(), 50);

        return () => window.clearTimeout(t);
    }, []);

    const { data, errors } = form;

    return (
        <form id="menu-form" onSubmit={onSubmit} className="space-y-4">
            <Field label="Nombre" required error={errors.nombre}>
                <input
                    ref={nombreRef}
                    type="text"
                    maxLength={50}
                    value={data.nombre}
                    onChange={(e) => form.setData('nombre', e.target.value)}
                    placeholder="Ej. Perros"
                    className={inputBase}
                />
            </Field>

            <Field
                label="Tipo de enlace"
                required
                error={errors.tipo_enlace}
            >
                <select
                    value={data.tipo_enlace}
                    onChange={(e) =>
                        form.setData(
                            'tipo_enlace',
                            e.target.value as TipoEnlace,
                        )
                    }
                    className={inputBase}
                >
                    {opciones.tiposEnlace.map((tipo) => (
                        <option key={tipo} value={tipo}>
                            {TIPO_ENLACE_LABEL[tipo]}
                        </option>
                    ))}
                </select>
            </Field>

            {data.tipo_enlace === 'animal' && (
                <Field label="Animal" required error={errors.fk_animal}>
                    <select
                        value={data.fk_animal}
                        onChange={(e) =>
                            form.setData('fk_animal', e.target.value)
                        }
                        className={inputBase}
                    >
                        <option value="">Selecciona un animal</option>
                        {opciones.animales.map((a) => (
                            <option key={a.id_animal} value={a.id_animal}>
                                {a.nombre}
                            </option>
                        ))}
                    </select>
                </Field>
            )}

            {data.tipo_enlace === 'tipo_animal' && (
                <Field
                    label="Tipo de animal"
                    required
                    error={errors.fk_tipo_animal}
                >
                    <select
                        value={data.fk_tipo_animal}
                        onChange={(e) =>
                            form.setData('fk_tipo_animal', e.target.value)
                        }
                        className={inputBase}
                    >
                        <option value="">Selecciona un tipo</option>
                        {opciones.tiposAnimal.map((t) => (
                            <option
                                key={t.id_tipo_animal}
                                value={t.id_tipo_animal}
                            >
                                {t.nombre}
                            </option>
                        ))}
                    </select>
                </Field>
            )}

            {data.tipo_enlace === 'url' && (
                <Field
                    label="URL"
                    required
                    error={errors.url}
                    hint="Ruta interna o enlace externo. Ej. /ofertas"
                >
                    <input
                        type="text"
                        maxLength={255}
                        value={data.url}
                        onChange={(e) => form.setData('url', e.target.value)}
                        placeholder="/ofertas"
                        className={inputBase}
                    />
                </Field>
            )}

            {(data.tipo_enlace === 'marca' ||
                data.tipo_enlace === 'tipo_servicio') && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-700">
                    Este tipo enlaza automáticamente a la sección
                    correspondiente del Portal Web; no requiere configuración
                    adicional.
                </p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Field
                    label="Icono"
                    error={errors.icono}
                    hint="Emoji o nombre de icono"
                >
                    <input
                        type="text"
                        maxLength={50}
                        value={data.icono}
                        onChange={(e) => form.setData('icono', e.target.value)}
                        placeholder="🐶"
                        className={inputBase}
                    />
                </Field>
                <Field label="Orden" required error={errors.orden}>
                    <input
                        type="number"
                        min={0}
                        max={9999}
                        value={data.orden}
                        onChange={(e) =>
                            form.setData(
                                'orden',
                                e.target.value === ''
                                    ? 0
                                    : Number(e.target.value),
                            )
                        }
                        className={inputBase}
                    />
                </Field>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <ToggleRow
                    label="Destacado"
                    description="Se resalta dentro del menú del Portal Web"
                    checked={data.destacado}
                    onChange={(v) => form.setData('destacado', v)}
                />
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <ToggleRow
                    label="Activo"
                    description="Visible para los visitantes del Portal Web"
                    checked={data.activo}
                    onChange={(v) => form.setData('activo', v)}
                />
            </div>
        </form>
    );
}
