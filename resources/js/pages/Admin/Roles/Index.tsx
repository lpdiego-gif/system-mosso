import { Head, router, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    Check,
    ChevronDown,
    Crown,
    FolderGit2,
    LayoutGrid,
    Loader2,
    Lock,
    MapPin,
    Minus,
    Package,
    Scissors,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    UserRound,
    Users,
    Warehouse,
    X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Fragment, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                      */
/* -------------------------------------------------------------------------- */

interface RolItem {
    id_rol: number;
    nombre: string;
    descripcion: string | null;
    es_super_admin: boolean;
}

interface PermisoItem {
    id_permiso: number;
    clave: string;
    descripcion: string | null;
}

interface PageProps {
    roles: RolItem[];
    permisos: PermisoItem[];
    asignaciones: Record<string, number[]>;
}

interface ModuloGrupo {
    clave: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    permisos: PermisoItem[];
}

/* -------------------------------------------------------------------------- */
/*  Catálogo visual de módulos y roles                                         */
/* -------------------------------------------------------------------------- */

/**
 * Solo módulos operativos/delegables. Roles y Permisos, Menú del portal,
 * Menú de Mi Cuenta y Funciones no aparecen aquí a propósito: son
 * exclusivos del Super Administrador (`EnsureSuperAdmin`) y ya no tienen
 * fila en `permisos` — nunca se delegan a los demás roles.
 */
const MODULOS_INFO: Record<string, { label: string; icon: ComponentType<{ className?: string }> }> = {
    dashboard: { label: 'Panel de control', icon: LayoutGrid },
    productos: { label: 'Productos', icon: Package },
    clientes: { label: 'Clientes', icon: Users },
    servicios: { label: 'Servicios', icon: Scissors },
    empresa: { label: 'Empresa', icon: Building2 },
    trabajadores: { label: 'Trabajadores', icon: FolderGit2 },
    distritos: { label: 'Departamentos y distritos', icon: MapPin },
};

const MODULO_ORDEN = [
    'dashboard',
    'productos',
    'clientes',
    'servicios',
    'empresa',
    'trabajadores',
    'distritos',
];

interface EstiloRol {
    icon: ComponentType<{ className?: string }>;
    gradient: string;
}

const ROLE_STYLES: Record<string, EstiloRol> = {
    Administrador: { icon: Crown, gradient: 'from-amber-400 to-orange-500' },
    Vendedor: { icon: ShoppingBag, gradient: 'from-sky-400 to-blue-500' },
    Almacenero: { icon: Warehouse, gradient: 'from-emerald-400 to-teal-500' },
    Cliente: { icon: UserRound, gradient: 'from-rose-400 to-pink-500' },
};

const ROLE_STYLE_DEFAULT: EstiloRol = { icon: ShieldCheck, gradient: 'from-slate-400 to-slate-500' };

function estiloDeRol(nombre: string): EstiloRol {
    return ROLE_STYLES[nombre] ?? ROLE_STYLE_DEFAULT;
}

function agruparPorModulo(permisos: PermisoItem[]): ModuloGrupo[] {
    const mapa = new Map<string, ModuloGrupo>();

    for (const permiso of permisos) {
        const claveModulo = permiso.clave.split('.')[0] || permiso.clave;

        if (!mapa.has(claveModulo)) {
            const info = MODULOS_INFO[claveModulo] ?? { label: claveModulo, icon: Boxes };
            mapa.set(claveModulo, {
                clave: claveModulo,
                label: info.label,
                icon: info.icon,
                permisos: [],
            });
        }

        mapa.get(claveModulo)!.permisos.push(permiso);
    }

    return Array.from(mapa.values()).sort((a, b) => {
        const ia = MODULO_ORDEN.indexOf(a.clave);
        const ib = MODULO_ORDEN.indexOf(b.clave);

        if (ia === -1 && ib === -1) return a.label.localeCompare(b.label);
        if (ia === -1) return 1;
        if (ib === -1) return -1;

        return ia - ib;
    });
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                     */
/* -------------------------------------------------------------------------- */

export default function Index({ roles, permisos, asignaciones }: PageProps) {
    const { misPermisos, esSuperAdmin } = usePage().props;
    const misPermisosSet = useMemo(() => new Set(misPermisos ?? []), [misPermisos]);

    /**
     * Delegación con techo: quien no es Super Administrador (típicamente
     * «Administrador» gestionando a su equipo) solo puede OTORGAR permisos
     * que él mismo ya tiene. Quitar un permiso siempre se permite — nunca es
     * una escalada — así que el techo solo aplica al conceder, no al
     * revocar (ver `estaAsignado`/`alternarPermiso`/`alternarModuloParaRol`).
     */
    function puedoOtorgar(clave: string) {
        return esSuperAdmin || misPermisosSet.has(clave);
    }

    const [search, setSearch] = useState('');
    const [colapsados, setColapsados] = useState<Set<string>>(new Set());
    const [celdasPendientes, setCeldasPendientes] = useState<Set<string>>(new Set());
    const [modulosPendientes, setModulosPendientes] = useState<Set<string>>(new Set());

    const asignadosPorRol = useMemo(() => {
        const mapa = new Map<number, Set<number>>();

        for (const rol of roles) {
            const ids = asignaciones[String(rol.id_rol)] ?? [];
            mapa.set(rol.id_rol, new Set(ids));
        }

        return mapa;
    }, [asignaciones, roles]);

    const permisosFiltrados = useMemo(() => {
        const termino = search.trim().toLowerCase();

        if (termino === '') {
            return permisos;
        }

        return permisos.filter(
            (p) =>
                p.clave.toLowerCase().includes(termino) ||
                (p.descripcion ?? '').toLowerCase().includes(termino),
        );
    }, [permisos, search]);

    const modulos = useMemo(() => agruparPorModulo(permisosFiltrados), [permisosFiltrados]);

    const totalAsignaciones = useMemo(
        () => Array.from(asignadosPorRol.values()).reduce((acc, set) => acc + set.size, 0),
        [asignadosPorRol],
    );

    function estaAsignado(rol: RolItem, idPermiso: number) {
        return rol.es_super_admin || (asignadosPorRol.get(rol.id_rol)?.has(idPermiso) ?? false);
    }

    function alternarModulo(clave: string) {
        setColapsados((prev) => {
            const next = new Set(prev);
            if (next.has(clave)) {
                next.delete(clave);
            } else {
                next.add(clave);
            }
            return next;
        });
    }

    function alternarPermiso(rol: RolItem, permiso: PermisoItem) {
        if (rol.es_super_admin) {
            return;
        }

        const yaAsignado = estaAsignado(rol, permiso.id_permiso);

        if (!yaAsignado && !puedoOtorgar(permiso.clave)) {
            return;
        }

        const key = `${rol.id_rol}:${permiso.id_permiso}`;

        router.patch(
            route('admin.roles.permisos.toggle', [rol.id_rol, permiso.id_permiso]),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['roles', 'permisos', 'asignaciones'],
                onStart: () => setCeldasPendientes((prev) => new Set(prev).add(key)),
                onFinish: () =>
                    setCeldasPendientes((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    }),
            },
        );
    }

    function estadoModulo(modulo: ModuloGrupo, rol: RolItem): 'all' | 'partial' | 'none' {
        if (rol.es_super_admin) return 'all';

        const asignados = asignadosPorRol.get(rol.id_rol) ?? new Set<number>();
        const total = modulo.permisos.filter((p) => asignados.has(p.id_permiso)).length;

        if (total === 0) return 'none';
        if (total === modulo.permisos.length) return 'all';

        return 'partial';
    }

    function alternarModuloParaRol(modulo: ModuloGrupo, rol: RolItem) {
        if (rol.es_super_admin) {
            return;
        }

        const key = `${modulo.clave}:${rol.id_rol}`;
        const actuales = asignadosPorRol.get(rol.id_rol) ?? new Set<number>();
        const marcarTodo = estadoModulo(modulo, rol) !== 'all';

        const nuevoSet = new Set(actuales);
        for (const permiso of modulo.permisos) {
            if (marcarTodo) {
                if (puedoOtorgar(permiso.clave)) {
                    nuevoSet.add(permiso.id_permiso);
                }
            } else {
                nuevoSet.delete(permiso.id_permiso);
            }
        }

        router.patch(
            route('admin.roles.permisos.sync', rol.id_rol),
            { permisos: Array.from(nuevoSet) },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['roles', 'permisos', 'asignaciones'],
                onStart: () => setModulosPendientes((prev) => new Set(prev).add(key)),
                onFinish: () =>
                    setModulosPendientes((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    }),
            },
        );
    }

    const sinResultados = modulos.length === 0;

    return (
        <>
            <Head title="Roles y Permisos" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-sm sm:p-8">
                    <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[#FFC527]/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-rose-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#FFC527] ring-1 ring-inset ring-white/10">
                                <Sparkles className="size-3.5" />
                                Control de acceso
                            </span>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                Roles y Permisos
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-slate-300">
                                Define exactamente qué puede hacer cada rol dentro del sistema.
                                Los cambios se guardan al instante, sin necesidad de un botón «Guardar».
                                {esSuperAdmin
                                    ? ' Menú del portal, Menú de Mi Cuenta y Funciones son exclusivos tuyos y no aparecen en esta matriz.'
                                    : ' Solo puedes otorgar permisos que tú mismo ya tienes — el candado gris en una celda significa que no puedes concedértelo a tu equipo; siempre puedes quitarles uno, aunque no lo tengas.'}
                            </p>
                        </div>

                        <div className="flex gap-6">
                            <HeroStat valor={roles.length} etiqueta="Roles" />
                            <HeroStat valor={permisos.length} etiqueta="Permisos" />
                            <HeroStat valor={totalAsignaciones} etiqueta="Asignaciones activas" />
                        </div>
                    </div>
                </div>

                {/* Tarjetas de rol */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {roles.map((rol) => (
                        <RoleCard
                            key={rol.id_rol}
                            rol={rol}
                            total={permisos.length}
                            asignados={rol.es_super_admin ? permisos.length : (asignadosPorRol.get(rol.id_rol)?.size ?? 0)}
                        />
                    ))}
                </div>

                {/* Buscador */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar permiso por clave o descripción…"
                            aria-label="Buscar permisos"
                            className={cn(
                                'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#FFC527] focus:ring-2 focus:ring-[#FFC527]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
                                search && 'pr-9',
                            )}
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

                    <div className="flex flex-wrap items-center gap-3">
                        {roles.map((rol) => {
                            const estilo = estiloDeRol(rol.nombre);
                            return (
                                <span
                                    key={rol.id_rol}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
                                >
                                    <span
                                        className={cn(
                                            'flex size-4 items-center justify-center rounded-md bg-gradient-to-br text-white',
                                            estilo.gradient,
                                        )}
                                    >
                                        <estilo.icon className="size-2.5" />
                                    </span>
                                    {rol.nombre}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Matriz de permisos */}
                {sinResultados ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#FFC527]/15 text-[#8a6d00] ring-1 ring-inset ring-[#FFC527]/30 dark:text-[#FFC527]">
                            <Search className="size-6" />
                        </span>
                        <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Sin resultados
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            No encontramos permisos que coincidan con «{search}».
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto [scrollbar-width:thin]">
                            <table className="w-full min-w-[760px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                        <th className="px-4 py-3">Permiso</th>
                                        {roles.map((rol) => {
                                            const estilo = estiloDeRol(rol.nombre);
                                            return (
                                                <th key={rol.id_rol} className="min-w-[112px] px-3 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span
                                                            className={cn(
                                                                'flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                                                                estilo.gradient,
                                                            )}
                                                        >
                                                            <estilo.icon className="size-3.5" />
                                                        </span>
                                                        <span className="text-[11px] font-semibold tracking-normal text-slate-700 normal-case dark:text-slate-200">
                                                            {rol.nombre}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {modulos.map((modulo) => {
                                        const colapsado = colapsados.has(modulo.clave);
                                        const ModuloIcon = modulo.icon;

                                        return (
                                            <Fragment key={modulo.clave}>
                                                <tr className="bg-slate-50/80 dark:bg-slate-950/30">
                                                    <td className="px-4 py-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => alternarModulo(modulo.clave)}
                                                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50"
                                                        >
                                                            <ChevronDown
                                                                className={cn(
                                                                    'size-4 text-slate-400 transition-transform',
                                                                    colapsado && '-rotate-90',
                                                                )}
                                                            />
                                                            <span className="flex size-6 items-center justify-center rounded-md bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                <ModuloIcon className="size-3.5" />
                                                            </span>
                                                            {modulo.label}
                                                            <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                {modulo.permisos.length}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    {roles.map((rol) => (
                                                        <td key={rol.id_rol} className="px-3 py-2.5 text-center">
                                                            <ModuloBulkToggle
                                                                estado={estadoModulo(modulo, rol)}
                                                                bloqueado={rol.es_super_admin}
                                                                pendiente={modulosPendientes.has(
                                                                    `${modulo.clave}:${rol.id_rol}`,
                                                                )}
                                                                etiqueta={
                                                                    rol.es_super_admin
                                                                        ? `${rol.nombre} siempre tiene acceso completo`
                                                                        : `Alternar todos los permisos de ${modulo.label} para ${rol.nombre}`
                                                                }
                                                                onClick={() => alternarModuloParaRol(modulo, rol)}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>

                                                {!colapsado &&
                                                    modulo.permisos.map((permiso) => (
                                                        <tr
                                                            key={permiso.id_permiso}
                                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                        >
                                                            <td className="px-4 py-2.5 pl-12">
                                                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                                                    {permiso.descripcion ?? permiso.clave}
                                                                </p>
                                                                <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                                                    {permiso.clave}
                                                                </p>
                                                            </td>
                                                            {roles.map((rol) => {
                                                                const asignado = estaAsignado(rol, permiso.id_permiso);
                                                                const bloqueo: 'super_admin' | 'sin_techo' | null = rol.es_super_admin
                                                                    ? 'super_admin'
                                                                    : !asignado && !puedoOtorgar(permiso.clave)
                                                                      ? 'sin_techo'
                                                                      : null;

                                                                return (
                                                                    <td key={rol.id_rol} className="px-3 py-2.5 text-center">
                                                                        <CellSwitch
                                                                            checked={asignado}
                                                                            bloqueo={bloqueo}
                                                                            pendiente={celdasPendientes.has(
                                                                                `${rol.id_rol}:${permiso.id_permiso}`,
                                                                            )}
                                                                            etiqueta={
                                                                                bloqueo === 'super_admin'
                                                                                    ? `${rol.nombre} siempre tiene acceso completo`
                                                                                    : bloqueo === 'sin_techo'
                                                                                      ? `No puedes otorgar ${permiso.clave}: tú mismo no tienes ese permiso`
                                                                                      : `${permiso.clave} para ${rol.nombre}`
                                                                            }
                                                                            onClick={() => alternarPermiso(rol, permiso)}
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Roles y Permisos', href: '/admin/roles' }],
};

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function HeroStat({ valor, etiqueta }: { valor: number; etiqueta: string }) {
    return (
        <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-white">{valor}</p>
            <p className="text-xs text-slate-400">{etiqueta}</p>
        </div>
    );
}

function RoleCard({ rol, total, asignados }: { rol: RolItem; total: number; asignados: number }) {
    const estilo = estiloDeRol(rol.nombre);
    const porcentaje = total > 0 ? Math.round((asignados / total) * 100) : 0;

    return (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div
                className={cn(
                    'pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-30',
                    estilo.gradient,
                )}
            />
            <div className="relative flex items-start gap-3">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                        estilo.gradient,
                    )}
                >
                    <estilo.icon className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900 dark:text-slate-100">
                        {rol.nombre}
                        {rol.es_super_admin && <Lock className="size-3 shrink-0 text-[#8a6d00] dark:text-[#FFC527]" />}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {rol.descripcion ?? 'Sin descripción'}
                    </p>
                </div>
            </div>

            <div className="relative mt-4">
                {rol.es_super_admin ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC527]/15 px-2.5 py-1 text-xs font-semibold text-[#8a6d00] ring-1 ring-inset ring-[#FFC527]/30 dark:text-[#FFC527]">
                        <Sparkles className="size-3.5" />
                        Acceso total, siempre
                    </span>
                ) : (
                    <>
                        <div className="flex items-baseline justify-between text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                                {asignados} de {total} permisos
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{porcentaje}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', estilo.gradient)}
                                style={{ width: `${porcentaje}%` }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CellSwitch({
    checked,
    bloqueo,
    pendiente,
    etiqueta,
    onClick,
}: {
    checked: boolean;
    bloqueo: 'super_admin' | 'sin_techo' | null;
    pendiente: boolean;
    etiqueta: string;
    onClick: () => void;
}) {
    if (bloqueo === 'super_admin') {
        return (
            <span
                title={etiqueta}
                aria-label={etiqueta}
                className="inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFC527]/25 text-[#8a6d00] ring-1 ring-inset ring-[#FFC527]/40 dark:text-[#FFC527]"
            >
                <Lock className="size-3" />
            </span>
        );
    }

    if (bloqueo === 'sin_techo') {
        return (
            <span
                title={etiqueta}
                aria-label={etiqueta}
                className="inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600"
            >
                <Lock className="size-3" />
            </span>
        );
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={etiqueta}
            disabled={pendiente}
            onClick={onClick}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]/60 focus-visible:ring-offset-1 disabled:cursor-not-allowed dark:focus-visible:ring-offset-slate-900',
                checked ? 'bg-[#FFC527]' : 'bg-slate-300 dark:bg-slate-700',
            )}
        >
            {pendiente ? (
                <Loader2 className="mx-auto size-3 animate-spin text-slate-600" />
            ) : (
                <span
                    className={cn(
                        'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
                        checked ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                />
            )}
        </button>
    );
}

function ModuloBulkToggle({
    estado,
    bloqueado,
    pendiente,
    etiqueta,
    onClick,
}: {
    estado: 'all' | 'partial' | 'none';
    bloqueado: boolean;
    pendiente: boolean;
    etiqueta: string;
    onClick: () => void;
}) {
    if (bloqueado) {
        return (
            <span
                title={etiqueta}
                aria-label={etiqueta}
                className="mx-auto flex size-6 items-center justify-center rounded-md border border-[#FFC527] bg-[#FFC527]/15 text-[#8a6d00] dark:text-[#FFC527]"
            >
                <Lock className="size-3.5" />
            </span>
        );
    }

    return (
        <button
            type="button"
            aria-label={etiqueta}
            title={etiqueta}
            disabled={pendiente}
            onClick={onClick}
            className={cn(
                'mx-auto flex size-6 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]/60 disabled:cursor-not-allowed',
                estado === 'all' && 'border-[#FFC527] bg-[#FFC527] text-slate-900',
                estado === 'partial' &&
                    'border-[#FFC527] bg-[#FFC527]/15 text-[#8a6d00] dark:text-[#FFC527]',
                estado === 'none' &&
                    'border-slate-300 bg-white text-transparent hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900',
            )}
        >
            {pendiente ? (
                <Loader2 className="size-3.5 animate-spin" />
            ) : estado === 'all' ? (
                <Check className="size-3.5" />
            ) : estado === 'partial' ? (
                <Minus className="size-3.5" />
            ) : null}
        </button>
    );
}
