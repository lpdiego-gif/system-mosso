import { Link } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { ServicioListadoProps } from '@/types/servicio';

export default function ServiciosIndex({ titulo, tipos, tipoActivo, servicios }: ServicioListadoProps) {
    return (
        <StorefrontLayout>
            {/* Breadcrumb */}
            <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-2">
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="hover:text-mosso-yellow transition-colors">
                        Inicio
                    </Link>
                    <span className="text-gray-300">/</span>
                    {tipoActivo ? (
                        <>
                            <Link href="/servicios" className="hover:text-mosso-yellow transition-colors">
                                Servicios
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-900 font-medium">{tipoActivo}</span>
                        </>
                    ) : (
                        <span className="text-gray-900 font-medium">Servicios</span>
                    )}
                </nav>
            </div>

            {/* Encabezado */}
            <div className="max-w-[1440px] mx-auto px-6 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900">{titulo}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {servicios.length} {servicios.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
                </p>

                {tipos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                            href="/servicios"
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                                !tipoActivo ? 'bg-mosso-yellow text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Todos
                        </Link>
                        {tipos.map((t) => (
                            <Link
                                key={t.id_tipo_servicio}
                                href={`/servicios/${t.id_tipo_servicio}`}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                                    tipoActivo === t.nombre ? 'bg-mosso-yellow text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {t.nombre}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid de servicios */}
            <div className="max-w-[1440px] mx-auto px-6 py-8 pb-16">
                {servicios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-lg font-medium">Aún no hay servicios disponibles.</p>
                        <Link href="/" className="text-sm text-mosso-yellow hover:underline font-bold">
                            Volver al inicio
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {servicios.map((s) => (
                            <Link
                                key={s.id}
                                href={s.href}
                                className="group border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all duration-200 flex flex-col"
                            >
                                <div className="h-44 bg-gray-50 overflow-hidden">
                                    {s.imagen ? (
                                        <img
                                            src={s.imagen}
                                            alt={s.nombre_servicio}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-wide text-mosso-red">{s.tipo}</span>
                                    <h2 className="mt-1 text-base font-black text-gray-900 line-clamp-1">{s.nombre_servicio}</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">{s.nombre_negocio}</p>
                                    {s.descripcion && (
                                        <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">{s.descripcion}</p>
                                    )}
                                    <span className="mt-3 text-sm font-bold text-gray-900 group-hover:text-mosso-yellow transition-colors">
                                        Ver detalle →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
