import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Loader2, MapPin, ShieldAlert, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';
import { fechaCorta } from '@/components/clientes/cliente-helpers';
import { cn } from '@/lib/utils';

interface ReclamoDetalle {
    id_reclamo: number;
    tipo_documento: string;
    num_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    email: string;
    telefono: string;
    direccion: string;
    distrito: string;
    tienda_compra: 'fisica' | 'online';
    monto_reclamado: number | null;
    tipo_bien: 'producto' | 'servicio';
    descripcion_bien: string;
    tipo_atencion: 'reclamo' | 'queja';
    detalle: string;
    pedido: string;
    es_menor_edad: boolean;
    apoderado_nombres: string | null;
    apoderado_apellidos: string | null;
    apoderado_num_documento: string | null;
    estado: string;
    nota_admin: string | null;
    created_at: string;
}

interface Props {
    reclamo: ReclamoDetalle;
    opciones: { estados: string[] };
}

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    resuelto: 'Resuelto',
};

const ESTADO_TONO: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    en_proceso: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    resuelto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
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

export default function Show({ reclamo, opciones }: Props) {
    const form = useForm({ estado: reclamo.estado, nota_admin: reclamo.nota_admin ?? '' });

    function guardar(e: FormEvent) {
        e.preventDefault();
        form.patch(route('admin.reclamos.estado', reclamo.id_reclamo), { preserveScroll: true });
    }

    const nombreCompleto = `${reclamo.nombres} ${reclamo.apellido_paterno} ${reclamo.apellido_materno ?? ''}`.trim();

    return (
        <>
            <Head title={`Reclamo #${reclamo.id_reclamo}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route('admin.reclamos.index')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" /> Volver al libro de reclamaciones
                    </Link>
                    <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', ESTADO_TONO[reclamo.estado] ?? 'bg-muted text-muted-foreground')}>
                        {ESTADO_LABEL[reclamo.estado] ?? reclamo.estado}
                    </span>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground capitalize">
                        {reclamo.tipo_atencion} #{reclamo.id_reclamo}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">{fechaCorta(reclamo.created_at)}</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="flex flex-col gap-5 lg:col-span-2">
                        <Seccion icon={FileText} titulo="Bien contratado">
                            <Dato label="Tipo" valor={reclamo.tipo_bien === 'producto' ? 'Producto' : 'Servicio'} />
                            <Dato label="Tienda de compra" valor={reclamo.tienda_compra === 'fisica' ? 'Tienda física' : 'Tienda online'} />
                            {reclamo.monto_reclamado ? <Dato label="Monto reclamado" valor={`S/ ${Number(reclamo.monto_reclamado).toFixed(2)}`} /> : null}
                            <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">{reclamo.descripcion_bien}</p>
                        </Seccion>

                        <Seccion icon={ShieldAlert} titulo="Detalle del reclamo/queja">
                            <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">{reclamo.detalle}</p>
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Pedido del consumidor</p>
                            <p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">{reclamo.pedido}</p>
                        </Seccion>

                        {reclamo.es_menor_edad ? (
                            <Seccion icon={User} titulo="Apoderado (menor de edad)">
                                <Dato label="Nombres" valor={reclamo.apoderado_nombres} />
                                <Dato label="Apellidos" valor={reclamo.apoderado_apellidos} />
                                <Dato label="N° documento" valor={reclamo.apoderado_num_documento} />
                            </Seccion>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-5">
                        <Seccion icon={User} titulo="Consumidor">
                            <Dato label="Nombre" valor={nombreCompleto} />
                            <Dato label="Documento" valor={`${reclamo.tipo_documento} ${reclamo.num_documento}`} />
                            <Dato label="Correo" valor={reclamo.email} />
                            <Dato label="Teléfono" valor={reclamo.telefono} />
                        </Seccion>

                        <Seccion icon={MapPin} titulo="Domicilio">
                            <Dato label="Dirección" valor={reclamo.direccion} />
                            <Dato label="Distrito" valor={reclamo.distrito} />
                        </Seccion>

                        <Seccion icon={FileText} titulo="Gestionar">
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
                                    placeholder="Nota interna / respuesta dada (opcional)…"
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
        { title: 'Libro de reclamaciones', href: '/admin/reclamos' },
        { title: 'Detalle', href: '#' },
    ],
};
