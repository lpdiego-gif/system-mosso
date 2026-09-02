import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { abrirAcceso } from '@/components/ModalAcceso';
import { whatsappUrl } from '@/lib/whatsapp';
import type { EmpresaPublica } from '@/types/empresa';
import type { MenuHijo, MenuItem } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  empresa: EmpresaPublica | null;
  [key: string]: unknown;
}

/** Un nodo navegable: si tiene `hijos`, se expande en el mismo lugar (acordeón); si no, navega o ejecuta `accion`. */
interface NodoNav {
  key: string;
  nombre: string;
  descripcion?: string;
  icono: ReactNode;
  href?: string;
  externo?: boolean;
  accion?: () => void;
  destacado?: boolean;
  hijos?: NodoNav[];
}

function mapHijos(items: MenuHijo[]): NodoNav[] {
  return items.map((h) => ({
    key: `h-${h.id}`,
    nombre: h.nombre,
    icono: null,
    href: h.href,
    // Los nietos (subcategorías) que devuelve MenuService no siempre traen
    // `hijos` (solo las categorías lo garantizan) -- se trata como hoja.
    hijos: h.hijos?.length ? mapHijos(h.hijos) : undefined,
  }));
}

/**
 * Menú lateral compacto para mobile (< md): ocupa ~60% del ancho, no toda
 * la pantalla. Los ítems principales son un acordeón real en el mismo
 * panel (un solo camino abierto a la vez; abrir uno cierra cualquier otro
 * abierto en ese nivel o más abajo). "¿Necesitas ayuda?" es la única
 * excepción: sigue abriendo su propio sub-panel con botón "Volver".
 */
