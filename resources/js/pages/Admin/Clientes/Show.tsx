import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    Cake,
    Coins,
    IdCard,
    Mail,
    MapPin,
    PawPrint,
    Pencil,
    Phone,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    Star,
    TriangleAlert,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { route } from 'ziggy-js';
import { ClienteAvatar } from '@/components/clientes/cliente-avatar';
import {
    edadDesde,
    fechaCorta,
    soles,
    tiempoRelativo,
} from '@/components/clientes/cliente-helpers';
import { cn } from '@/lib/utils';
import type {
    ClienteDetalle,
    ClienteDireccionItem,
    ClienteMascota,
    ClienteMetricas,
    ClientePedidoItem,
} from '@/types/cliente';

interface Props {
    cliente: ClienteDetalle;
    metricas: ClienteMetricas;
    mascotas: ClienteMascota[];
    direcciones: ClienteDireccionItem[];
    pedidos: ClientePedidoItem[];
}

const ESTADO_TONO: Record<string, string> = {
    'Pendiente de pago':
        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    Pagado: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    'En preparación':
        'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    Enviado:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    Entregado:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Cancelado:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export default function Show({
    cliente,
    metricas,
    mascotas,
    direcciones,
    pedidos,
}: Props) {
    return (
        <>
            <Head title={cliente.nombre} />

            <div className="mx-auto flex w-full flex-col gap-5 p-4 sm:p-6 lg:p-8">
                {/* Barra superior */}
                {/* Cabecera de perfil */}
               <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs transition-all hover:shadow-sm">
    {/* Acciones Superpuestas */}
    <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2">
        <Link
            href={route('admin.clientes.index')}
            className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:bg-background hover:text-foreground border border-border/40 shadow-xs"
        >
            <ArrowLeft className="size-3.5" /> Clientes
        </Link>
        <Link
            href={route('admin.clientes.edit', cliente.id_cliente)}
            className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary backdrop-blur-md"
        >
            <Pencil className="size-3.5" /> Editar
        </Link>
    </div>

    {/* Header / Portada con Degradado */}
    <div className="h-16 bg-gradient-to-r from-mosso-yellow/20 via-mosso-yellow/5 to-transparent border-b border-border/40" />

    {/* Contenido Principal */}
    <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-end sm:gap-4">
        <ClienteAvatar
            nombre={cliente.nombre}
            iniciales={cliente.iniciales}
            size="lg"
            className="-mt-6 ring-2 ring-card shadow-sm"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {cliente.nombre}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 font-normal">
                    <CalendarClock className="size-3 text-muted-foreground/70" />
                    Cliente {tiempoRelativo(cliente.creado_en)}
                </span>
            </div>

            {/* Badges nativos estilizados */}
            <div className="flex flex-wrap items-center gap-1.5">
                {cliente.num_documento ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                        <IdCard className="size-3 text-slate-500" />
                        {cliente.tipo_documento ?? 'Doc.'} {cliente.num_documento}
                    </span>
                ) : null}

                {cliente.es_empresa ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                        <Building2 className="size-3 text-amber-600 dark:text-amber-400" />
                        Empresa
                    </span>
                ) : null}

                {cliente.cuenta_email ? (
                    cliente.cuenta_verificada ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Cuenta verificada
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                            <ShieldAlert className="size-3 text-amber-600 dark:text-amber-400" />
                            Cuenta sin verificar
                        </span>
                    )
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        Sin cuenta
                    </span>
                )}
            </div>
        </div>
    </div>
