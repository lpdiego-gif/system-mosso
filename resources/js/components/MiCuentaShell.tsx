import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { destroy as sessionDestroy } from '@/actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';
import type { MenuCuentaItem } from '@/types/menu-cuenta';

export type ItemMiCuenta = 'escritorio' | 'pedidos' | 'direcciones' | 'mascotas' | 'puntos' | 'detalles';

interface PageProps {
  menuCuenta: MenuCuentaItem[];
  [key: string]: unknown;
}

/**
 * La `clave` real en `menu_cuenta` no siempre coincide con la clave de
 * pestaña que usan las páginas existentes (`puntos_cupones` en BD, pero la
 * página/URL es `puntos`) — se traduce aquí para poder resaltar la pestaña
 * activa.
 */
const CLAVE_A_TAB: Record<string, ItemMiCuenta> = {
  pedidos: 'pedidos',
  direcciones: 'direcciones',
  mascotas: 'mascotas',
  puntos_cupones: 'puntos',
  detalles: 'detalles',
};

function toTitleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
function iniciales(s: string) {
  return s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function MiCuentaShell({ activo, children }: { activo: ItemMiCuenta; children: ReactNode }) {
  const { auth, menuCuenta } = usePage<PageProps>().props;
  const user = auth.user;
  const nombre = toTitleCase(user.name);

  // "Escritorio" es fijo (no es un ítem configurable en menu_cuenta); el
  // resto de pestañas sale de las secciones/enlaces activos del admin —
  // si el admin desactiva una sección, desaparece de aquí automáticamente.
  const tabs: { label: string; href: string; key: string }[] = [
    { label: 'Escritorio', href: '/mi-cuenta', key: 'escritorio' },
    ...menuCuenta.map((item) => ({
      label: item.nombre,
      href: item.href,
      key: (item.clave && CLAVE_A_TAB[item.clave]) || `url-${item.id}`,
    })),
  ];

  return (
    <>
      {/* User bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-mosso-yellow text-gray-900 text-xs font-bold shrink-0 select-none">
              {iniciales(user.name)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-none truncate">{nombre}</p>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          <Link
            href={sessionDestroy.url()}
            method="post"
            as="button"
            className="shrink-0 text-xs text-gray-400 hover:text-mosso-red transition-colors flex items-center gap-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex overflow-x-auto -mb-px" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={[
                  'shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  activo === tab.key
                    ? 'border-mosso-yellow text-gray-900 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                ].join(' ')}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-mosso-cream min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          {children}
        </div>
      </div>
    </>
  );
}
