import { useAgregarAlCarrito } from '@/hooks/use-agregar-al-carrito';
import StorefrontLayout from '@/layouts/storefront-layout';
import { useFavoritos } from '@/hooks/use-favoritos';
import type { ProductoCard } from '@/types/producto';
import { imagenProducto, onImagenError } from '@/types/producto';
import { Link } from '@inertiajs/react';

interface Props {
    query: string;
    productos: ProductoCard[];
}

export default function Buscar({ query, productos }: Props) {
    return (
        <StorefrontLayout>
            <div className="max-w-[1440px] mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">Inicio</Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Buscar</span>
                </nav>

                {/* Resultados */}
                {query ? (
                    <>
                        <p className="text-sm text-gray-500 mb-6">
                            <span className="font-bold text-gray-900">{productos.length}</span>{' '}
                            {productos.length === 1 ? 'resultado' : 'resultados'} para{' '}
                            <span className="font-bold text-gray-900">"{query}"</span>
                        </p>

                        {productos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                                <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                    <path strokeWidth="2" d="m21 21-4.3-4.3" />
                                </svg>
                                <p className="text-lg font-medium">No encontramos "{query}"</p>
                                <Link href="/" className="text-sm text-mosso-yellow font-bold hover:underline">
                                    Ver catálogo completo
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {productos.map((p) => (
                                    <TarjetaProducto key={p.id} producto={p} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-500 text-sm">Escribe un término para buscar.</p>
                )}
            </div>
        </StorefrontLayout>
    );
}

function TarjetaProducto({ producto }: { producto: ProductoCard }) {
    const { toggle, esFavorito } = useFavoritos();
    const { agregar, agregando, agregado } = useAgregarAlCarrito(producto.id);
    const favorito = esFavorito(producto.id);
    const tieneDescuento = producto.porcentajeOff !== null;

    return (
        <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white flex flex-col">
            {tieneDescuento && (
                <span className="absolute top-2 left-2 bg-mosso-red text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                    -{producto.porcentajeOff}%
                </span>
            )}
            <button
                onClick={() => toggle(producto)}
                aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                className={`absolute top-2 right-2 z-10 transition-colors ${favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'}`}
            >
                <HeartIcon filled={favorito} />
            </button>

            <Link href={producto.href} className="block flex-1">
                <div className="h-40 flex items-center justify-center mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    <img src={imagenProducto(producto)} alt={producto.nombre} className="max-h-full max-w-full object-contain" onError={onImagenError} />
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">{producto.nombre}</p>
                {producto.marca && <p className="text-xs text-gray-400 uppercase mt-0.5 tracking-wide">{producto.marca}</p>}
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-black text-gray-900">S/ {producto.precioFinal.toFixed(2)}</span>
                    {tieneDescuento && <span className="text-sm text-gray-400 line-through">S/ {producto.precio.toFixed(2)}</span>}
                </div>
            </Link>

            <button
                onClick={agregar}
                disabled={agregando}
                className="mt-3 w-full cursor-pointer bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 disabled:cursor-wait text-gray-900 text-sm font-bold py-2 rounded-full transition-colors"
            >
                {agregado ? '¡Agregado! ✓' : agregando ? 'Agregando…' : 'Agregar al carrito'}
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
