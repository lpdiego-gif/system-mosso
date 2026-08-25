import StorefrontLayout from '@/layouts/storefront-layout';
import { useFavoritos } from '@/hooks/use-favoritos';
import type { ProductoCard } from '@/types/producto';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Favoritos() {
    const { favoritos, toggle, total } = useFavoritos();

    return (
        <StorefrontLayout>
            <div className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-orange-500 transition-colors">Inicio</Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Mis favoritos</span>
                </nav>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Mis favoritos</h1>
                    {total > 0 && (
                        <span className="text-sm text-gray-500">
                            {total} {total === 1 ? 'producto' : 'productos'}
                        </span>
                    )}
                </div>

                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-500">Aún no tienes favoritos</p>
                        <p className="text-sm text-gray-400">Toca el corazón en cualquier producto para guardarlo aquí.</p>
                        <Link href="/" className="mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors">
                            Ver productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {favoritos.map((p) => (
                            <TarjetaFavorito key={p.id} producto={p} onQuitar={() => toggle(p)} />
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

function TarjetaFavorito({ producto, onQuitar }: { producto: ProductoCard; onQuitar: () => void }) {
    const [agregando, setAgregando] = useState(false);
    const tieneDescuento = producto.porcentajeOff !== null;

    const agregarAlCarrito = () => {
        setAgregando(true);
        router.post('/carrito/items', { producto_id: producto.id, cantidad: 1 }, {
            preserveScroll: true,
            onFinish: () => setAgregando(false),
        });
    };

    return (
        <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow bg-white flex flex-col">
            {tieneDescuento && (
                <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    -{producto.porcentajeOff}%
                </span>
            )}
            <button
                onClick={onQuitar}
                aria-label="Quitar de favoritos"
                className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700 transition-colors"
                title="Quitar de favoritos"
            >
                <HeartIcon filled />
            </button>

            <Link href={producto.href} className="block flex-1">
                <div className="h-40 flex items-center justify-center mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    {producto.imagen
                        ? <img src={producto.imagen} alt={producto.nombre} className="max-h-full max-w-full object-contain" />
                        : <SinImagenIcon />
                    }
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">{producto.nombre}</p>
                {producto.marca && <p className="text-xs text-gray-500 uppercase mt-0.5">{producto.marca}</p>}
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-blue-600">S/ {producto.precioFinal.toFixed(2)}</span>
                    {tieneDescuento && <span className="text-sm text-gray-400 line-through">S/ {producto.precio.toFixed(2)}</span>}
                </div>
            </Link>

            <button
                onClick={agregarAlCarrito}
                disabled={agregando}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-full transition-colors"
            >
                {agregando ? 'Agregando…' : 'Agregar al carrito'}
            </button>
        </div>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
    );
}

function SinImagenIcon() {
    return (
        <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}
