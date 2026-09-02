import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { abrirAcceso } from '@/components/ModalAcceso';
import { useFavoritos } from '@/hooks/use-favoritos';
import { whatsappUrl } from '@/lib/whatsapp';
import type { EmpresaPublica } from '@/types/empresa';
import { imagenProducto, onImagenError } from '@/types/producto';
import type { ProductoCard } from '@/types/producto';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';

interface HeaderPageProps {
  empresa: EmpresaPublica | null;
  [key: string]: unknown;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <TopBar mobileOpen={mobileOpen} onToggleMobileMenu={() => setMobileOpen((v) => !v)} />
      <MegaMenu />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function TopBar({
  mobileOpen,
  onToggleMobileMenu,
}: {
  mobileOpen: boolean;
  onToggleMobileMenu: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:justify-center md:gap-8 md:px-6 md:py-3.5">
      {/* Izquierda: hamburguesa (mobile) + logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleMobileMenu}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 md:hidden"
        >
          <MenuIcon open={mobileOpen} />
        </button>

        <Logo />
      </div>

      {/* Centro: buscador. En mobile crece para llenar el espacio; en desktop es compacto y el grupo entero queda centrado. */}
      <div className="min-w-0 flex-1 md:max-w-2xl">
        <SearchBar />
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-1 md:flex">
          <HelpDropdown />
          <span className="mx-0.5 h-6 w-px bg-gray-200" aria-hidden="true" />
          <CuentaButton />
          <FavoritosButton />
          <CartButton />
        </div>
        <div className="md:hidden">
          <CartButton compact />
        </div>
      </div>
    </div>
  );
}

/** Si el nombre tiene más de 2 palabras, se muestra solo la primera (evita nombres largos en el header). */
function nombreCorto(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);

  return palabras.length > 2 ? palabras[0] : nombre;
}

