import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2, Minus, Package, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import StorefrontLayout from '@/layouts/storefront-layout';

interface ItemPedido {
    id_pedido_detalle: number;
    producto: string | null;
    imagen: string | null;
    cantidad_disponible: number;
}

interface PedidoElegible {
    id_pedido: number;
    fecha_pedido: string;
    total: number;
    items: ItemPedido[];
}

interface Props {
    pedidos: PedidoElegible[];
    motivos: string[];
    contacto: { telefono: string | null; email: string | null };
}

const MOTIVO_LABEL: Record<string, string> = {
    producto_defectuoso: 'El producto llegó defectuoso',
    producto_dañado: 'El producto llegó dañado',
    no_es_lo_que_pedi: 'No es lo que pedí',
    talla_o_tamaño_incorrecto: 'Talla o tamaño incorrecto',
    llego_incompleto: 'Llegó incompleto',
    ya_no_lo_necesito: 'Ya no lo necesito',
    otro: 'Otro motivo',
};

function soles(monto: number) {
    return `S/ ${Number(monto || 0).toFixed(2)}`;
}

export default function CambiosYDevoluciones({ pedidos, motivos, contacto }: Props) {
    const [pedidoId, setPedidoId] = useState<number | null>(pedidos.length === 1 ? pedidos[0].id_pedido : null);
    const [cantidades, setCantidades] = useState<Record<number, number>>({});
    const [enviado, setEnviado] = useState(false);

    const pedido = useMemo(() => pedidos.find((p) => p.id_pedido === pedidoId) ?? null, [pedidos, pedidoId]);

    const form = useForm({
        fk_pedido: 0,
        tipo: 'cambio' as 'cambio' | 'devolucion',
        motivo: motivos[0] ?? 'otro',
        detalle: '',
        telefono_contacto: contacto.telefono ?? '',
        email_contacto: contacto.email ?? '',
        items: [] as { fk_pedido_detalle: number; cantidad: number }[],
    });

    function elegirPedido(p: PedidoElegible) {
        setPedidoId(p.id_pedido);
        setCantidades({});
    }

    function ajustarCantidad(item: ItemPedido, delta: number) {
        setCantidades((prev) => {
            const actual = prev[item.id_pedido_detalle] ?? 0;
            const nueva = Math.max(0, Math.min(item.cantidad_disponible, actual + delta));
            return { ...prev, [item.id_pedido_detalle]: nueva };
        });
    }

    const itemsSeleccionados = Object.entries(cantidades)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([id, cantidad]) => ({ fk_pedido_detalle: Number(id), cantidad }));

    function enviar() {
        if (!pedido || itemsSeleccionados.length === 0) return;

        form.transform((data) => ({
            ...data,
            fk_pedido: pedido.id_pedido,
            items: itemsSeleccionados,
        }));

        form.post(route('devoluciones.store'), {
            preserveScroll: true,
            onSuccess: () => setEnviado(true),
        });
    }

    return (
        <StorefrontLayout>
            <Head title="Cambios y devoluciones" />

            <div className="bg-mosso-cream min-h-[70vh]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                    <Link href="/mi-cuenta" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
                        <ArrowLeft className="w-4 h-4" /> Volver a mi cuenta
                    </Link>

                    <div className="mb-6">
                        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-mosso-yellow" /> Cambios y devoluciones
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Elige el pedido y los productos por los que quieres pedir un cambio o una devolución.
                        </p>
                    </div>

                    {enviado ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-3">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                            <p className="text-base font-bold text-gray-900">¡Solicitud registrada!</p>
                            <p className="text-sm text-gray-500 max-w-sm">Te contactaremos pronto para coordinar el {form.data.tipo === 'cambio' ? 'cambio' : 'la devolución'}.</p>
                            <Link href="/mi-cuenta" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mosso-yellow px-5 py-2 text-sm font-bold text-gray-900">
                                Volver a mi cuenta
                            </Link>
                        </div>
                    ) : pedidos.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-3xl select-none">📦</div>
                            <div>
                                <p className="text-base font-bold text-gray-800">No tienes pedidos disponibles</p>
                                <p className="mt-1 text-sm text-gray-500 max-w-xs">
                                    Solo puedes pedir cambios o devoluciones de pedidos ya entregados que no tengan una solicitud en trámite.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Paso 1: elegir pedido */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <p className="text-sm font-bold text-gray-900 mb-3">1. Elige el pedido</p>
                                <div className="space-y-2">
                                    {pedidos.map((p) => (
                                        <button
                                            key={p.id_pedido}
                                            type="button"
                                            onClick={() => elegirPedido(p)}
                                            className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                                                pedidoId === p.id_pedido ? 'border-mosso-yellow bg-mosso-yellow/10' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Pedido #{String(p.id_pedido).padStart(6, '0')}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(p.fecha_pedido).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">{soles(p.total)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Paso 2: productos + datos */}
                            {pedido ? (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-3">2. Elige los productos</p>
                                        <div className="space-y-2">
                                            {pedido.items.map((item) => {
                                                const cantidad = cantidades[item.id_pedido_detalle] ?? 0;
                                                return (
                                                    <div key={item.id_pedido_detalle} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                                                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                                                            {item.imagen ? (
                                                                <img src={`/storage/${item.imagen}`} alt={item.producto ?? ''} className="size-full object-cover" />
                                                            ) : (
                                                                <Package className="size-4 text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-gray-900">{item.producto ?? 'Producto'}</p>
                                                            <p className="text-xs text-gray-400">Disponible: {item.cantidad_disponible}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => ajustarCantidad(item, -1)}
                                                                disabled={cantidad === 0}
                                                                className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-30"
                                                            >
                                                                <Minus className="size-3.5" />
                                                            </button>
                                                            <span className="w-5 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => ajustarCantidad(item, 1)}
                                                                disabled={cantidad >= item.cantidad_disponible}
                                                                className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-30"
                                                            >
                                                                <Plus className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-2">3. ¿Qué necesitas?</p>
                                        <div className="flex gap-2">
                                            {(['cambio', 'devolucion'] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => form.setData('tipo', t)}
                                                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                                                        form.data.tipo === t ? 'border-mosso-yellow bg-mosso-yellow/10 text-gray-900' : 'border-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {t === 'cambio' ? 'Cambio' : 'Devolución'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-500">Motivo</span>
                                            <select
                                                value={form.data.motivo}
                                                onChange={(e) => form.setData('motivo', e.target.value)}
                                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mosso-yellow"
                                            >
                                                {motivos.map((m) => (
                                                    <option key={m} value={m}>
                                                        {MOTIVO_LABEL[m] ?? m}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-500">Teléfono de contacto</span>
                                            <input
                                                value={form.data.telefono_contacto}
                                                onChange={(e) => form.setData('telefono_contacto', e.target.value)}
                                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mosso-yellow"
                                            />
                                            {form.errors.telefono_contacto ? <p className="mt-1 text-xs text-red-500">{form.errors.telefono_contacto}</p> : null}
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="text-xs font-medium text-gray-500">Cuéntanos qué pasó</span>
                                        <textarea
                                            value={form.data.detalle}
                                            onChange={(e) => form.setData('detalle', e.target.value)}
                                            rows={4}
                                            placeholder="Describe el motivo con el mayor detalle posible…"
                                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mosso-yellow"
                                        />
                                        {form.errors.detalle ? <p className="mt-1 text-xs text-red-500">{form.errors.detalle}</p> : null}
                                    </label>

                                    {form.errors.items ? <p className="text-xs text-red-500">{form.errors.items}</p> : null}

                                    <button
                                        type="button"
                                        onClick={enviar}
                                        disabled={form.processing || itemsSeleccionados.length === 0 || !form.data.detalle.trim() || !form.data.telefono_contacto.trim()}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-mosso-yellow px-5 py-3 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {form.processing ? <Loader2 className="size-4 animate-spin" /> : null}
                                        Enviar solicitud
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
