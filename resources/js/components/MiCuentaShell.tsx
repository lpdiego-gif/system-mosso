import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { logout } from '@/routes';

export type ItemMiCuenta = 'escritorio' | 'pedidos' | 'direcciones' | 'detalles';

const enlacesMenu: { label: string; href: string; clave: ItemMiCuenta }[] = [
  { label: 'Escritorio', href: '/mi-cuenta', clave: 'escritorio' },
  { label: 'Pedidos', href: '/mi-cuenta/pedidos', clave: 'pedidos' },
  { label: 'Direcciones', href: '/mi-cuenta/direcciones', clave: 'direcciones' },
  { label: 'Detalles de la cuenta', href: '/mi-cuenta/detalles', clave: 'detalles' },
];

/**
 * Banner "Mi cuenta" + menú lateral, compartido por el escritorio y por
 * Direcciones/Detalles. Pedidos todavía no tiene página propia.
 */
export default function MiCuentaShell({ activo, children }: { activo: ItemMiCuenta; children: ReactNode }) {
  return (
    <>
      <div className="bg-orange-100">
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <h1 className="text-center text-2xl md:text-3xl font-black text-orange-900">Mi cuenta</h1>
        </div>
      </div>

      <section className="max-w-[1100px] mx-auto px-6 py-10 md:py-14 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
        <aside>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Mi cuenta</h2>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-1 md:mx-0 px-1 md:px-0">
            {enlacesMenu.map((item) => (
              <Link
                key={item.clave}
                href={item.href}
                className={`shrink-0 md:shrink px-4 py-2.5 rounded-lg text-sm border-l-4 whitespace-nowrap transition-colors ${
                  activo === item.clave
                    ? 'border-orange-500 bg-orange-50 text-orange-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={logout()}
              as="button"
              className="shrink-0 md:shrink text-left px-4 py-2.5 rounded-lg text-sm border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 whitespace-nowrap transition-colors"
            >
              Cerrar sesión
            </Link>
          </nav>
        </aside>

        <div>{children}</div>
      </section>
    </>
  );
}
