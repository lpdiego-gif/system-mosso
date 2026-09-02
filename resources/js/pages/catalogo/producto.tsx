import { useState } from 'react';
import { Link } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';
import { useFavoritos } from '@/hooks/use-favoritos';
import type { ProductoCard } from '@/types/producto';
import { onImagenError } from '@/types/producto';

interface Breadcrumb {
    label: string;
    href: string | null;
}

interface ProductoDetallePub {
    id: number;
    sku: string;
    nombre: string;
    descripcion: string | null;
    marca: string | null;
    imagen: string | null;
    precio: number;
    precioFinal: number;
    porcentajeOff: number | null;
    stock: number;
    href: string;
}

interface Props {
    producto: ProductoDetallePub;
    breadcrumbs: Breadcrumb[];
}

export default function ProductoDetallePage({ producto, breadcrumbs }: Props) {
    const [cantidad, setCantidad] = useState(1);
    const [agregando, setAgregando] = useState(false);
    const [agregado, setAgregado] = useState(false);

    const { toggle, esFavorito } = useFavoritos();
    const favorito = esFavorito(producto.id);

    const agotado = producto.stock === 0;
    const tieneDescuento = producto.porcentajeOff !== null;

    const productoParaFavorito: ProductoCard = {
        id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        imagen: producto.imagen,
        precio: producto.precio,
        precioFinal: producto.precioFinal,
        porcentajeOff: producto.porcentajeOff,
        href: producto.href,
    };

    const agregar = async () => {
        if (agotado || agregando) return;
        setAgregando(true);
        try {
            const csrf =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch('/carrito/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ producto_id: producto.id, cantidad }),
            });
            if (res.ok) {
                const data = (await res.json()) as { cantidad: number };
                window.dispatchEvent(
                    new CustomEvent('cart-updated', { detail: { cantidad: data.cantidad } }),
                );
                setAgregado(true);
                setTimeout(() => setAgregado(false), 1800);
            }
        } finally {
            setAgregando(false);
        }
    };

    return (
        <StorefrontLayout>
            {/* Breadcrumb */}
            <div className="mx-auto max-w-[1440px] px-6 pt-6 pb-2">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="transition-colors hover:text-mosso-yellow">
                        Inicio
                    </Link>
                    {breadcrumbs.map((b, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="text-gray-300">/</span>
                            {b.href ? (
                                <Link href={b.href} className="transition-colors hover:text-mosso-yellow">
                                    {b.label}
                                </Link>
                            ) : (
                                <span className="font-medium text-gray-900">{b.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            </div>

            {/* Detalle */}
            <div className="mx-auto max-w-[1440px] px-6 py-8 pb-16">
                <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

                    {/* Columna imagen */}
                    <div className="relative mx-auto w-[160px] shrink-0 lg:mx-0">
                        <button
                            onClick={() => toggle(productoParaFavorito)}
                            aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                            className={`absolute left-2 top-2 z-10 rounded-full bg-white p-1.5 shadow transition-colors ${
                                favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'
                            }`}
                        >
                            <HeartIcon filled={favorito} />
                        </button>

                        <div className="flex h-[160px] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <img
                                src={producto.imagen ?? '/image/paw-icon.png'}
                                alt={producto.nombre}
                                className="max-h-full max-w-full object-contain"
                                onError={onImagenError}
                            />
                        </div>
                    </div>

                    {/* Columna info */}
                    <div className="flex flex-1 flex-col gap-5">

                        {/* Marca */}
                        {producto.marca && (
                            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                                {producto.marca}
                            </p>
                        )}

                        {/* Nombre */}
                        <h1 className="text-3xl font-black leading-tight text-gray-900 lg:text-4xl">
                            {producto.nombre}
                        </h1>

                        {/* Precio */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-gray-900">
                                S/ {producto.precioFinal.toFixed(2)}
                            </span>
                            {tieneDescuento && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">
                                        S/ {producto.precio.toFixed(2)}
                                    </span>
                                    <span className="rounded-lg bg-mosso-red px-2 py-0.5 text-sm font-bold text-white">
                                        -{producto.porcentajeOff}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* SKU */}
                        <p className="text-sm text-gray-400">
                            SKU: <span className="font-mono text-gray-600">{producto.sku}</span>
                        </p>

                        {/* Stock */}
                        {agotado ? (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-500">
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                                Agotado
                            </span>
                        ) : (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Disponible
                            </span>
                        )}

                        {/* Descripción (solo si existe) */}
                        {producto.descripcion && (
                            <p className="leading-relaxed text-gray-600">{producto.descripcion}</p>
                        )}

                        {/* Selector cantidad + botón */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className={`flex items-center overflow-hidden rounded-full border ${agotado ? 'border-gray-100 opacity-40' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                                    className="flex h-11 w-11 items-center justify-center text-xl text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                                    disabled={agotado || cantidad <= 1}
                                    aria-label="Disminuir cantidad"
                                >
                                    −
                                </button>
                                <span className="w-12 text-center text-base font-bold text-gray-900">
                                    {cantidad}
                                </span>
                                <button
                                    onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                                    className="flex h-11 w-11 items-center justify-center text-xl text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                                    disabled={agotado || cantidad >= 99}
                                    aria-label="Aumentar cantidad"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={agregar}
                                disabled={agotado || agregando}
                                className={`rounded-full px-6 py-3 text-base font-bold transition-colors ${
                                    agotado
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'cursor-pointer bg-mosso-yellow text-gray-900 hover:bg-mosso-yellow/85 disabled:cursor-wait disabled:opacity-60'
                                }`}
                            >
                                {agotado ? 'Agotado' : agregado ? '¡Agregado! ✓' : agregando ? 'Agregando…' : 'Añadir al carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
    );
}