function Logo() {
  const { empresa } = usePage<HeaderPageProps>().props;
  const nombreCompleto = empresa?.nombre_comercial || 'MOSSO';
  const nombre = nombreCorto(nombreCompleto);

  return (
    <Link href="/" aria-label={nombreCompleto} className="flex h-10 shrink-0 items-center gap-2">
      {empresa?.logo ? (
        <>
          <img
            src={`/storage/${empresa.logo}`}
            alt={nombreCompleto}
            className="h-8 w-auto max-w-[40px] object-contain sm:h-9 md:h-10 md:max-w-[44px]"
          />
          {/* Sepador de línea vertical (oculto en móvil, visible en escritorio) */}
          <span className="hidden h-6 w-px shrink-0 bg-gray-200 md:block" aria-hidden="true" />
          
          {/* Contenedor del nombre con las capas 3D (oculto en móvil, inline-block en escritorio) */}
          <span className="relative hidden whitespace-nowrap md:inline-block">
            {/* Capa 1: Sombra y resplandor de fondo */}
            <span
              className="absolute inset-0 text-2xl font-black uppercase tracking-wider text-amber-500 blur-md opacity-80 select-none pointer-events-none"
              aria-hidden="true"
            >
              {nombre}
            </span>

            {/* Capa 2: Borde oscuro para dar profundidad 3D */}
            <span
              className="absolute inset-0 text-2xl font-black uppercase tracking-wider text-amber-950 select-none pointer-events-none [text-shadow:_0_2px_0_#451a03]"
              style={{ WebkitTextStroke: '4px #78350f' }}
              aria-hidden="true"
            >
              {nombre}
            </span>

            {/* Capa 3: Texto frontal con gradiente dorado intenso */}
            <span className="relative text-2xl font-black uppercase tracking-wider bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 bg-clip-text text-transparent filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {nombre}
            </span>
          </span>
        </>
      ) : (
        <span className="text-xl font-black tracking-tight whitespace-nowrap text-gray-900 md:text-2xl">
          {nombre}
        </span>
      )}
    </Link>
  );
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const [sugerencias, setSugerencias] = useState<ProductoCard[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const texto = query.trim();

    if (texto.length < 2) {
      abortRef.current?.abort();
      setSugerencias([]);
      setCargando(false);

      return;
    }

    setCargando(true);

    const timeout = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      axios
        .get<{ productos: ProductoCard[] }>('/buscar/sugerencias', {
          params: { q: texto },
          signal: controller.signal,
        })
        .then(({ data }) => setSugerencias(data.productos))
        .catch((err) => {
          if (!axios.isCancel(err)) {
            setSugerencias([]);
          }
        })
        .finally(() => setCargando(false));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    function handleClickFuera(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFuera);

    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setAbierto(false);
    router.get('/buscar', { q: query.trim() });
  };

  const texto = query.trim();
  const mostrarPanel = abierto && texto.length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex h-10 items-center overflow-hidden rounded-full border-2 border-gray-200 bg-white transition-all focus-within:border-mosso-yellow focus-within:shadow-[0_0_0_4px_rgba(255,197,39,0.15)]"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar productos para tu mascota..."
          autoComplete="off"
          className="h-full w-full min-w-0 bg-white pr-2 pl-4 text-sm text-gray-900 placeholder-gray-400 outline-none md:pl-5"
        />
        <button
          type="submit"
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mosso-dark text-white transition-colors hover:bg-mosso-dark/80"
          aria-label="Buscar"
        >
          <SearchIcon />
        </button>
      </form>

      {mostrarPanel && (
        <div className="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-2xl shadow-gray-900/10 ring-1 ring-black/[0.02]">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-400">
              <SpinnerIcon />
              Buscando…
            </div>
          ) : sugerencias.length > 0 ? (
            <>
              <ul>
                {sugerencias.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={p.href}
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <img
                          src={imagenProducto(p)}
                          alt={p.nombre}
                          onError={onImagenError}
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">{p.nombre}</span>
                        {p.marca && <span className="block text-xs text-gray-400 uppercase">{p.marca}</span>}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-gray-900">S/ {p.precioFinal.toFixed(2)}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={`/buscar?q=${encodeURIComponent(texto)}`}
                onClick={() => setAbierto(false)}
                className="mt-1 block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-mosso-dark hover:underline"
              >
                Ver todos los resultados para "{texto}" →
              </Link>
            </>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Sin resultados para "{texto}".</p>
          )}
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
    </svg>
  );
}

