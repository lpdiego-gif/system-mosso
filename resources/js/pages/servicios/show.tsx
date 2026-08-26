import { Link } from '@inertiajs/react';
import { useState } from 'react';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { ServicioHorarioDetalle, ServicioShowProps } from '@/types/servicio';

const ORDEN_DIAS: Record<string, number> = {
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
    Domingo: 7,
};

function agruparHorarios(horarios: ServicioHorarioDetalle[]) {
    const ordenados = [...horarios].sort((a, b) => (ORDEN_DIAS[a.dia_semana] ?? 8) - (ORDEN_DIAS[b.dia_semana] ?? 8));

    const grupos = new Map<string, string[]>();

    ordenados.forEach((h) => {
        const clave = `${h.hora_inicio ?? ''}__${h.hora_fin ?? ''}`;
        const lista = grupos.get(clave) ?? [];
        lista.push(h.dia_semana);
        grupos.set(clave, lista);
    });

    return Array.from(grupos.entries()).map(([clave, dias]) => {
        const [inicio, fin] = clave.split('__');

        let diasTexto: string;

        if (dias.length === 1) {
            diasTexto = dias[0];
        } else if (dias.length === 2) {
            diasTexto = `${dias[0]} y ${dias[1]}`;
        } else {
            diasTexto = `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}`;
        }

        return {
            dias: diasTexto,
            horario: inicio && fin ? `${inicio} - ${fin}` : 'Consultar horario',
        };
    });
}

export default function ServicioShow({ breadcrumbs, servicio }: ServicioShowProps) {
    const [imagenActiva, setImagenActiva] = useState(0);
    const imagenes = servicio.imagenes;
    const grupoHorarios = agruparHorarios(servicio.horarios);

    return (
        <StorefrontLayout>
            {/* Breadcrumb */}
            <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-2">
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

            <div className="max-w-[1200px] mx-auto px-6 py-6 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna izquierda: información */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-mosso-red">
                            <ServicioIcon />
                            <span className="text-xs font-bold uppercase tracking-wide">{servicio.tipo}</span>
                        </div>

                        <h1 className="mt-2 text-3xl font-black text-gray-900">{servicio.nombre_servicio}</h1>
                        <p className="text-sm text-gray-400 mt-1">{servicio.nombre_negocio}</p>

                        {servicio.descripcion && (
                            <p className="mt-4 text-gray-600 leading-relaxed">{servicio.descripcion}</p>
                        )}

                        {(servicio.direccion || servicio.distrito) && (
                            <p className="mt-3 text-sm text-gray-500 flex items-center gap-1.5">
                                <PinIcon />
                                {[servicio.direccion, servicio.distrito].filter(Boolean).join(', ')}
                            </p>
                        )}

                        <div className="my-6 border-t border-gray-100" />

                        {/* Responsable */}
                        {servicio.responsable && (
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 shrink-0">
                                    {servicio.foto_responsable ? (
                                        <img src={servicio.foto_responsable} alt={servicio.responsable} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                                            <PersonIcon />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{servicio.responsable}</p>
                                    <p className="text-sm text-gray-400">Responsable de {servicio.nombre_servicio}</p>
                                </div>
                            </div>
                        )}

                        {/* Horarios */}
                        {grupoHorarios.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Horario de atención</h3>
                                <div className="space-y-1.5">
                                    {grupoHorarios.map((g, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <ClockIcon />
                                            <span className="font-medium">{g.dias}:</span>
                                            <span>{g.horario}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Redes sociales */}
                        {servicio.redes.length > 0 && (
                            <div className="mt-6 flex items-center gap-3">
                                {servicio.redes.map((r, i) => (
                                    <a
                                        key={i}
                                        href={r.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-mosso-yellow hover:text-gray-900 transition-colors"
                                        aria-label={r.red}
                                        title={r.red}
                                    >
                                        <RedIcon nombre={r.red} />
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Contacto */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            {servicio.whatsapp_href ? (
                                <a
                                    href={servicio.whatsapp_href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white font-bold text-sm px-6 py-3 hover:opacity-90 transition-opacity"
                                >
                                    <WhatsappIcon />
                                    Separar cita por WhatsApp
                                </a>
                            ) : servicio.correo_contacto ? (
                                <a
                                    href={`mailto:${servicio.correo_contacto}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-mosso-yellow text-gray-900 font-bold text-sm px-6 py-3 hover:opacity-90 transition-opacity"
                                >
                                    Contactar por correo
                                </a>
                            ) : (
                                <p className="text-sm text-gray-400">Este servicio aún no tiene un medio de contacto registrado.</p>
                            )}
                        </div>
                    </div>

                    {/* Columna derecha: galería */}
                    <div>
                        {imagenes.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50">
                                    <img
                                        src={imagenes[imagenActiva].url}
                                        alt={servicio.nombre_servicio}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                {imagenes.length > 1 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {imagenes.map((img, i) => (
                                            <button
                                                key={img.id}
                                                type="button"
                                                onClick={() => setImagenActiva(i)}
                                                className={`aspect-square rounded-lg overflow-hidden bg-gray-50 ring-2 transition-all ${
                                                    imagenActiva === i ? 'ring-mosso-yellow' : 'ring-transparent hover:ring-gray-200'
                                                }`}
                                            >
                                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-[4/3] rounded-2xl bg-gray-50 flex items-center justify-center text-gray-200">
                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>

                {/* Beneficios */}
                {servicio.beneficios.length > 0 && (
                    <div className="mt-14">
                        <h2 className="text-xl font-black text-gray-900 mb-5">¿Por qué elegirnos?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {servicio.beneficios.map((b, i) => (
                                <div key={i} className="rounded-xl border border-gray-100 bg-white p-5">
                                    {b.icono && <div className="text-2xl mb-2">{b.icono}</div>}
                                    <h3 className="font-bold text-gray-900">{b.titulo}</h3>
                                    {b.descripcion && <p className="mt-1 text-sm text-gray-500">{b.descripcion}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

function ServicioIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1118 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function PersonIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path strokeLinecap="round" d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
    );
}

function WhatsappIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38a9.9 9.9 0 004.71 1.2h.01c5.46 0 9.9-4.45 9.9-9.91C22 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.11.31.02.5-.09.19-.14.31-.27.47-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.61-.07.16-.19.68-.79.87-1.06.18-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.13.07.7-.17 1.38z" />
        </svg>
    );
}

function RedIcon({ nombre }: { nombre: string }) {
    const n = nombre.toLowerCase();

    if (n.includes('face')) {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12a10 10 0 10-11.56 9.87v-6.98H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.98A10 10 0 0022 12z" />
            </svg>
        );
    }

    if (n.includes('insta')) {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
        );
    }

    if (n.includes('tiktok')) {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 2h-3v13.2a2.8 2.8 0 11-2.8-2.8c.2 0 .4 0 .6.05V9.4a5.8 5.8 0 105 5.75V8.6a7.4 7.4 0 004.2 1.3V6.9a4.4 4.4 0 01-4-4.9z" />
            </svg>
        );
    }

    if (n.includes('whatsapp')) {
        return <WhatsappIcon />;
    }

    if (n.includes('youtube')) {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9 2 10.7v1.6C2 14 2.2 15.8 2.2 15.8s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.2 7.2.2 7.2.2s3.9 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM9.9 14.6V8.6l5.4 3-5.4 3z" />
            </svg>
        );
    }

    return <ServicioIcon />;
}