</div>

                {cliente.sin_persona ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Este cliente se registró en la tienda y aún no tiene
                            datos personales.{' '}
                            <Link
                                href={route(
                                    'admin.clientes.edit',
                                    cliente.id_cliente,
                                )}
                                className="font-medium underline underline-offset-4"
                            >
                                Completar ahora
                            </Link>
                            .
                        </p>
                    </div>
                ) : null}

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-sm sm:grid-cols-3 lg:grid-cols-5">
                    <Metrica
                        icon={ShoppingBag}
                        etiqueta="Pedidos"
                        valor={String(metricas.pedidos)}
                    />
                    <Metrica
                        icon={Coins}
                        etiqueta="Total gastado"
                        valor={soles(metricas.total_gastado)}
                    />
                    <Metrica
                        icon={PawPrint}
                        etiqueta="Mascotas"
                        valor={String(metricas.mascotas)}
                    />
                    <Metrica
                        icon={Star}
                        etiqueta="Puntos"
                        valor={metricas.puntos.toLocaleString('es-PE')}
                    />
                    <Metrica
                        icon={MapPin}
                        etiqueta="Direcciones"
                        valor={String(metricas.direcciones)}
                    />
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="space-y-5">
                        {/* Mascotas */}
                        <Panel icon={PawPrint} titulo="Mascotas">
                            {mascotas.length === 0 ? (
                                <Vacio texto="Este cliente no tiene mascotas registradas." />
                            ) : (
                                <ul className="divide-y">
                                    {mascotas.map((m) => (
                                        <li
                                            key={m.id_mascota}
                                            className="flex items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                                    <PawPrint className="size-4" />
                                                </span>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {m.nombre}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {m.animal ?? 'Mascota'}
                                                        {edadDesde(
                                                            m.fecha_nacimiento,
                                                        )
                                                            ? ` · ${edadDesde(m.fecha_nacimiento)}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        {/* Direcciones */}
                        <Panel icon={MapPin} titulo="Direcciones">
                            {direcciones.length === 0 ? (
                                <Vacio texto="Sin direcciones de envío guardadas." />
                            ) : (
                                <ul className="divide-y">
                                    {direcciones.map((d) => (
                                        <li
                                            key={d.id_cliente_direccion}
                                            className="flex items-start justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-2 font-medium text-foreground">
                                                    {d.alias || 'Dirección'}
                                                    {d.es_principal ? (
                                                        <span className="rounded-full bg-mosso-yellow/20 px-1.5 py-0.5 text-[0.65rem] font-semibold text-mosso-dark ring-1 ring-inset ring-mosso-yellow/40 dark:text-mosso-yellow">
                                                            Principal
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {d.direccion ??
                                                        'Dirección sin detalle'}
                                                </p>
                                                {d.referencia ? (
                                                    <p className="text-xs text-muted-foreground/80">
                                                        {d.referencia}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        {/* Pedidos recientes */}
                        <Panel icon={ShoppingBag} titulo="Pedidos recientes">
                            {pedidos.length === 0 ? (
                                <Vacio texto="Todavía no ha realizado pedidos." />
                            ) : (
                                <ul className="divide-y">
                                    {pedidos.map((p) => (
                                        <li
                                            key={p.id_pedido}
                                            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-foreground tabular-nums">
                                                    #{p.id_pedido}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-xs font-medium',
                                                        (p.estado &&
                                                            ESTADO_TONO[
                                                                p.estado
                                                            ]) ||
                                                            'bg-secondary text-secondary-foreground',
                                                    )}
                                                >
                                                    {p.estado ?? 'Sin estado'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                                    {fechaCorta(p.fecha)}
                                                </span>
                                                <span className="font-semibold text-foreground tabular-nums">
                                                    {soles(p.total)}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>

                    {/* Aside: contacto */}
                    <aside className="space-y-5 lg:sticky lg:top-6">
                        <Panel icon={Mail} titulo="Contacto">
                            <dl className="divide-y text-sm">
                                <DatoFila
                                    icon={Mail}
                                    etiqueta="Correo"
                                    valor={cliente.correo}
                                />
                                <DatoFila
                                    icon={Phone}
                                    etiqueta="Teléfono"
                                    valor={cliente.telefono ?? '—'}
                                />
                                <DatoFila
                                    icon={IdCard}
                                    etiqueta="Documento"
                                    valor={
                                        cliente.num_documento
                                            ? `${cliente.tipo_documento ?? ''} ${cliente.num_documento}`.trim()
                                            : '—'
                                    }
                                />
                                <DatoFila
                                    icon={Cake}
                                    etiqueta="Nacimiento"
                                    valor={
                                        cliente.fecha_nacimiento
                                            ? fechaCorta(
                                                  cliente.fecha_nacimiento,
                                              )
                                            : '—'
                                    }
                                />
                            </dl>
                        </Panel>

                        {cliente.es_empresa ? (
                            <Panel icon={Building2} titulo="Datos de empresa">
                                <dl className="divide-y text-sm">
                                    <DatoFila
                                        icon={Building2}
                                        etiqueta="Razón social"
                                        valor={cliente.razon_social ?? '—'}
                                    />
                                    <DatoFila
                                        icon={IdCard}
                                        etiqueta="RUC"
                                        valor={cliente.ruc ?? '—'}
                                    />
                                </dl>
                            </Panel>
                        ) : null}

                        <Panel icon={ShieldCheck} titulo="Cuenta de acceso">
                            {cliente.cuenta_email ? (
                                <div className="space-y-2 px-4 py-3.5 text-sm">
                                    <p className="font-medium text-foreground break-all">
                                        {cliente.cuenta_email}
                                    </p>
                                    <p
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                                            cliente.cuenta_verificada
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
                                        )}
                                    >
                                        {cliente.cuenta_verificada ? (
                                            <ShieldCheck className="size-3" />
                                        ) : (
                                            <ShieldAlert className="size-3" />
                                        )}
                                        {cliente.cuenta_verificada
                                            ? 'Verificada'
                                            : 'Sin verificar'}
                                    </p>
                                </div>
                            ) : (
                                <div className="px-4 py-3.5 text-sm text-muted-foreground">
                                    Sin cuenta.{' '}
                                    <Link
                                        href={route(
                                            'admin.clientes.edit',
                                            cliente.id_cliente,
                                        )}
                                        className="font-medium text-foreground underline underline-offset-4"
                                    >
                                        Crear una
                                    </Link>
                                    .
                                </div>
                            )}
                        </Panel>
                    </aside>
                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Clientes', href: '/admin/clientes' },
        { title: 'Ficha', href: '#' },
    ],
};

/* -------------------------------------------------------------------------- */

function Badge({
    tone,
    icon: Icon,
    children,
}: {
    tone: 'slate' | 'amber' | 'emerald';
    icon?: ComponentType<{ className?: string }>;
    children: ReactNode;
}) {
    const tones = {
        slate: 'bg-secondary text-secondary-foreground',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        emerald:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                tones[tone],
            )}
        >
            {Icon ? <Icon className="size-3" /> : null}
            {children}
        </span>
    );
}

function Metrica({
    icon: Icon,
    etiqueta,
    valor,
}: {
    icon: ComponentType<{ className?: string }>;
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="flex flex-col gap-1 bg-card px-4 py-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" />
                {etiqueta}
            </span>
            <span className="text-lg font-semibold text-foreground tabular-nums">
                {valor}
            </span>
        </div>
    );
}

function Panel({
    icon: Icon,
    titulo,
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    titulo: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b px-4 py-3">
                <Icon className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    {titulo}
                </h2>
            </div>
            {children}
        </section>
    );
}

function Vacio({ texto }: { texto: string }) {
    return (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {texto}
        </p>
    );
}

function DatoFila({
    icon: Icon,
    etiqueta,
    valor,
}: {
    icon: ComponentType<{ className?: string }>;
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="size-3.5" />
                {etiqueta}
            </dt>
            <dd className="max-w-[60%] text-right font-medium text-foreground break-words">
                {valor}
            </dd>
        </div>
    );
}
