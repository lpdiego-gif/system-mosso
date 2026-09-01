import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { abrirAcceso } from '@/components/ModalAcceso';
import type { EmpresaPublica } from '@/types/empresa';
import type { MenuHijo, MenuItem } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  empresa: EmpresaPublica | null;
  [key: string]: unknown;
}

/**
 * Menú lateral para mobile (< md). Acordeón real: solo un ítem de nivel 1 y
 * un ítem de nivel 2 pueden estar abiertos a la vez; abrir uno cierra el
 * hermano que estuviera abierto en ese mismo nivel.
 */
export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { menu, empresa } = usePage<PageProps>().props;
  const [nivel1Abierto, setNivel1Abierto] = useState<number | null>(null);
  const [nivel2Abierto, setNivel2Abierto] = useState<number | null>(null);

  const nombre = empresa?.nombre_comercial || 'MOSSO';

  // Bloquea el scroll del body mientras el panel está abierto.
  useEffect(() => {
    if (!open) {
return;
}

    const previo = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previo;
    };
  }, [open]);

  // Cierra con Escape.
  useEffect(() => {
    if (!open) {
return;
}

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
onClose();
}
    };
    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Al cerrarse, resetea el acordeón para la próxima apertura.
  useEffect(() => {
    if (open) {
return;
}

    const t = setTimeout(() => {
      setNivel1Abierto(null);
      setNivel2Abierto(null);
    }, 300);

    return () => clearTimeout(t);
  }, [open]);

  function toggleNivel1(id: number) {
    setNivel1Abierto((actual) => (actual === id ? null : id));
    setNivel2Abierto(null);
  }

  function toggleNivel2(id: number) {
    setNivel2Abierto((actual) => (actual === id ? null : id));
  }

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Fondo oscuro con blur */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel lateral */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`absolute top-0 left-0 flex h-full w-[86vw] max-w-[340px] flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Acento de marca */}
        <div className="h-1 w-full shrink-0 bg-mosso-yellow" />

        {/* Cabecera con marca */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {empresa?.logo ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-gray-100">
                <img
                  src={`/storage/${empresa.logo}`}
                  alt={nombre}
                  className="h-full w-full rounded-xl object-contain p-1"
                />
              </span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mosso-dark text-sm font-black text-white">
                {nombre.charAt(0)}
              </span>
            )}
            <span className="truncate text-base font-bold tracking-tight text-gray-900">{nombre}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto overscroll-contain">
          <ul className="py-2">
            {menu.map((item) => (
              <ItemNivel1
                key={item.id}
                item={item}
                expandido={nivel1Abierto === item.id}
                nivel2Abierto={nivel2Abierto}
                onToggle={() => toggleNivel1(item.id)}
                onToggleNivel2={toggleNivel2}
                onNavigate={onClose}
              />
            ))}
          </ul>
        </nav>

        {/* Cuenta y ayuda */}
        <div className="shrink-0 space-y-1 border-t border-gray-100 bg-gray-50/60 p-2">
          <CuentaLink onClose={onClose} />
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark">
              <HelpIcon />
            </span>
            ¿Necesitas ayuda?
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * "Mi cuenta" del menú mobile. Invitado -> cierra el menú y abre el modal de
 * acceso. Con sesión -> va a /cuenta (el backend redirige a /mi-cuenta o
 * /dashboard).
 */
function CuentaLink({ onClose }: { onClose: () => void }) {
  const { auth } = usePage().props;
  const clase =
    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-white';
  const contenido = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark">
        <UserIcon />
      </span>
      Mi cuenta
    </>
  );

  if (auth?.user) {
    return (
      <Link href="/cuenta" onClick={onClose} className={clase}>
        {contenido}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClose();
        abrirAcceso();
      }}
      className={clase}
    >
      {contenido}
    </button>
  );
}

function ItemNivel1({
  item,
  expandido,
  nivel2Abierto,
  onToggle,
  onToggleNivel2,
  onNavigate,
}: {
  item: MenuItem;
  expandido: boolean;
  nivel2Abierto: number | null;
  onToggle: () => void;
  onToggleNivel2: (id: number) => void;
  onNavigate: () => void;
}) {
  const subItems = item.columnas[0]?.items ?? [];
  const tieneSubmenu = subItems.length > 0;

  const claseFila = `flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${
    item.destacado ? 'text-mosso-red' : 'text-gray-900'
  } ${expandido ? 'bg-mosso-yellow/10' : 'hover:bg-gray-50'}`;

  const chip = (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base leading-none ${
        item.destacado ? 'bg-mosso-red/10' : expandido ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      {item.icono ?? <DefaultIcon className="h-4 w-4 text-gray-400" />}
    </span>
  );

  return (
    <li className="px-1.5 py-0.5">
      {tieneSubmenu ? (
        // Con submenú: toda la fila abre/cierra el acordeón (no navega).
        <button onClick={onToggle} aria-expanded={expandido} className={`${claseFila} rounded-xl`}>
          {chip}
          <span className="flex-1">{item.nombre}</span>
          <ChevronDown expanded={expandido} />
        </button>
      ) : (
        // Sin submenú: la fila navega directo y cierra el panel.
        <Link href={item.href ?? '#'} onClick={onNavigate} className={`${claseFila} rounded-xl`}>
          {chip}
          <span className="flex-1">{item.nombre}</span>
        </Link>
      )}

      {tieneSubmenu && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className="space-y-0.5 bg-gray-50/70 px-2 pb-2.5 pt-1">
              {subItems.map((sub) => (
                <ItemNivel2
                  key={sub.id}
                  sub={sub}
                  expandido={nivel2Abierto === sub.id}
                  onToggle={() => onToggleNivel2(sub.id)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

function ItemNivel2({
  sub,
  expandido,
  onToggle,
  onNavigate,
}: {
  sub: MenuHijo;
  expandido: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const tieneHijos = sub.hijos.length > 0;

  return (
    <li>
      {tieneHijos ? (
        // Con sub-submenú: toda la fila abre/cierra el acordeón (no navega).
        <button
          onClick={onToggle}
          aria-expanded={expandido}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            expandido ? 'bg-white text-mosso-dark shadow-sm' : 'text-gray-700 hover:bg-white/80'
          }`}
        >
          <span className="flex-1 truncate">{sub.nombre}</span>
          <ChevronDown expanded={expandido} small />
        </button>
      ) : (
        // Sin sub-submenú: navega directo y cierra el panel.
        <Link
          href={sub.href}
          onClick={onNavigate}
          className="block truncate rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white/80"
        >
          {sub.nombre}
        </Link>
      )}

      {tieneHijos && (
        <div
          className={`grid transition-[grid-template-rows] duration-250 ease-out ${
            expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className="ml-4 space-y-0.5 border-l-2 border-mosso-yellow/40 py-1 pl-3">
              {sub.hijos.map((nieto) => (
                <li key={nieto.id}>
                  <Link
                    href={nieto.href}
                    onClick={onNavigate}
                    className="block truncate rounded-md py-2 pl-2 text-[13px] text-gray-500 transition-colors hover:bg-white hover:text-mosso-dark"
                  >
                    {nieto.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronDown({ expanded, small = false }: { expanded: boolean; small?: boolean }) {
  const size = small ? 14 : 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
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
