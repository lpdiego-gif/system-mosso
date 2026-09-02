import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ProductoCarrusel } from '@/components/HomeSections';
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
    relacionados: ProductoCard[];
}

const STOCK_BAJO = 5;

export default function ProductoDetallePage({ producto, breadcrumbs, relacionados }: Props) {
    const [cantidad, setCantidad] = useState(1);
    const [agregando, setAgregando] = useState(false);
    const [agregado, setAgregado] = useState(false);
    const [imagenAmpliada, setImagenAmpliada] = useState(false);

    const { toggle, esFavorito } = useFavoritos();
    const favorito = esFavorito(producto.id);

    const agotado = producto.stock === 0;
    const stockBajo = !agotado && producto.stock <= STOCK_BAJO;
    const tieneDescuento = producto.porcentajeOff !== null;
    const ahorro = tieneDescuento ? producto.precio - producto.precioFinal : 0;

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

    useEffect(() => {
        if (!imagenAmpliada) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setImagenAmpliada(false);
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [imagenAmpliada]);

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
            <div className="mx-auto max-w-6xl px-4 pt-5 pb-1 sm:px-6">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="transition-colors hover:text-mosso-dark">
                        Inicio
                    </Link>
                    {breadcrumbs.map((b, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="text-gray-300">/</span>
                            {b.href ? (
                                <Link href={b.href} className="truncate transition-colors hover:text-mosso-dark">
                                    {b.label}
                                </Link>
                            ) : (
                                <span className="truncate font-medium text-gray-900">{b.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            </div>

            {/* Detalle */}
            <div className="mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6 lg:py-10">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

                    {/* Columna imagen */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-mosso-cream to-white shadow-sm">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute top-1/2 left-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mosso-yellow/10 blur-3xl"
                            />

                            {tieneDescuento && (
                                <span className="absolute top-4 left-4 z-10 rounded-full bg-mosso-red px-3 py-1.5 text-sm font-bold text-white shadow-md shadow-mosso-red/30">
                                    -{producto.porcentajeOff}%
                                </span>
                            )}

                            <button
                                onClick={() => toggle(productoParaFavorito)}
                                aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                className={`absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-105 ${
                                    favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'
                                }`}
                            >
                                <HeartIcon filled={favorito} />
                            </button>

                            <img
                                src={producto.imagen ?? '/image/paw-icon.png'}
                                alt={producto.nombre}
                                className="relative h-full w-full object-contain p-10 transition-transform duration-500 ease-out hover:scale-105 sm:p-14"
                                onError={onImagenError}
                            />

                            <button
                                type="button"
                                onClick={() => setImagenAmpliada(true)}
                                className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-md backdrop-blur transition-all hover:-translate-y-0.5 hover:text-gray-900 hover:shadow-lg"
                            >
                                <ExpandIcon />
                                Ver en grande
                            </button>
                        </div>
                    </div>

                    {/* Columna info */}
                    <div className="flex flex-col gap-6">

                        <div className="flex flex-col gap-3">
                            {producto.marca && (
                                <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold tracking-widest text-gray-600 uppercase">
                                    {producto.marca}
                                </span>
                            )}

                            <h1 className="text-3xl leading-[1.1] font-black text-balance text-gray-900 sm:text-4xl">
                                {producto.nombre}
                            </h1>

                            <p className="text-xs text-gray-400">
                                SKU: <span className="font-mono text-gray-500">{producto.sku}</span>
                            </p>
                        </div>

                        {/* Precio */}
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                            <div className="flex flex-wrap items-baseline gap-2.5">
                                <span className="text-2xl font-black text-gray-900 sm:text-3xl">
                                    S/ {producto.precioFinal.toFixed(2)}
                                </span>
                                {tieneDescuento && (
                                    <span className="text-sm text-gray-400 line-through">
                                        S/ {producto.precio.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            {tieneDescuento && (
                                <p className="mt-1 text-xs font-semibold text-emerald-600">
                                    Ahorras S/ {ahorro.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Disponibilidad */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {agotado ? (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-500">
                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    Agotado
                                </span>
                            ) : (
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Disponible
                                </span>
                            )}
                            {stockBajo && (
                                <span className="text-sm font-semibold text-amber-600">
                                    ¡Solo quedan {producto.stock}!
                                </span>
                            )}
                        </div>

                        {/* Descripción */}
                        {producto.descripcion && (
                            <p className="max-w-prose leading-relaxed text-gray-600">{producto.descripcion}</p>
                        )}

                        <div className="border-t border-gray-100" />

                        {/* Selector cantidad + botón */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className={`flex items-center overflow-hidden rounded-full border ${agotado ? 'border-gray-100 opacity-40' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                                    className="flex h-12 w-12 items-center justify-center text-xl text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
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
                                    className="flex h-12 w-12 items-center justify-center text-xl text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                                    disabled={agotado || cantidad >= 99}
                                    aria-label="Aumentar cantidad"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={agregar}
                                disabled={agotado || agregando}
                                className={`flex-1 rounded-full px-6 py-3.5 text-base font-bold shadow-sm transition-all sm:flex-initial ${
                                    agotado
                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400 shadow-none'
                                        : 'cursor-pointer bg-mosso-yellow text-gray-900 hover:-translate-y-0.5 hover:bg-mosso-yellow/85 hover:shadow-md disabled:cursor-wait disabled:opacity-60'
                                }`}
                            >
                                {agotado ? 'Agotado' : agregado ? '¡Agregado! ✓' : agregando ? 'Agregando…' : 'Añadir al carrito'}
                            </button>
                        </div>

                        {/* Confianza */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <TruckIcon />
                                Delivery rápido
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldIcon />
                                100% original
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <LockIcon />
                                Pago seguro
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {relacionados.length > 0 && (
                <div className="border-t border-gray-100">
                    <ProductoCarrusel titulo="También te puede interesar" productos={relacionados} />
                </div>
            )}

            {imagenAmpliada && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={producto.nombre}
                    onClick={() => setImagenAmpliada(false)}
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/90 p-4 backdrop-blur-sm sm:p-8"
                >
                    <button
                        type="button"
                        onClick={() => setImagenAmpliada(false)}
                        aria-label="Cerrar"
                        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                        <CloseIcon />
                    </button>

                    <img
                        src={producto.imagen ?? '/image/paw-icon.png'}
                        alt={producto.nombre}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[85vh] max-w-[92vw] object-contain"
                        onError={onImagenError}
                    />
                </div>
            )}
        </StorefrontLayout>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
    );
}

function ExpandIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

function TruckIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 3h15v13H1z" />
            <path d="M16 8h4l3 3v5h-7V8Z" />
            <circle cx="5.5" cy="18.5" r="1.5" />
            <circle cx="18.5" cy="18.5" r="1.5" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
