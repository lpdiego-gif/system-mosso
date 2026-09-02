import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';
import { useAgregarAlCarrito } from '@/hooks/use-agregar-al-carrito';
import { useFavoritos } from '@/hooks/use-favoritos';
import { imagenProducto, onImagenError } from '@/types/producto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubcategoriaItem {
    id: number;
    nombre: string;
}

interface CategoriaItem {
    id: number;
    nombre: string;
    subcategorias: SubcategoriaItem[];
}

interface AnimalItem {
    id: number;
    nombre: string;
    categorias: CategoriaItem[];
}

interface ProductoCatalogo {
    id: number;
    nombre: string;
    marca: string | null;
    imagen: string | null;
    precio: number;
    precioFinal: number;
    porcentajeOff: number | null;
    animal: string | null;
    animal_id: number | null;
    categoria: string | null;
    categoria_id: number | null;
    subcategoria: string | null;
    subcategoria_id: number | null;
    href: string;
}

interface Props {
    animales: AnimalItem[];
    productos: ProductoCatalogo[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogoPublico({ animales, productos }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [animalId, setAnimalId] = useState<number | null>(null);
    const [categoriaId, setCategoriaId] = useState<number | null>(null);
    const [subcategoriaId, setSubcategoriaId] = useState<number | null>(null);

    const animalActual = animales.find((a) => a.id === animalId) ?? null;
    const categorias   = animalActual?.categorias ?? [];
    const categoriaActual = categorias.find((c) => c.id === categoriaId) ?? null;
    const subcategorias   = categoriaActual?.subcategorias ?? [];

    function seleccionarAnimal(id: number | null) {
        setAnimalId(id);
        setCategoriaId(null);
        setSubcategoriaId(null);
    }

    function seleccionarCategoria(id: number | null) {
        setCategoriaId(id);
        setSubcategoriaId(null);
    }

    const filtrados = useMemo(() => {
        const q = busqueda.toLowerCase().trim();
        return productos.filter((p) => {
            if (q && !p.nombre.toLowerCase().includes(q)) return false;
            if (subcategoriaId !== null) return p.subcategoria_id === subcategoriaId;
            if (categoriaId !== null)    return p.categoria_id === categoriaId;
            if (animalId !== null)       return p.animal_id === animalId;
            return true;
        });
    }, [productos, busqueda, animalId, categoriaId, subcategoriaId]);

    const [compartiendo, setCompartiendo] = useState(false);
    const [compartirMsg, setCompartirMsg] = useState<{ tipo: 'info' | 'error'; texto: string } | null>(null);

    const pdfUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (busqueda.trim()) params.set('q', busqueda.trim());
        if (subcategoriaId !== null)      params.set('subcategoria', String(subcategoriaId));
        else if (categoriaId !== null)    params.set('categoria', String(categoriaId));
        else if (animalId !== null)       params.set('animal', String(animalId));
        const qs = params.toString();
        return `/catalogo/pdf${qs ? `?${qs}` : ''}`;
    }, [busqueda, animalId, categoriaId, subcategoriaId]);

    const hayFiltros = busqueda !== '' || animalId !== null;

