import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { destroy as sessionDestroy } from '@/actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';

export type ItemMiCuenta = 'escritorio' | 'pedidos' | 'direcciones' | 'mascotas' | 'puntos' | 'detalles';

const tabs: { label: string; href: string; clave: ItemMiCuenta }[] = [
  { label: 'Escritorio',          href: '/mi-cuenta',            clave: 'escritorio' },
  { label: 'Pedidos',             href: '/mi-cuenta/pedidos',    clave: 'pedidos'    },
  { label: 'Direcciones',         href: '/mi-cuenta/direcciones',clave: 'direcciones'},
  { label: 'Mis mascotas',        href: '/mi-cuenta/mascotas',   clave: 'mascotas'   },
  { label: 'Puntos y cupones',    href: '/mi-cuenta/puntos',     clave: 'puntos'     },
  { label: 'Detalles',            href: '/mi-cuenta/detalles',   clave: 'detalles'   },
];

function toTitleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
function iniciales(s: string) {
  return s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function MiCuentaShell({ activo, children }: { activo: ItemMiCuenta; children: ReactNode }) {
  const { auth } = usePage().props;
  const user = auth.user;
  const nombre = toTitleCase(user.name);

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
                key={tab.clave}
                href={tab.href}
                className={[
                  'shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  activo === tab.clave
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
