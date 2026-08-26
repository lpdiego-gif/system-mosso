import { useAgregarAlCarrito } from '@/hooks/use-agregar-al-carrito';
import { useFavoritos } from '@/hooks/use-favoritos';
import StorefrontLayout from '@/layouts/storefront-layout';
import { Link } from '@inertiajs/react';
import type { ProductoCard } from '@/types/producto';

interface Props {
    productos: ProductoCard[];
}

export default function Ofertas({ productos }: Props) {
    return (
        <StorefrontLayout>
            {/* Hero de ofertas */}
            <section className="bg-mosso-red/10 border-b border-mosso-red/20 px-6 py-10">
                <div className="max-w-[1440px] mx-auto flex items-center gap-4">
                    <span className="text-4xl select-none">🏷️</span>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">
                            Ofertas especiales
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm">
                            Productos con descuento activo — precios rebajados por tiempo limitado.
                        </p>
                    </div>
                </div>
            </section>

            <div className="max-w-[1440px] mx-auto px-6 py-8 pb-16">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">Inicio</Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Ofertas</span>
                </nav>

                {/* Contador */}
                <p className="text-sm text-gray-500 mb-6">
                    <span className="font-bold text-gray-900">{productos.length}</span>{' '}
                    {productos.length === 1 ? 'producto en oferta' : 'productos en oferta'}
                </p>

                {productos.length === 0 ? (
                    <EstadoVacio />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {productos.map((p) => (
                            <TarjetaOferta key={p.id} producto={p} />
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

function EstadoVacio() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 7h.01M7 3h5l8 8a2 2 0 0 1 0 2.83L13.83 21A2 2 0 0 1 11 21L3 13a2 2 0 0 1 0-2.83L7 7Z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">No hay ofertas activas en este momento</p>
            <p className="text-sm text-gray-400 text-center max-w-xs">
                Pronto habrá descuentos disponibles. Mientras tanto, revisa nuestro catálogo completo.
            </p>
            <Link href="/" className="mt-2 bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 font-bold px-6 py-3 rounded-full text-sm transition-colors cursor-pointer">
                Ver todos los productos
            </Link>
        </div>
    );
}

function TarjetaOferta({ producto }: { producto: ProductoCard }) {
    const { toggle, esFavorito } = useFavoritos();
    const { agregar, agregando, agregado } = useAgregarAlCarrito(producto.id);
    const favorito = esFavorito(producto.id);
    const ahorro = producto.precio - producto.precioFinal;

    return (
        <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white flex flex-col">
            <span className="absolute top-2 left-2 bg-mosso-red text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                -{producto.porcentajeOff}%
            </span>

            <button
                onClick={() => toggle(producto)}
                aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                className={`absolute top-2 right-2 z-10 transition-colors ${favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'}`}
            >
                <HeartIcon filled={favorito} />
            </button>

            <Link href={producto.href} className="block flex-1">
                <div className="h-40 flex items-center justify-center mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    {producto.imagen
                        ? <img src={producto.imagen} alt={producto.nombre} className="max-h-full max-w-full object-contain" />
                        : <SinImagenIcon />
                    }
                </div>

                <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">{producto.nombre}</p>
                {producto.marca && (
                    <p className="text-xs text-gray-400 uppercase mt-0.5 tracking-wide">{producto.marca}</p>
                )}

                <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-mosso-red">
                            S/ {producto.precioFinal.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                            S/ {producto.precio.toFixed(2)}
                        </span>
                    </div>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">
                        Ahorras S/ {ahorro.toFixed(2)}
                    </p>
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
