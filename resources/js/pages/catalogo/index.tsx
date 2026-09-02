import { useState } from 'react';
import { useAgregarAlCarrito } from '@/hooks/use-agregar-al-carrito';
import { useFavoritos } from '@/hooks/use-favoritos';
import { useCatalogoFiltros, type NivelCatalogo, type OrdenCatalogo } from '@/hooks/use-catalogo-filtros';
import PanelFiltros from '@/components/catalogo/panel-filtros';
import StorefrontLayout from '@/layouts/storefront-layout';
import { Link } from '@inertiajs/react';
import type { ProductoCard as ProductoCardType, ProductoCatalogo } from '@/types/producto';
import { imagenProducto, onImagenError } from '@/types/producto';

interface Breadcrumb {
    label: string;
    href: string | null;
}

interface Props {
    titulo: string;
    nivel: NivelCatalogo;
    breadcrumbs: Breadcrumb[];
    productos: ProductoCatalogo[];
}

const OPCIONES_ORDEN: { value: OrdenCatalogo; label: string }[] = [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'precio_asc', label: 'Precio: menor a mayor' },
    { value: 'precio_desc', label: 'Precio: mayor a menor' },
    { value: 'novedades', label: 'Novedades' },
    { value: 'descuento', label: 'Mayor descuento' },
];

