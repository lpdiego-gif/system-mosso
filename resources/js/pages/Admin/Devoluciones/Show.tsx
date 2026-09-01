import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, MessageSquare, Package, Phone, RotateCcw, ShoppingBag, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';
import { fechaCorta } from '@/components/clientes/cliente-helpers';
import { cn } from '@/lib/utils';

interface Item {
    producto: string | null;
    imagen: string | null;
    cantidad: number;
}

interface Props {
    devolucion: {
        id_devolucion: number;
        tipo: 'cambio' | 'devolucion';
        motivo: string;
        detalle: string;
        telefono_contacto: string;
        email_contacto: string | null;
        estado: string;
        nota_admin: string | null;
        creado_en: string | null;
        cliente: { nombre: string; correo: string | null };
        pedido: { id_pedido: number | null; total: number };
    };
    items: Item[];
    opciones: { estados: string[] };
}

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_revision: 'En revisión',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    completada: 'Completada',
};

const ESTADO_TONO: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    en_revision: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    aprobada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    rechazada: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    completada: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
};

const MOTIVO_LABEL: Record<string, string> = {
    producto_defectuoso: 'El producto llegó defectuoso',
    producto_dañado: 'El producto llegó dañado',
    no_es_lo_que_pedi: 'No es lo que pedí',
    talla_o_tamaño_incorrecto: 'Talla o tamaño incorrecto',
    llego_incompleto: 'Llegó incompleto',
    ya_no_lo_necesito: 'Ya no lo necesito',
    otro: 'Otro motivo',
};

const inputBase =
    'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

function Seccion({ icon: Icon, titulo, children }: { icon: React.ComponentType<{ className?: string }>; titulo: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="size-4 text-muted-foreground" />
                {titulo}
            </div>
            {children}
        </div>
    );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right text-foreground">{valor ?? '—'}</span>
        </div>
    );
}

export default function Show({ devolucion, items, opciones }: Props) {
    const form = useForm({ estado: devolucion.estado, nota_admin: devolucion.nota_admin ?? '' });

    function guardar(e: FormEvent) {
        e.preventDefault();
        form.patch(route('admin.devoluciones.estado', devolucion.id_devolucion), { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Solicitud #${devolucion.id_devolucion}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route('admin.devoluciones.index')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" /> Volver a cambios y devoluciones
                    </Link>
                    <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', ESTADO_TONO[devolucion.estado] ?? 'bg-muted text-muted-foreground')}>
                        {ESTADO_LABEL[devolucion.estado] ?? devolucion.estado}
                    </span>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                Solicitud #{devolucion.id_devolucion} · {devolucion.tipo === 'cambio' ? 'Cambio' : 'Devolución'}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">{devolucion.creado_en ? fechaCorta(devolucion.creado_en) : '—'}</p>
                        </div>
                        {devolucion.pedido.id_pedido ? (
                            <Link
                                href={route('admin.pedidos.show', devolucion.pedido.id_pedido)}
                                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-xs hover:bg-accent"
                            >
                                <ShoppingBag className="size-3.5" /> Ver pedido #{String(devolucion.pedido.id_pedido).padStart(6, '0')}
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="flex flex-col gap-5 lg:col-span-2">
                        <Seccion icon={Package} titulo={`Productos solicitados (${items.length})`}>
                            <div className="divide-y">
                                {items.map((it, i) => (
                                    <div key={i} className="flex items-center gap-3 py-3">
                                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                                            {it.imagen ? (
                                                <img src={`/storage/${it.imagen}`} alt={it.producto ?? ''} className="size-full object-cover" />
                                            ) : (
                                                <Package className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">{it.producto ?? 'Producto'}</p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">× {it.cantidad}</p>
                                    </div>
                                ))}
                            </div>
                        </Seccion>

                        <Seccion icon={MessageSquare} titulo="Motivo y detalle">
                            <Dato label="Motivo" valor={MOTIVO_LABEL[devolucion.motivo] ?? devolucion.motivo} />
                            <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">{devolucion.detalle}</p>
                        </Seccion>
                    </div>

                    <div className="flex flex-col gap-5">
                        <Seccion icon={User} titulo="Cliente">
                            <Dato label="Nombre" valor={devolucion.cliente.nombre} />
                            <Dato label="Correo" valor={devolucion.cliente.correo} />
                        </Seccion>

                        <Seccion icon={Phone} titulo="Contacto">
                            <Dato label="Teléfono" valor={devolucion.telefono_contacto} />
                            <Dato label="Correo alterno" valor={devolucion.email_contacto} />
                        </Seccion>

                        <Seccion icon={RotateCcw} titulo="Gestionar solicitud">
                            <form onSubmit={guardar} className="flex flex-col gap-3">
                                <select value={form.data.estado} onChange={(e) => form.setData('estado', e.target.value)} className={inputBase}>
                                    {opciones.estados.map((e) => (
                                        <option key={e} value={e}>
                                            {ESTADO_LABEL[e] ?? e}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    value={form.data.nota_admin}
                                    onChange={(e) => form.setData('nota_admin', e.target.value)}
                                    rows={3}
                                    placeholder="Nota interna (opcional)…"
                                    className={inputBase}
                                />
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : null}
                                    Guardar
                                </button>
                            </form>
                        </Seccion>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Cambios y devoluciones', href: '/admin/devoluciones' },
        { title: 'Detalle', href: '#' },
    ],
};
