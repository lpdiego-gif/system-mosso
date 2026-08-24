import { Link } from '@inertiajs/react';

import MegaMenu from './MegaMenu';

/**
 * Header principal del sitio.
 *
 * Contiene: Logo, Buscador, Ayuda, Cuenta, Favoritos, Carrito,
 * y el MegaMenu debajo.
 */
export default function Header() {
  return (
    <header className="w-full bg-white">
      <TopBar />
      <MegaMenu />
    </header>
  );
}

/**
 * Franja superior: logo + buscador + iconos de usuario
 */
function TopBar() {
  return (
    <div className="flex items-center justify-between gap-8 px-6 py-4 max-w-[1440px] mx-auto">
      <Logo />
      <SearchBar />
      <UserActions />
    </div>
  );
}

/**
 * Logo de la marca
 */
function Logo() {
  return (
    <Link
      href="/"
      className="shrink-0 text-2xl font-bold tracking-tight text-gray-900"
    >
      MOSSO
    </Link>
  );
}

function SearchBar() {
  return (
    <div className="flex-1 max-w-2xl">
      <form className="relative flex items-center border border-gray-300 rounded-full overflow-hidden">
        <input
          type="text"
          placeholder="Buscar productos"
          className="w-full pl-5 pr-2 py-2.5 text-sm outline-none"
        />

        <button
          type="submit"
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-9 h-9 flex items-center justify-center mr-1 shrink-0"
          aria-label="Buscar"
        >
          <SearchIcon />
        </button>
      </form>
    </div>
  );
}

function UserActions() {
  return (
    <div className="flex items-center gap-5 shrink-0">
      <HelpDropdown />

      <Link
        href="/cuenta"
        aria-label="Mi cuenta"
        className="text-gray-700 hover:text-orange-500"
      >
        <UserIcon />
      </Link>

      <Link
        href="/favoritos"
        aria-label="Favoritos"
        className="text-gray-700 hover:text-orange-500"
      >
        <HeartIcon />
      </Link>

      <CartButton />
    </div>
  );
}

function HelpDropdown() {
  return (
    <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-orange-500">
      <HelpIcon />
      ¿Necesitas ayuda?
      <ChevronDown />
    </button>
  );
}

function CartButton() {
  // Total real vendrá de tu store/contexto de carrito
  // (Zustand, Context, etc.)
  const total = '0.00';

  return (
    <Link
      href="/carrito"
      className="flex items-center gap-2 text-gray-900 hover:text-orange-500"
    >
      <CartIcon />
      <span className="text-sm font-semibold">S/{total}</span>
    </Link>
  );
}

/* --- Iconos --- */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}