export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { menu, empresa, auth } = usePage<PageProps>().props;
  const nombre = empresa?.nombre_comercial || 'MOSSO';
  const telefono = empresa?.telefono || '+51 999 123 456';

  const raiz: NodoNav[] = menu.map((item) => ({
    key: `m-${item.id}`,
    nombre: item.nombre,
    icono: item.icono ? <span className="text-base leading-none">{item.icono}</span> : <DefaultIcon />,
    href: item.href ?? undefined,
    destacado: item.destacado,
    hijos: (item.columnas[0]?.items.length ?? 0) > 0 ? mapHijos(item.columnas[0].items) : undefined,
  }));

  const [vista, setVista] = useState<'menu' | 'ayuda'>('menu');
  const [abiertos, setAbiertos] = useState<string[]>([]);

  function alternar(key: string, profundidad: number) {
    setAbiertos((actual) => (actual[profundidad] === key ? actual.slice(0, profundidad) : [...actual.slice(0, profundidad), key]));
  }

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

  // Cierra con Escape; si el sub-panel de ayuda está abierto, primero vuelve al menú.
  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }

      if (vista === 'ayuda') {
        setVista('menu');
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [open, vista, onClose]);

  // Al cerrarse, resetea todo para la próxima apertura.
  useEffect(() => {
    if (open) {
      return;
    }

    const t = setTimeout(() => {
      setVista('menu');
      setAbiertos([]);
    }, 300);

    return () => clearTimeout(t);
  }, [open]);

  const cuentaNodo: NodoNav = auth?.user
    ? { key: 'cuenta', nombre: 'Mi cuenta', descripcion: 'Pedidos, direcciones y más', icono: <UserIcon />, href: '/cuenta' }
    : { key: 'cuenta', nombre: 'Mi cuenta', descripcion: 'Inicia sesión o regístrate', icono: <UserIcon />, accion: abrirAcceso };

  const ayudaHijos: NodoNav[] = [
    {
      key: 'ayuda-whatsapp',
      nombre: 'Chatea por WhatsApp',
      descripcion: telefono,
      icono: <WhatsappIcon />,
      href: whatsappUrl(telefono, 'Hola, tengo una consulta sobre mi pedido en MOSSO.'),
      externo: true,
    },
    {
      key: 'ayuda-llamar',
      nombre: 'Llámanos',
      descripcion: telefono,
      icono: <PhoneIcon />,
      href: `tel:${telefono.replace(/\s+/g, '')}`,
    },
    { key: 'ayuda-devoluciones', nombre: 'Cambios y devoluciones', icono: <ReturnIcon />, href: '/cambios-y-devoluciones' },
    { key: 'ayuda-reclamos', nombre: 'Libro de reclamaciones', icono: <BookIcon />, href: '/libro-de-reclamaciones' },
  ];

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Fondo oscuro */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-gray-950/70 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel compacto: ~60% del ancho, nunca toda la pantalla */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`absolute top-0 left-0 flex h-full w-3/5 max-w-xs flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera */}
        <div className="shrink-0 bg-mosso-dark px-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5">
          <div className="flex items-center gap-2.5">
            {vista === 'ayuda' ? (
              <>
                <button
                  onClick={() => setVista('menu')}
                  aria-label="Volver"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
                >
                  <BackIcon />
                </button>
                <span className="flex-1 truncate text-base font-black tracking-tight text-white">Ayuda</span>
              </>
            ) : (
              <>
                {empresa?.logo ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1">
                    <img src={`/storage/${empresa.logo}`} alt={nombre} className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-mosso-yellow">
                    {nombre.charAt(0)}
                  </span>
                )}
                <span className="flex-1 truncate text-base font-black tracking-tight text-white">{nombre}</span>
              </>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {vista === 'ayuda' ? (
          <nav className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <ul className="animate-in fade-in slide-in-from-right-4 px-2 py-2.5 duration-200">
              {ayudaHijos.map((nodo) => (
                <NodoAcordeon key={nodo.key} nodo={nodo} profundidad={0} abiertos={[]} onToggle={() => {}} onNavigate={onClose} />
              ))}
            </ul>
          </nav>
        ) : (
          <>
            <nav className="flex-1 overflow-y-auto overscroll-contain bg-white">
              <ul className="px-2 py-2.5">
                {raiz.map((nodo) => (
                  <NodoAcordeon key={nodo.key} nodo={nodo} profundidad={0} abiertos={abiertos} onToggle={alternar} onNavigate={onClose} />
                ))}
              </ul>
            </nav>

            {/* Cuenta y ayuda */}
            <div className="shrink-0 space-y-1 border-t border-gray-100 bg-gray-50/70 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <TarjetaCuenta nodo={cuentaNodo} onNavigate={onClose} />
              <button
                type="button"
                onClick={() => setVista('ayuda')}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors active:bg-gray-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                  <HelpIcon />
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-gray-900">¿Necesitas ayuda?</span>
                <ChevronRightIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Tarjeta destacada de "Mi cuenta": invitado abre el modal de acceso, con sesión navega a /cuenta. */
function TarjetaCuenta({ nodo, onNavigate }: { nodo: NodoNav; onNavigate: () => void }) {
  const clase =
    'flex w-full items-center gap-2.5 rounded-xl border border-mosso-yellow/30 bg-mosso-yellow/10 px-2.5 py-2.5 text-left transition-colors active:bg-mosso-yellow/20';

  const contenido = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-mosso-dark shadow-sm">
        {nodo.icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-gray-900">{nodo.nombre}</span>
        <span className="block truncate text-[11px] text-gray-500">{nodo.descripcion}</span>
      </span>
    </>
  );

  if (nodo.accion) {
    return (
      <button type="button" onClick={nodo.accion} className={clase}>
        {contenido}
      </button>
    );
  }

  return (
    <Link href={nodo.href ?? '/cuenta'} onClick={onNavigate} className={clase}>
      {contenido}
    </Link>
  );
}

/** Fila de acordeón recursiva: con hijos, se expande en el mismo lugar; sin hijos, navega o ejecuta una acción. */
function NodoAcordeon({
  nodo,
  profundidad,
  abiertos,
  onToggle,
  onNavigate,
}: {
  nodo: NodoNav;
  profundidad: number;
  abiertos: string[];
  onToggle: (key: string, profundidad: number) => void;
  onNavigate: () => void;
}) {
  const expandido = abiertos[profundidad] === nodo.key;
  const tieneHijos = !!nodo.hijos?.length;
  const esRaiz = profundidad === 0;

  const chip = nodo.icono && (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base leading-none ${
        nodo.destacado ? 'bg-mosso-red/10 text-mosso-red' : expandido ? 'bg-mosso-yellow/20 text-mosso-dark' : 'bg-gray-50 text-gray-500'
      }`}
    >
      {nodo.icono}
    </span>
  );

  const etiqueta = (
    <span className="min-w-0 flex-1">
      <span
        className={`block truncate font-semibold ${esRaiz ? 'text-[14.5px]' : 'text-sm'} ${
          nodo.destacado ? 'text-mosso-red' : expandido ? 'text-mosso-dark' : 'text-gray-900'
        }`}
      >
        {nodo.nombre}
      </span>
      {nodo.descripcion && <span className="block truncate text-[11px] text-gray-400">{nodo.descripcion}</span>}
    </span>
  );

  const clase = `flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
    expandido ? 'bg-mosso-yellow/10' : 'active:bg-gray-100'
  }`;

  const fila = tieneHijos ? (
    <button type="button" onClick={() => onToggle(nodo.key, profundidad)} aria-expanded={expandido} className={clase}>
      {chip}
      {etiqueta}
      <ChevronDownIcon expandido={expandido} />
    </button>
  ) : nodo.accion ? (
    <button type="button" onClick={nodo.accion} className={clase}>
      {chip}
      {etiqueta}
    </button>
  ) : nodo.externo ? (
    <a href={nodo.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={clase}>
      {chip}
      {etiqueta}
    </a>
  ) : (
    <Link href={nodo.href ?? '#'} onClick={onNavigate} className={clase}>
      {chip}
      {etiqueta}
    </Link>
  );

  return (
    <li className={esRaiz ? 'py-px' : ''}>
      {fila}

      {tieneHijos && (
        <div className={`grid transition-[grid-template-rows] duration-250 ease-out ${expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <ul className="mt-0.5 mb-1 ml-3 space-y-px rounded-xl bg-gray-50/80 py-1 pr-1 pl-2">
              {nodo.hijos!.map((h) => (
                <NodoAcordeon key={h.key} nodo={h} profundidad={profundidad + 1} abiertos={abiertos} onToggle={onToggle} onNavigate={onNavigate} />
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-300">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ expandido }: { expandido: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-gray-400 transition-transform duration-250 ${expandido ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DefaultIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2.5c-5.26 0-9.54 4.28-9.54 9.54 0 1.68.44 3.32 1.28 4.76L2.5 21.5l4.83-1.27a9.5 9.5 0 0 0 4.71 1.25h.01c5.26 0 9.54-4.28 9.54-9.54s-4.28-9.44-9.55-9.44Zm5.6 13.6c-.24.67-1.4 1.28-1.93 1.36-.5.08-1.12.11-1.8-.11a15 15 0 0 1-1.9-.71 12.6 12.6 0 0 1-4.7-4.16c-.35-.47-1.16-1.55-1.16-2.96 0-1.4.73-2.09 1-2.38.24-.27.53-.34.71-.34s.36 0 .52.01c.17.01.39-.06.61.47.24.58.8 2 .87 2.14.07.15.12.32.02.51-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.87.27.13.44.2.51.32.07.11.07.65-.17 1.32Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M3.51 13a9 9 0 1 0 2.13-9.36L3 7" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}
