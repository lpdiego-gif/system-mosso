import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CreditCard, FileText, Loader2, MapPin, Receipt, ShoppingBag, Truck, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';
import { fechaCorta, soles } from '@/components/clientes/cliente-helpers';
import { ESTADO_TONO } from '@/components/pedidos/pedido-helpers';
import { cn } from '@/lib/utils';
import type { PedidoDetalleResponse } from '@/types/pedido';

type Props = PedidoDetalleResponse;

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
            <span className="font-medium text-foreground text-right">{valor ?? '—'}</span>
        </div>
    );
}

export default function Show({ pedido, detalles, opciones }: Props) {
    const form = useForm({ fk_estado_pedido: pedido.fk_estado_pedido });

    function guardarEstado(e: FormEvent) {
        e.preventDefault();
        form.patch(route('admin.pedidos.estado', pedido.id_pedido), { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Pedido #${String(pedido.id_pedido).padStart(6, '0')}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route('admin.pedidos.index')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" /> Volver a pedidos
                    </Link>
                    <div className="flex items-center gap-3">
                        {pedido.estado ? (
                            <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', ESTADO_TONO[pedido.estado] ?? 'bg-muted text-muted-foreground')}>
                                {pedido.estado}
                            </span>
                        ) : null}
                        <a
                            href={route('admin.pedidos.pdf', pedido.id_pedido)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent"
                        >
                            <FileText className="size-3.5" /> Ver PDF
                        </a>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">Pedido #{String(pedido.id_pedido).padStart(6, '0')}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">{pedido.fecha_pedido ? fechaCorta(pedido.fecha_pedido) : '—'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold tabular-nums text-foreground">{soles(pedido.total)}</p>
                            {pedido.descuento_total > 0 ? (
                                <p className="text-xs text-muted-foreground">Subtotal {soles(pedido.subtotal)} · Descuento −{soles(pedido.descuento_total)}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">IGV incluido: {soles(pedido.igv)}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="flex flex-col gap-5 lg:col-span-2">
                        <Seccion icon={ShoppingBag} titulo={`Productos (${detalles.length})`}>
                            <div className="divide-y">
                                {detalles.map((d) => (
                                    <div key={d.id_pedido_detalle} className="flex items-center gap-3 py-3">
                                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                                            {d.imagen ? (
                                                <img src={`/storage/${d.imagen}`} alt={d.producto ?? ''} className="size-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">{d.producto ?? 'Producto eliminado'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {d.cantidad} × {soles(d.precio_unitario)}
                                                {d.descuento_unitario > 0 ? ` (−${soles(d.descuento_unitario)})` : ''}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{soles(d.subtotal)}</p>
                                    </div>
                                ))}
                            </div>
                        </Seccion>

                        <Seccion icon={Truck} titulo="Entrega">
                            <Dato label="Tipo de entrega" valor={pedido.tipo_entrega} />
                            {pedido.direccion_envio ? (
                                <>
                                    <Dato label="Dirección" valor={pedido.direccion_envio.direccion} />
                                    <Dato label="Referencia" valor={pedido.direccion_envio.referencia} />
                                    <Dato label="Distrito" valor={pedido.direccion_envio.distrito} />
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Recojo en tienda, sin dirección de envío.</p>
                            )}
                        </Seccion>
                    </div>

                    <div className="flex flex-col gap-5">
                        <Seccion icon={User} titulo="Cliente">
                            <Dato label="Nombre" valor={pedido.cliente.nombre} />
                            <Dato label="Correo" valor={pedido.cliente.correo} />
                            <Dato label="Teléfono" valor={pedido.cliente.telefono} />
                            {pedido.cliente.id_cliente ? (
                                <Link
                                    href={route('admin.clientes.show', pedido.cliente.id_cliente)}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-mosso-dark hover:underline dark:text-mosso-yellow"
                                >
                                    Ver ficha del cliente →
                                </Link>
                            ) : null}
                        </Seccion>

                        <Seccion icon={CreditCard} titulo="Pago">
                            <Dato label="Forma de pago" valor={pedido.forma_pago} />
                            {pedido.pago ? (
                                <>
                                    <Dato label="Estado del pago" valor={pedido.pago.estado} />
                                    <Dato label="Monto" valor={soles(pedido.pago.monto)} />
                                    <Dato label="Referencia" valor={pedido.pago.referencia} />
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Sin registro de pago todavía.</p>
                            )}
                        </Seccion>

                        {pedido.comprobante ? (
                            <Seccion icon={Receipt} titulo="Comprobante">
                                <Dato label="Tipo" valor={pedido.comprobante.tipo} />
                                <Dato label="Serie - número" valor={`${pedido.comprobante.serie ?? ''}-${pedido.comprobante.numero ?? ''}`} />
                                <Link
                                    href={route('admin.ventas.show', pedido.comprobante.id)}
                                    className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    Ver en Ventas →
                                </Link>
                            </Seccion>
                        ) : null}

                        <Seccion icon={MapPin} titulo="Cambiar estado">
                            <form onSubmit={guardarEstado} className="flex flex-col gap-3">
                                <select
                                    value={form.data.fk_estado_pedido}
                                    onChange={(e) => form.setData('fk_estado_pedido', Number(e.target.value))}
                                    className={inputBase}
                                >
                                    {opciones.estados.map((e) => (
                                        <option key={e.id_estado_pedido} value={e.id_estado_pedido}>
                                            {e.nombre}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={form.processing || form.data.fk_estado_pedido === pedido.fk_estado_pedido}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? <Loader2 className="size-4 animate-spin" /> : null}
                                    Guardar estado
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
        { title: 'Pedidos', href: '/admin/pedidos' },
        { title: 'Detalle', href: '#' },
    ],
};
