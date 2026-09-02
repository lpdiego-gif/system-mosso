import { Link, router, usePage } from '@inertiajs/react';
import { abrirAcceso } from '@/components/ModalAcceso';
import StorefrontLayout from '@/layouts/storefront-layout';

interface ItemCarrito {
    id: number;
    producto_id: number;
    nombre: string;
    marca: string | null;
    imagen: string | null;
    precio_unitario: number;
    cantidad: number;
    subtotal: number;
}

interface Props {
    items: ItemCarrito[];
    total: number;
}

export default function CarritoIndex({ items, total }: Props) {
    const { auth } = usePage().props;
    const autenticado = Boolean(auth?.user);

    function irAlPago() {
        if (!autenticado) {
            abrirAcceso('/checkout');

            return;
        }

        router.visit('/checkout');
    }

    return (
        <StorefrontLayout>
            <div className="max-w-[1440px] mx-auto px-4 py-6 sm:px-6 sm:py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">
                        Inicio
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Carrito</span>
                </nav>

                <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 sm:mb-8">Mi carrito</h1>

                {items.length === 0 ? (
                    <EstadoVacio />
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                        {/* Lista de ítems */}
                        <div className="flex-1 min-w-0 w-full">
                            {/* Desktop / pantallas grandes: tabla */}
                            <div className="hidden lg:block border border-gray-100 rounded-xl overflow-hidden bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500 uppercase tracking-wide">
                                                <th className="px-4 py-3 text-left font-semibold w-12">N°</th>
                                                <th className="px-4 py-3 text-left font-semibold">Imagen</th>
                                                <th className="px-4 py-3 text-left font-semibold">Producto</th>
                                                <th className="px-4 py-3 text-right font-semibold">Precio</th>
                                                <th className="px-4 py-3 text-center font-semibold">Cantidad</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total</th>
                                                <th className="px-4 py-3 w-12" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map((item, i) => (
                                                <FilaTabla key={item.id} item={item} numero={i + 1} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile / tablet: tarjetas */}
                            <div className="flex flex-col gap-3 lg:hidden">
                                {items.map((item) => (
                                    <TarjetaItem key={item.id} item={item} />
                                ))}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="w-full lg:w-80 shrink-0">
                            <div className="border border-gray-100 rounded-xl p-6 bg-white lg:sticky lg:top-24">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Resumen del pedido
                                </h2>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>S/ {total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Envío</span>
                                        <span className="text-green-600 font-medium">
                                            Se calcula al pagar
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-xl">
                                        S/ {total.toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={irAlPago}
                                    className="mt-6 block w-full bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 font-bold py-3 rounded-full text-sm text-center transition-colors"
                                >
                                    Proceder al pago
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">
                                    Pago 100% seguro con Culqi
                                </p>

                                <Link
                                    href="/"
                                    className="mt-4 block text-center text-sm text-gray-900 font-semibold hover:text-mosso-yellow transition-colors"
                                >
                                    ← Seguir comprando
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

/** Selector de cantidad compacto, reutilizado por la fila de tabla y la tarjeta mobile. */
function SelectorCantidad({ item, tamano = 'md' }: { item: ItemCarrito; tamano?: 'sm' | 'md' }) {
    const cambiarCantidad = (nueva: number) => {
        router.patch(
            `/carrito/items/${item.id}`,
            { cantidad: nueva },
            { preserveScroll: true },
        );
    };

    const boton = tamano === 'sm' ? 'w-6 h-6 text-sm' : 'w-7 h-7 text-base';

    return (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white p-0.5">
            <button
                onClick={() => cambiarCantidad(item.cantidad - 1)}
                disabled={item.cantidad <= 1}
                className={`${boton} rounded-full flex items-center justify-center text-gray-900 hover:bg-mosso-yellow disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold`}
                aria-label="Disminuir cantidad"
            >
                −
            </button>
            <span className="w-6 text-center text-sm font-bold text-gray-900 tabular-nums">
                {item.cantidad}
            </span>
            <button
                onClick={() => cambiarCantidad(item.cantidad + 1)}
                disabled={item.cantidad >= 99}
                className={`${boton} rounded-full flex items-center justify-center text-gray-900 hover:bg-mosso-yellow disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold`}
                aria-label="Aumentar cantidad"
            >
                +
            </button>
        </div>
    );
}

/** Fila de la tabla de escritorio (lg+). */
function FilaTabla({ item, numero }: { item: ItemCarrito; numero: number }) {
    const eliminar = () => {
        router.delete(`/carrito/items/${item.id}`, { preserveScroll: true });
    };

    return (
        <tr className="hover:bg-mosso-cream/40 transition-colors">
            <td className="px-4 py-3 text-gray-400 tabular-nums">{numero}</td>
            <td className="px-4 py-3">
                <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <SinImagenIcon />
                    )}
                </div>
            </td>
            <td className="px-4 py-3 max-w-xs">
                <p className="font-medium text-gray-900 line-clamp-2">{item.nombre}</p>
                {item.marca && (
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{item.marca}</p>
                )}
            </td>
            <td className="px-4 py-3 text-right text-gray-600 tabular-nums whitespace-nowrap">
                S/ {item.precio_unitario.toFixed(2)}
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center">
                    <SelectorCantidad item={item} />
                </div>
            </td>
            <td className="px-4 py-3 text-right font-black text-gray-900 tabular-nums whitespace-nowrap">
                S/ {item.subtotal.toFixed(2)}
            </td>
            <td className="px-4 py-3 text-right">
                <button
                    onClick={eliminar}
                    className="text-gray-300 hover:text-mosso-red transition-colors"
                    aria-label="Eliminar producto"
                >
                    <TrashIcon />
                </button>
            </td>
        </tr>
    );
}

/** Tarjeta para mobile/tablet (< lg): cantidad y total van juntos, al lado, no debajo del nombre. */
function TarjetaItem({ item }: { item: ItemCarrito }) {
    const eliminar = () => {
        router.delete(`/carrito/items/${item.id}`, { preserveScroll: true });
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
            <div className="flex gap-3">
                <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <SinImagenIcon />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.nombre}</p>
                    {item.marca && (
                        <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{item.marca}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">S/ {item.precio_unitario.toFixed(2)} c/u</p>
                </div>

                <button
                    onClick={eliminar}
                    className="text-gray-300 hover:text-mosso-red transition-colors shrink-0"
                    aria-label="Eliminar producto"
                >
                    <TrashIcon />
                </button>
            </div>

            {/* Cantidad y total: en la misma fila, al lado uno del otro */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <SelectorCantidad item={item} tamano="sm" />
                <span className="text-sm font-black text-gray-900 tabular-nums">
                    S/ {item.subtotal.toFixed(2)}
                </span>
            </div>
        </div>
    );
}

function EstadoVacio() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
            <svg
                className="w-16 h-16 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <circle cx="9" cy="21" r="1" strokeWidth="2" />
                <circle cx="20" cy="21" r="1" strokeWidth="2" />
                <path
                    strokeWidth="2"
                    d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                />
            </svg>
            <p className="text-lg font-medium text-gray-500">Tu carrito está vacío</p>
            <Link
                href="/"
                className="bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 font-bold px-6 py-3 rounded-full text-sm transition-colors"
            >
                Ver productos
            </Link>
        </div>
    );
}

function SinImagenIcon() {
    return (
        <svg
            className="w-8 h-8 text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
    );
}
