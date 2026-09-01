import { Link } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';

interface MarcaCard {
    id: number;
    nombre: string;
    logo: string | null;
    totalProductos: number;
    href: string;
}

interface Props {
    marcas: MarcaCard[];
}

export default function MarcasIndex({ marcas }: Props) {
    return (
        <StorefrontLayout>
            {/* Breadcrumb */}
            <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-2">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">
                        Inicio
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">Marcas</span>
                </nav>
            </div>

            {/* Encabezado */}
            <div className="max-w-[1440px] mx-auto px-6 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900">Nuestras marcas</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {marcas.length} {marcas.length === 1 ? 'marca disponible' : 'marcas disponibles'}
                </p>
            </div>

            {/* Grid de marcas */}
            <div className="max-w-[1440px] mx-auto px-6 py-8 pb-16">
                {marcas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375C2.754 3.75 2.25 4.254 2.25 4.875v1.5c0 .621.504 1.125 1.125 1.125z"
                            />
                        </svg>
                        <p className="text-lg font-medium">Aún no hay marcas disponibles.</p>
                        <Link href="/" className="text-sm text-mosso-yellow hover:underline font-bold">
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {marcas.map((marca) => (
                            <Link
                                key={marca.id}
                                href={marca.href}
                                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-mosso-yellow hover:shadow-md"
                            >
                                <div className="flex h-20 w-full items-center justify-center">
                                    {marca.logo ? (
                                        <img
                                            src={marca.logo}
                                            alt={marca.nombre}
                                            className="max-h-16 max-w-full object-contain"
                                        />
                                    ) : (
                                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mosso-yellow/10 text-lg font-black text-mosso-dark">
                                            {marca.nombre.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <p className="text-center text-sm font-bold text-gray-900 group-hover:text-mosso-dark">
                                    {marca.nombre}
                                </p>

                                <p className="text-xs text-gray-400">
                                    {marca.totalProductos} {marca.totalProductos === 1 ? 'producto' : 'productos'}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