export default function CatalogoIndex({ titulo, nivel, breadcrumbs, productos }: Props) {
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

    const {
        filtros,
        resultado,
        rangoCompleto,
        precioActivo,
        opcionesMarca,
        opcionesCategoria,
        opcionesSubcategoria,
        hayFiltrosActivos,
        setOrden,
        setOferta,
        setPrecio,
        toggleMarca,
        seleccionarCategoria,
        seleccionarSubcategoria,
        limpiarFiltros,
    } = useCatalogoFiltros(productos, nivel);

    const nombreMarca = (id: number) => opcionesMarca.find((m) => m.id === id)?.nombre ?? '';
    const nombreCategoria = opcionesCategoria.find((c) => c.id === filtros.categoriaId)?.nombre;
    const nombreSubcategoria = opcionesSubcategoria.find((s) => s.id === filtros.subcategoriaId)?.nombre;

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
            </div>

            <div className="max-w-[1440px] mx-auto px-6 py-6 pb-16 flex flex-col lg:flex-row gap-8">
                {/* Sidebar de filtros (desktop) */}
                {productos.length > 0 && (
                    <aside className="hidden lg:block w-64 shrink-0">
                        <PanelFiltros
                            nivel={nivel}
                            oferta={filtros.oferta}
                            onOferta={setOferta}
                            precioActivo={precioActivo}
                            rangoCompleto={rangoCompleto}
                            onPrecio={setPrecio}
                            marcasSeleccionadas={filtros.marcas}
                            opcionesMarca={opcionesMarca}
                            onToggleMarca={toggleMarca}
                            categoriaId={filtros.categoriaId}
                            opcionesCategoria={opcionesCategoria}
                            onCategoria={seleccionarCategoria}
                            subcategoriaId={filtros.subcategoriaId}
                            opcionesSubcategoria={opcionesSubcategoria}
                            onSubcategoria={seleccionarSubcategoria}
                        />
                    </aside>
                )}

                <div className="flex-1 min-w-0">
                    {/* Barra superior: contador, orden, filtros mobile */}
                    {productos.length > 0 && (
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-gray-500">
                                    {resultado.length} {resultado.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFiltrosAbiertos(true)}
                                        className="lg:hidden flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700"
                                    >
                                        <FiltroIcon /> Filtros
                                    </button>

                                    <select
                                        value={filtros.orden}
                                        onChange={(e) => setOrden(e.target.value as OrdenCatalogo)}
                                        className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-mosso-yellow focus:outline-none"
                                    >
                                        {OPCIONES_ORDEN.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {hayFiltrosActivos && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {filtros.oferta && <Chip label="En oferta" onQuitar={() => setOferta(false)} />}
                                    {filtros.precio && (
                                        <Chip
                                            label={`S/ ${filtros.precio[0]} - S/ ${filtros.precio[1]}`}
                                            onQuitar={() => setPrecio(null)}
                                        />
                                    )}
                                    {nombreCategoria && (
                                        <Chip label={nombreCategoria} onQuitar={() => seleccionarCategoria(null)} />
                                    )}
                                    {nombreSubcategoria && (
                                        <Chip label={nombreSubcategoria} onQuitar={() => seleccionarSubcategoria(null)} />
                                    )}
                                    {filtros.marcas.map((id) => (
                                        <Chip key={id} label={nombreMarca(id)} onQuitar={() => toggleMarca(id)} />
                                    ))}
                                    <button
                                        onClick={limpiarFiltros}
                                        className="text-xs font-bold text-mosso-red hover:underline ml-1"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid de productos */}
                    {productos.length === 0 ? (
                        <EstadoVacio
                            titulo="No hay productos en esta categoría aún."
                            accion={<Link href="/" className="text-sm text-mosso-yellow hover:underline font-bold">Volver al inicio</Link>}
                        />
                    ) : resultado.length === 0 ? (
                        <EstadoVacio
                            titulo="Ningún producto coincide con los filtros elegidos."
                            accion={
                                <button onClick={limpiarFiltros} className="text-sm text-mosso-yellow hover:underline font-bold">
                                    Limpiar filtros
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {resultado.map((p) => (
                                <ProductoCard key={p.id} producto={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Drawer de filtros (mobile) */}
            {filtrosAbiertos && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        aria-label="Cerrar filtros"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setFiltrosAbiertos(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white overflow-y-auto p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-gray-900">Filtros</h2>
                            <button onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar" className="text-gray-400 hover:text-gray-700">
                                <CerrarIcon />
                            </button>
                        </div>
                        <PanelFiltros
                            nivel={nivel}
                            oferta={filtros.oferta}
                            onOferta={setOferta}
                            precioActivo={precioActivo}
                            rangoCompleto={rangoCompleto}
                            onPrecio={setPrecio}
                            marcasSeleccionadas={filtros.marcas}
                            opcionesMarca={opcionesMarca}
                            onToggleMarca={toggleMarca}
                            categoriaId={filtros.categoriaId}
                            opcionesCategoria={opcionesCategoria}
                            onCategoria={seleccionarCategoria}
                            subcategoriaId={filtros.subcategoriaId}
                            opcionesSubcategoria={opcionesSubcategoria}
                            onSubcategoria={seleccionarSubcategoria}
                        />
                        <button
                            onClick={() => setFiltrosAbiertos(false)}
                            className="mt-6 w-full bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 text-sm font-bold py-2.5 rounded-full transition-colors"
                        >
                            Ver {resultado.length} {resultado.length === 1 ? 'producto' : 'productos'}
                        </button>
                    </div>
                </div>
            )}
        </StorefrontLayout>
    );
}

function EstadoVacio({ titulo, accion }: { titulo: string; accion: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                />
            </svg>
            <p className="text-lg font-medium">{titulo}</p>
            {accion}
        </div>
    );
}

function Chip({ label, onQuitar }: { label: string; onQuitar: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium pl-3 pr-1.5 py-1">
            {label}
            <button
                onClick={onQuitar}
                aria-label={`Quitar filtro ${label}`}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200 text-gray-500"
            >
                <CerrarIcon small />
            </button>
        </span>
    );
}

function ProductoCard({ producto }: { producto: ProductoCardType }) {
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
                aria-label="Agregar a favoritos"
                className={`absolute top-2 right-2 z-10 transition-colors ${
                    favorito ? 'text-mosso-red' : 'text-gray-300 hover:text-mosso-red'
                }`}
            >
                <HeartIcon filled={favorito} />
            </button>

            <Link href={producto.href} className="block flex-1">
                <div className="h-40 flex items-center justify-center mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    <img
                        src={imagenProducto(producto)}
                        alt={producto.nombre}
                        className="max-h-full max-w-full object-contain"
                        onError={onImagenError}
                    />
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

function FiltroIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
        </svg>
    );
}

function CerrarIcon({ small }: { small?: boolean }) {
    const size = small ? 10 : 20;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}