function HelpDropdown() {
  const { empresa } = usePage<HeaderPageProps>().props;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const telefono = empresa?.telefono || '+51 999 123 456';

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickFuera(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickFuera);

    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <HelpIcon />
        ¿Necesitas ayuda?
        <ChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-2xl shadow-gray-900/10 ring-1 ring-black/[0.02]"
        >
          <a
            href={whatsappUrl(telefono, 'Hola, tengo una consulta sobre mi pedido en MOSSO.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <AyudaIconChip tono="verde">
              <WhatsappIcon />
            </AyudaIconChip>
            <div>
              <p className="font-semibold">Chatea por WhatsApp</p>
              <p className="text-xs text-gray-400">{telefono}</p>
            </div>
          </a>

          <a
            href={`tel:${telefono.replace(/\s+/g, '')}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <AyudaIconChip tono="amarillo">
              <PhoneIcon />
            </AyudaIconChip>
            <div>
              <p className="font-semibold">Llámanos</p>
              <p className="text-xs text-gray-400">{telefono}</p>
            </div>
          </a>

          <div className="my-1 border-t border-gray-100" />

          <Link
            href="/cambios-y-devoluciones"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <AyudaIconChip tono="gris">
              <ReturnIcon />
            </AyudaIconChip>
            <p className="font-semibold">Cambios y devoluciones</p>
          </Link>

          <Link
            href="/libro-de-reclamaciones"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <AyudaIconChip tono="gris">
              <BookIcon />
            </AyudaIconChip>
            <p className="font-semibold">Libro de reclamaciones</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function AyudaIconChip({ tono, children }: { tono: 'verde' | 'amarillo' | 'gris'; children: React.ReactNode }) {
  const tonos = {
    verde: 'bg-emerald-50 text-emerald-600',
    amarillo: 'bg-mosso-yellow/15 text-mosso-dark',
    gris: 'bg-gray-100 text-gray-500',
  } as const;

  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tonos[tono]}`}>
      {children}
    </span>
  );
}

/**
 * Icono de usuario. Invitado -> abre el modal de acceso (ModalAcceso) sin
 * navegar. Con sesión -> va a /cuenta, que en el backend redirige a
 * /mi-cuenta o /dashboard según el tipo de cuenta.
 */
function CuentaButton() {
  const { auth } = usePage().props;
  const claseIcono =
    'flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-mosso-dark';

  if (auth?.user) {
    return (
      <Link href="/cuenta" aria-label="Mi cuenta" className={claseIcono}>
        <UserIcon />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={abrirAcceso}
      aria-label="Iniciar sesión"
      className={claseIcono}
    >
      <UserIcon />
    </button>
  );
}

function FavoritosButton() {
  const { total } = useFavoritos();

  return (
    <Link
      href="/favoritos"
      aria-label="Favoritos"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-mosso-dark"
    >
      <HeartIcon />
      {total > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-mosso-red px-0.5 text-[10px] leading-none font-bold text-white select-none">
          {total > 99 ? '99+' : total}
        </span>
      )}
    </Link>
  );
}

function CartButton({ compact = false }: { compact?: boolean }) {
  const props = usePage().props as Record<string, unknown>;
  const carritoProps = props.carrito as { cantidad?: number } | undefined;
  const [cantidad, setCantidad] = useState(carritoProps?.cantidad ?? 0);

  useEffect(() => {
    setCantidad(carritoProps?.cantidad ?? 0);
  }, [carritoProps?.cantidad]);

  useEffect(() => {
    const handler = (e: Event) => {
      setCantidad((e as CustomEvent<{ cantidad: number }>).detail.cantidad);
    };
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  return (
    <Link
      href="/carrito"
      className={`relative flex h-10 items-center gap-2 rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-mosso-dark ${compact ? 'w-10 justify-center' : 'px-3'
        }`}
    >
      <span className="relative inline-flex">
        <CartIcon />
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-mosso-red px-0.5 text-[10px] leading-none font-bold text-white select-none">
          {cantidad > 99 ? '99+' : cantidad}
        </span>
      </span>
      {!compact && <span className="hidden text-sm font-semibold sm:inline">Carrito</span>}
    </Link>
  );
}

/* --- Iconos --- */

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-4 w-5 flex-col justify-between">
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-transform duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''
          }`}
      />
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'
          }`}
      />
      <span
        className={`block h-0.5 w-full rounded-full bg-current transition-transform duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''
          }`}
      />
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2.5c-5.26 0-9.54 4.28-9.54 9.54 0 1.68.44 3.32 1.28 4.76L2.5 21.5l4.83-1.27a9.5 9.5 0 0 0 4.71 1.25h.01c5.26 0 9.54-4.28 9.54-9.54s-4.28-9.44-9.55-9.44Zm5.6 13.6c-.24.67-1.4 1.28-1.93 1.36-.5.08-1.12.11-1.8-.11a15 15 0 0 1-1.9-.71 12.6 12.6 0 0 1-4.7-4.16c-.35-.47-1.16-1.55-1.16-2.96 0-1.4.73-2.09 1-2.38.24-.27.53-.34.71-.34s.36 0 .52.01c.17.01.39-.06.61.47.24.58.8 2 .87 2.14.07.15.12.32.02.51-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.87.27.13.44.2.51.32.07.11.07.65-.17 1.32Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M3.51 13a9 9 0 1 0 2.13-9.36L3 7" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}
