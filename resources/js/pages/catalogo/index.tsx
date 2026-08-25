import { useFavoritos } from '@/hooks/use-favoritos';
import StorefrontLayout from '@/layouts/storefront-layout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ProductoCard } from '@/types/producto';

interface Breadcrumb {
    label: string;
    href: string | null;
}

interface Props {
    titulo: string;
    breadcrumbs: Breadcrumb[];
    productos: ProductoCard[];
}

export default function CatalogoIndex({ titulo, breadcrumbs, productos }: Props) {
    return (
        <StorefrontLayout>
            {/* Breadcrumb */}
            <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-2">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">
                        Inicio
                    </Link>
                    {breadcrumbs.map((b, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="text-gray-300">/</span>
                            {b.href ? (
                                <Link href={b.href} className="hover:text-mosso-yellow transition-colors">
                                    {b.label}
                                </Link>
                            ) : (
                                <span className="text-gray-900 font-medium">{b.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            </div>

            {/* Encabezado */}
            <div className="max-w-[1440px] mx-auto px-6 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900">{titulo}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {productos.length}{' '}
                    {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
            </div>

            {/* Grid de productos */}
            <div className="max-w-[1440px] mx-auto px-6 py-8 pb-16">
                {productos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                        <svg
                            className="w-16 h-16 text-gray-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                            />
                        </svg>
                        <p className="text-lg font-medium">No hay productos en esta categoría aún.</p>
                        <Link href="/" className="text-sm text-mosso-yellow hover:underline font-bold">
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {productos.map((p) => (
                            <ProductoCard key={p.id} producto={p} />
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

function ProductoCard({ producto }: { producto: ProductoCard }) {
    const { toggle, esFavorito } = useFavoritos();
    const [agregando, setAgregando] = useState(false);
    const favorito = esFavorito(producto.id);
    const tieneDescuento = producto.porcentajeOff !== null;

    const agregarAlCarrito = () => {
        setAgregando(true);
        router.post(
            '/carrito/items',
            { producto_id: producto.id, cantidad: 1 },
            {
                preserveScroll: true,
                onFinish: () => setAgregando(false),
            },
        );
    };

    return (
        <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white flex flex-col">
            {tieneDescuento && (
                <span className="absolute top-2 left-2 bg-mosso-red text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                    -{producto.porcentajeOff}%
                </span>
            )}

            <button
                onClick={() => toggle(producto)}
                aria-label="Agregar a favoritos"
                className={`absolute top-2 right-2 z-10 transition-colors ${
                    favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'
                }`}
            >
                <HeartIcon filled={favorito} />
            </button>

            <Link href={producto.href} className="block flex-1">
                <div className="h-40 flex items-center justify-center mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    {producto.imagen ? (
                        <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <svg
                            className="w-14 h-14 text-gray-200"
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
                    )}
                </div>

                <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
                    {producto.nombre}
                </p>
                {producto.marca && (
                    <p className="text-xs text-gray-400 uppercase mt-0.5 tracking-wide">
                        {producto.marca}
                    </p>
                )}

                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-black text-gray-900">
                        S/ {producto.precioFinal.toFixed(2)}
                    </span>
                    {tieneDescuento && (
                        <span className="text-sm text-gray-400 line-through">
                            S/ {producto.precio.toFixed(2)}
                        </span>
                    )}
                </div>
            </Link>

            <button
                onClick={agregarAlCarrito}
                disabled={agregando}
                className="mt-3 w-full bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 disabled:cursor-wait text-gray-900 text-sm font-bold py-2 rounded-full transition-colors"
            >
                {agregando ? 'Agregando…' : 'Agregar al carrito'}
            </button>
        </div>
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
