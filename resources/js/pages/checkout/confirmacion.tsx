import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { CheckoutConfirmacionProps } from '@/types/checkout';

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export default function CheckoutConfirmacion({
    pedido,
    comprobante,
    pago,
    direccion,
    receptor,
    empresa,
}: CheckoutConfirmacionProps) {
    return (
        <StorefrontLayout>
            <Head title={`Pedido #${pedido.id} confirmado`} />

            <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                    <h1 className="mt-4 text-2xl font-black text-gray-900">
                        ¡Gracias por tu compra!
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tu pago fue confirmado y tu pedido{' '}
                        <span className="font-semibold">#{pedido.id}</span> está
                        en proceso.
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Tarjeta titulo="Estado del pedido">
                        <p className="text-sm text-gray-700">
                            {pedido.estado ?? 'En proceso'}
                        </p>
                        <p className="text-xs text-gray-400">
                            Entrega: {pedido.tipo_entrega ?? '—'}
                        </p>
                    </Tarjeta>

                    <Tarjeta titulo="Pago">
                        <p className="text-sm text-gray-700">
                            {soles(pago.monto)}
                        </p>
                        {pago.transaccion && (
                            <p className="text-xs text-gray-400">
                                Transacción: {pago.transaccion}
                            </p>
                        )}
                    </Tarjeta>

                    {comprobante && (
                        <Tarjeta titulo="Comprobante">
                            <p className="text-sm text-gray-700">
                                {comprobante.tipo} {comprobante.serie}-
                                {comprobante.numero}
                            </p>
                            <p className="text-xs text-gray-400">
                                Se enviará a tu correo.
                            </p>
                        </Tarjeta>
                    )}

                    {direccion ? (
                        <Tarjeta titulo="Dirección de envío">
                            <p className="text-sm text-gray-700">
                                {direccion.direccion}
                            </p>
                            <p className="text-xs text-gray-400">
                                {direccion.distrito}
                                {direccion.referencia
                                    ? ` · ${direccion.referencia}`
                                    : ''}
                            </p>
                        </Tarjeta>
                    ) : (
                        <Tarjeta titulo="Retiro en tienda">
                            <p className="text-sm text-gray-700">
                                {empresa?.nombre_comercial ?? 'MOSSO'}
                            </p>
                            {empresa?.direccion && (
                                <p className="text-xs text-gray-400">
                                    {empresa.direccion}
                                    {empresa.distrito
                                        ? `, ${empresa.distrito}`
                                        : ''}
                                </p>
                            )}
                        </Tarjeta>
                    )}

                    {receptor && (
                        <Tarjeta titulo="Recibe el pedido">
                            <p className="text-sm text-gray-700">
                                {receptor.nombres} {receptor.apellidos}
                            </p>
                            {receptor.telefono && (
                                <p className="text-xs text-gray-400">
                                    Tel: {receptor.telefono}
                                </p>
                            )}
                        </Tarjeta>
                    )}
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
                    <h2 className="text-sm font-bold text-gray-900">
                        Detalle del pedido
                    </h2>
                    <ul className="mt-4 divide-y divide-gray-100">
                        {pedido.items.map((item, i) => (
                            <li key={i} className="flex gap-3 py-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                    {item.imagen ? (
                                        <img
                                            src={item.imagen}
                                            alt={item.nombre ?? ''}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 text-sm font-medium text-gray-900">
                                        {item.nombre}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {item.cantidad} ×{' '}
                                        {soles(item.precio_final)}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {soles(item.subtotal)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm text-gray-600">
                        <Fila label="Subtotal" valor={soles(pedido.subtotal)} />
                        {pedido.descuento_total > 0 && (
                            <Fila
                                label="Descuentos"
                                valor={`-${soles(pedido.descuento_total)}`}
                                verde
                            />
                        )}
                        <Fila
                            label="Envío"
                            valor={
                                pedido.costo_envio > 0
                                    ? soles(pedido.costo_envio)
                                    : 'GRATIS'
                            }
                            verde={pedido.costo_envio === 0}
                        />
                        <Fila
                            label="IGV incluido (18%)"
                            valor={soles(pedido.igv)}
                            tenue
                        />
                        <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-black text-gray-900">
                            <span>Total</span>
                            <span>{soles(pedido.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link
                        href="/mi-cuenta/pedidos"
                        className="rounded-full bg-mosso-yellow px-6 py-3 text-sm font-bold text-gray-900 hover:bg-mosso-yellow/85"
                    >
                        Ver mis pedidos
                    </Link>
                    <Link
                        href="/"
                        className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
}

function Tarjeta({
    titulo,
    children,
}: {
    titulo: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                {titulo}
            </p>
            <div className="mt-1">{children}</div>
        </div>
    );
}

function Fila({
    label,
    valor,
    verde,
    tenue,
}: {
    label: string;
    valor: string;
    verde?: boolean;
    tenue?: boolean;
}) {
    return (
        <div
            className={`flex justify-between ${verde ? 'text-green-600' : ''} ${tenue ? 'text-xs text-gray-400' : ''}`}
        >
            <span>{label}</span>
            <span>{valor}</span>
        </div>
    );
}
