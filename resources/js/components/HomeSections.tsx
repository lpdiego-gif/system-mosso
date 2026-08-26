import { useAgregarAlCarrito } from '@/hooks/use-agregar-al-carrito';
import { useFavoritos } from '@/hooks/use-favoritos';
import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ProductoCard as ProductoCardType, MarcaCard } from '@/types/producto';

/* ============================== BENEFICIOS ============================== */

const beneficios = [
  { icono: 'truck' as const, titulo: 'Delivery rápido', texto: 'Recibe el mismo día o al siguiente' },
  { icono: 'card' as const, titulo: 'Paga seguro con Culqi', texto: 'Tarjetas, Yape y transferencias' },
  { icono: 'shield' as const, titulo: 'Calidad y confianza', texto: 'Productos 100% originales' },
  { icono: 'chat' as const, titulo: 'Atención por WhatsApp', texto: 'Te ayudamos en todo momento' },
];

export function BeneficiosBar() {
  return (
    <section className="border-t border-gray-100 bg-white px-6 py-8">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {beneficios.map((b) => (
          <div key={b.titulo} className="flex items-start gap-3">
            <span className="text-mosso-yellow shrink-0 mt-0.5">
              <IconoBeneficio nombre={b.icono} />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{b.titulo}</p>
              <p className="text-xs text-gray-500">{b.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IconoBeneficio({ nombre }: { nombre: 'truck' | 'card' | 'shield' | 'chat' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  if (nombre === 'truck') {
    return (
      <svg {...common}>
        <path d="M1 3h15v13H1z" />
        <path d="M16 8h4l3 3v5h-7V8Z" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="18.5" cy="18.5" r="1.5" />
      </svg>
    );
  }
  if (nombre === 'card') {
    return (
      <svg {...common}>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="9" x2="23" y2="9" />
      </svg>
    );
  }
  if (nombre === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
  );
}

/* ========================= CARRUSEL DE PRODUCTOS ========================= */

export function ProductoCarrusel({
  titulo,
  productos = [],
}: {
  titulo: string;
  productos?: ProductoCardType[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || productos.length === 0) return;

    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (alFinal) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 232, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(id);
  }, [pausado, productos.length]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -232 : 232, behavior: 'smooth' });
  };

  if (productos.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-10">
      <h2 className="text-2xl font-black text-center text-gray-900 mb-6">{titulo}</h2>

      <div
        className="relative"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <button
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-900 hover:bg-mosso-yellow hover:text-gray-900 transition-colors"
        >
          <ChevronLeft />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden"
        >
          {productos.map((p) => (
            <div key={p.id} className="w-48 md:w-56 shrink-0 snap-start">
              <ProductoCardItem producto={p} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Siguiente"
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center text-gray-900 hover:bg-mosso-yellow hover:text-gray-900 transition-colors"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

function ProductoCardItem({ producto }: { producto: ProductoCardType }) {
  const { toggle, esFavorito } = useFavoritos();
  const { agregar, agregando, agregado } = useAgregarAlCarrito(producto.id);
  const favorito = esFavorito(producto.id);
  const tieneDescuento = producto.porcentajeOff !== null;

  return (
    <div className="relative border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white group">
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

      <Link href={producto.href} className="block">
        <div className="h-40 flex items-center justify-center mb-3">
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="w-full h-full bg-gray-50 rounded-lg" />
          )}
        </div>

        <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </p>
        {producto.marca && (
          <p className="text-xs text-gray-400 uppercase mt-0.5 tracking-wide">{producto.marca}</p>
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

/* =========================== CARRUSEL DE MARCAS =========================== */

export function MarcaCarrusel({ marcas = [] }: { marcas?: MarcaCard[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || marcas.length === 0) return;

    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (alFinal) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 176, behavior: 'smooth' });
      }
    }, 2500);

    return () => clearInterval(id);
  }, [pausado, marcas.length]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (marcas.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-10">
      <h2 className="text-2xl font-black text-center text-gray-900 mb-6">Marcas premium para tu mascota</h2>

      <div
        className="relative"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <button
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow items-center justify-center text-gray-900 hover:bg-mosso-yellow hover:text-gray-900 hover:border-mosso-yellow transition-colors"
        >
          <ChevronLeft />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden"
        >
          {marcas.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="w-40 h-28 shrink-0 snap-start border border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 hover:shadow-md hover:border-mosso-yellow transition-all bg-white"
            >
              {m.logo
                ? <img src={m.logo} alt={m.nombre} className="max-h-14 max-w-full object-contain" />
                : <span className="text-xs font-bold text-gray-900 text-center leading-tight">{m.nombre}</span>
              }
            </Link>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Siguiente"
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow items-center justify-center text-gray-900 hover:bg-mosso-yellow hover:text-gray-900 hover:border-mosso-yellow transition-colors"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

/* ================================= ICONOS ================================= */

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