    async function handleCompartirWhatsApp() {
        setCompartiendo(true);
        setCompartirMsg(null);

        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), 60_000); // 60 s

        try {
            const res = await fetch(pdfUrl, { signal: abort.signal });
            clearTimeout(timer);

            if (!res.ok) {
                throw new Error(`Error del servidor (${res.status})`);
            }

            const blob = await res.blob();
            const file  = new File([blob], 'catalogo-mosso.pdf', { type: 'application/pdf' });
            const canShareFile =
                typeof navigator.canShare === 'function' &&
                navigator.canShare({ files: [file] });

            if (canShareFile) {
                // Móvil con HTTPS: abre el selector nativo (WhatsApp aparece como opción)
                await navigator.share({ files: [file], title: 'Catálogo Mosso' });
            } else {
                // Desktop o navegador sin Web Share API: descarga el PDF
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = 'catalogo-mosso.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setCompartirMsg({
                    tipo:  'info',
                    texto: 'PDF descargado. Adjúntalo manualmente en tu chat de WhatsApp.',
                });
            }
        } catch (err) {
            clearTimeout(timer);
            const name = err instanceof Error ? err.name : '';
            // NotAllowedError = usuario cerró el selector nativo sin compartir (no es un error)
            if (name !== 'NotAllowedError' && name !== 'AbortError') {
                setCompartirMsg({ tipo: 'error', texto: 'No se pudo generar el PDF. Intenta de nuevo.' });
            } else if (name === 'AbortError') {
                setCompartirMsg({ tipo: 'error', texto: 'Tiempo de espera agotado. El catálogo es muy grande — aplica filtros primero.' });
            }
        } finally {
            setCompartiendo(false);
        }
    }

    return (
        <StorefrontLayout>
            <Head>
                <title>Catálogo de Productos</title>
                <meta head-key="description" name="description" content="Encuentra todos nuestros productos para mascotas: alimento, accesorios, juguetes y más." />
                <meta head-key="og:type" property="og:type" content="website" />
                <meta head-key="og:title" property="og:title" content="Catálogo de Productos — Mosso" />
                <meta head-key="og:description" property="og:description" content="Encuentra todos nuestros productos para mascotas: alimento, accesorios y más." />
                <meta head-key="og:image" property="og:image" content="/image/logo-full.png" />
                <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            </Head>

            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 py-8">
                    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                        <Link href="/" className="hover:text-mosso-yellow transition-colors">
                            Inicio
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-medium">Catálogo</span>
                    </nav>
                    <h1 className="text-3xl font-black text-gray-900">Catálogo de Productos</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Encuentra todo lo que tu mascota necesita
                    </p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-wrap gap-2.5 items-center">

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar productos…"
                            className="pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mosso-yellow/50 bg-gray-50 w-52"
                        />
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Animal */}
                    <select
                        value={animalId ?? ''}
                        onChange={(e) => seleccionarAnimal(e.target.value ? Number(e.target.value) : null)}
                        className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mosso-yellow/50 cursor-pointer"
                    >
                        <option value="">Todos los animales</option>
                        {animales.map((a) => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>

                    {/* Categoría — aparece cuando hay animal seleccionado */}
                    {categorias.length > 0 && (
                        <select
                            value={categoriaId ?? ''}
                            onChange={(e) => seleccionarCategoria(e.target.value ? Number(e.target.value) : null)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mosso-yellow/50 cursor-pointer"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    )}

                    {/* Subcategoría — aparece cuando hay categoría seleccionada */}
                    {subcategorias.length > 0 && (
                        <select
                            value={subcategoriaId ?? ''}
                            onChange={(e) => setSubcategoriaId(e.target.value ? Number(e.target.value) : null)}
                            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mosso-yellow/50 cursor-pointer"
                        >
                            <option value="">Todas las subcategorías</option>
                            {subcategorias.map((s) => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                    )}

                    {/* Limpiar filtros */}
                    {hayFiltros && (
                        <button
                            onClick={() => { setBusqueda(''); seleccionarAnimal(null); }}
                            className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors whitespace-nowrap"
                        >
                            Limpiar
                        </button>
                    )}

                    <div className="flex-1" />

                    {/* Compartir PDF por WhatsApp */}
                    <button
                        onClick={handleCompartirWhatsApp}
                        disabled={compartiendo}
                        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {compartiendo ? (
                            <SpinnerIcon className="w-4 h-4 flex-shrink-0 animate-spin" />
                        ) : (
                            <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
                        )}
                        {compartiendo ? 'Generando…' : 'Compartir PDF'}
                    </button>

                    {/* Ver catálogo en PDF (se abre en una pestaña nueva; el usuario decide si lo descarga desde el visor del navegador) */}
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                        <PdfIcon className="w-4 h-4 flex-shrink-0" />
                        Ver catálogo en PDF
                    </a>
                </div>

                {/* Mensaje de estado del botón compartir */}
                {compartirMsg && (
                    <div className={`px-6 pb-3 text-sm ${compartirMsg.tipo === 'error' ? 'text-red-600' : 'text-blue-700'}`}>
                        {compartirMsg.tipo === 'info' ? '✓ ' : '⚠ '}
                        {compartirMsg.texto}
                    </div>
                )}
            </div>

            {/* Contador */}
            <div className="max-w-[1440px] mx-auto px-6 pt-5 pb-2">
                <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{filtrados.length}</span>{' '}
                    {filtrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                    {hayFiltros && (
                        <span className="text-gray-400"> (filtrado)</span>
                    )}
                </p>
            </div>

            {/* Grid / Empty */}
            <div className="max-w-[1440px] mx-auto px-6 py-4 pb-20">
                {filtrados.length === 0 ? (
                    <EstadoVacio busqueda={busqueda} onLimpiar={() => { setBusqueda(''); seleccionarAnimal(null); }} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtrados.map((p) => (
                            <ProductoCard key={p.id} producto={p} />
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}

// ─── Product card ──────────────────────────────────────────────────────────────

function ProductoCard({ producto }: { producto: ProductoCatalogo }) {
    const { toggle, esFavorito } = useFavoritos();
    const { agregar, agregando, agregado } = useAgregarAlCarrito(producto.id);
    const favorito      = esFavorito(producto.id);
    const tieneDescuento = producto.porcentajeOff !== null;

    return (
        <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white flex flex-col">
            {tieneDescuento && (
                <span className="absolute top-2 left-2 bg-mosso-red text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                    -{producto.porcentajeOff}%
                </span>
            )}

            <button
                onClick={() => toggle(producto as Parameters<typeof toggle>[0])}
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
                {producto.subcategoria && (
                    <p className="text-xs text-gray-300 mt-0.5">
                        {[producto.animal, producto.subcategoria].filter(Boolean).join(' › ')}
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

// ─── Empty state ───────────────────────────────────────────────────────────────

function EstadoVacio({ busqueda, onLimpiar }: { busqueda: string; onLimpiar: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-28 text-gray-400 gap-4">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                />
            </svg>
            <p className="text-lg font-medium text-gray-500">
                {busqueda
                    ? `Sin resultados para "${busqueda}"`
                    : 'Sin productos en esta selección'}
            </p>
            <button
                onClick={onLimpiar}
                className="text-sm text-mosso-yellow hover:underline font-bold"
            >
                Limpiar filtros
            </button>
        </div>
    );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
            />
        </svg>
    );
}

function SpinnerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.557 4.121 1.529 5.849L.057 23.885a.5.5 0 0 0 .606.61l6.197-1.63A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.5-5.2-1.373l-.373-.213-3.867 1.018 1.036-3.77-.234-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
    );
}

function PdfIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3 3-3M3 17V7a2 2 0 0 1 2-2h6l2 2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
            />
        </svg>
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
