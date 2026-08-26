import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useFavoritos } from '@/hooks/use-favoritos';
import type { EmpresaPublica } from '@/types/empresa';
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
      <div className="min-w-0 flex-1 md:max-w-3xl">
        <SearchBar />
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-1 md:flex">
          <HelpDropdown />
          <span className="mx-0.5 h-6 w-px bg-gray-200" aria-hidden="true" />
          <Link
            href="/cuenta"
            aria-label="Mi cuenta"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-mosso-dark"
          >
            <UserIcon />
          </Link>
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
          {/* El nombre solo se muestra en pantallas grandes; en mobile queda solo el logo. */}
          <span className="hidden h-6 w-px shrink-0 bg-gray-200 md:block" aria-hidden="true" />
          <span className="hidden bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-xl font-extrabold tracking-normal text-transparent whitespace-nowrap md:inline">
            {nombre}
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    router.get('/buscar', { q: query.trim() });
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex h-10 items-center overflow-hidden rounded-full border-2 border-gray-200 bg-white transition-all focus-within:border-mosso-yellow focus-within:shadow-[0_0_0_4px_rgba(255,197,39,0.15)]"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos para tu mascota..."
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
    </div>
  );
}

function HelpDropdown() {
  return (
    <button className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
      <HelpIcon />
      ¿Necesitas ayuda?
      <ChevronDown />
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

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
