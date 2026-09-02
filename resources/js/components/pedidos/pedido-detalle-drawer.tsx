import { router } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard, ExternalLink, FileText, Loader2, MapPin, Receipt, ShoppingBag, Truck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { fechaCorta, soles } from '@/components/clientes/cliente-helpers';
import { ESTADO_TONO } from '@/components/pedidos/pedido-helpers';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { PedidoDetalleResponse } from '@/types/pedido';

interface Props {
    pedidoId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const inputBase =
    'w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

function Seccion({ icon: Icon, titulo, children }: { icon: React.ComponentType<{ className?: string }>; titulo: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
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
            <span className="text-right font-medium text-foreground">{valor ?? '—'}</span>
        </div>
    );
}

export function PedidoDetalleDrawer({ pedidoId, open, onOpenChange }: Props) {
    const [detalle, setDetalle] = useState<PedidoDetalleResponse | null>(null);
    const [cargando, setCargando] = useState(false);
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    useEffect(() => {
        if (!open || pedidoId === null) {
            return;
        }

        let vivo = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga del detalle al abrir el Drawer
        setCargando(true);
        setDetalle(null);

        axios
            .get<PedidoDetalleResponse>(route('admin.pedidos.detalle', pedidoId))
            .then(({ data }) => {
                if (vivo) {
                    setDetalle(data);
                }
            })
            .catch(() => {
                if (vivo) {
                    onOpenChange(false);
                }
            })
            .finally(() => {
                if (vivo) {
                    setCargando(false);
                }
            });

        return () => {
            vivo = false;
        };
    }, [open, pedidoId, onOpenChange]);

    function cambiarEstado(fkEstado: number) {
        if (!detalle || fkEstado === detalle.pedido.fk_estado_pedido) {
            return;
        }

        setGuardandoEstado(true);
        router.patch(
            route('admin.pedidos.estado', detalle.pedido.id_pedido),
            { fk_estado_pedido: fkEstado },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['pedidos'],
                onSuccess: () => {
                    const nombre = detalle.opciones.estados.find((e) => e.id_estado_pedido === fkEstado)?.nombre ?? null;
                    setDetalle((prev) => (prev ? { ...prev, pedido: { ...prev.pedido, fk_estado_pedido: fkEstado, estado: nombre } } : prev));
                },
                onFinish: () => setGuardandoEstado(false),
            },
        );
    }

    const pedido = detalle?.pedido ?? null;
    const detalles = detalle?.detalles ?? [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
                <SheetHeader className="border-b p-4 sm:p-5">
                    <SheetTitle>{pedido ? `Pedido #${String(pedido.id_pedido).padStart(6, '0')}` : 'Detalle del pedido'}</SheetTitle>
                    <SheetDescription className="sr-only">Detalle completo del pedido: cliente, entrega, pago y productos.</SheetDescription>
                </SheetHeader>

                {cargando || !pedido ? (
                    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="size-6 animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">{pedido.fecha_pedido ? fechaCorta(pedido.fecha_pedido) : '—'}</p>
                                {pedido.estado ? (
                                    <span
                                        className={cn(
                                            'mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                            ESTADO_TONO[pedido.estado] ?? 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {pedido.estado}
                                    </span>
                                ) : null}
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold tabular-nums text-foreground">{soles(pedido.total)}</p>
                                {pedido.descuento_total > 0 ? (
                                    <p className="text-xs text-muted-foreground">Dscto. −{soles(pedido.descuento_total)}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">IGV: {soles(pedido.igv)}</p>
                                )}
                            </div>
                        </div>

                        <Seccion icon={ShoppingBag} titulo={`Productos (${detalles.length})`}>
                            <div className="divide-y">
                                {detalles.map((d) => (
                                    <div key={d.id_pedido_detalle} className="flex items-center gap-3 py-2.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                                            {d.imagen ? (
                                                <img src={`/storage/${d.imagen}`} alt={d.producto ?? ''} className="size-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="size-4 text-muted-foreground" />
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

                        <Seccion icon={User} titulo="Cliente">
                            <Dato label="Nombre" valor={pedido.cliente.nombre} />
                            <Dato label="Correo" valor={pedido.cliente.correo} />
                            <Dato label="Teléfono" valor={pedido.cliente.telefono} />
                            {pedido.cliente.documento ? <Dato label="Documento" valor={pedido.cliente.documento} /> : null}
                        </Seccion>

                        <Seccion icon={Truck} titulo="Entrega">
                            <Dato label="Tipo" valor={pedido.tipo_entrega} />
                            {pedido.direccion_envio ? (
                                <>
                                    <Dato label="Dirección" valor={pedido.direccion_envio.direccion} />
                                    <Dato label="Distrito" valor={pedido.direccion_envio.distrito} />
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Recojo en tienda.</p>
                            )}
                        </Seccion>

                        <Seccion icon={CreditCard} titulo="Pago">
                            <Dato label="Forma de pago" valor={pedido.forma_pago} />
                            {pedido.pago ? (
                                <>
                                    <Dato label="Estado del pago" valor={pedido.pago.estado} />
                                    <Dato label="Monto" valor={soles(pedido.pago.monto)} />
                                </>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Sin registro de pago todavía.</p>
                            )}
                        </Seccion>

                        {pedido.comprobante ? (
                            <Seccion icon={Receipt} titulo="Comprobante">
                                <Dato label="Tipo" valor={pedido.comprobante.tipo} />
                                <Dato label="Serie - número" valor={`${pedido.comprobante.serie ?? ''}-${pedido.comprobante.numero ?? ''}`} />
                            </Seccion>
                        ) : null}

                        <Seccion icon={MapPin} titulo="Cambiar estado">
                            <div className="flex items-center gap-2">
                                <select
                                    value={pedido.fk_estado_pedido}
                                    onChange={(e) => cambiarEstado(Number(e.target.value))}
                                    disabled={guardandoEstado}
                                    className={inputBase}
                                >
                                    {detalle?.opciones.estados.map((e) => (
                                        <option key={e.id_estado_pedido} value={e.id_estado_pedido}>
                                            {e.nombre}
                                        </option>
                                    ))}
                                </select>
                                {guardandoEstado ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
                            </div>
                        </Seccion>

                        <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-4">
                            <a
                                href={route('admin.pedidos.pdf', pedido.id_pedido)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                            >
                                <FileText className="size-4" /> Ver PDF
                            </a>
                            <a
                                href={route('admin.pedidos.show', pedido.id_pedido)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                            >
                                <ExternalLink className="size-4" /> Página completa
                            </a>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
