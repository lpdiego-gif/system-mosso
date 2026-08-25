import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuItem, MenuHijo } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  [key: string]: unknown;
}

/**
 * Barra de navegación con mega menu (solo desktop, md: en adelante).
 * En mobile se usa MobileMenu.tsx en su lugar.
 */
export default function MegaMenu() {
  const { menu } = usePage<PageProps>().props;

  const grupoIzquierdo = menu.filter((i) => i.tipo === 'animal' || i.tipo === 'tipo_animal');
  const grupoDerecho = menu.filter((i) => i.tipo !== 'animal' && i.tipo !== 'tipo_animal');

  return (
    <nav className="hidden md:block border-t border-b border-gray-200 relative">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1440px] mx-auto">
        <ul className="flex items-center gap-6">
          {grupoIzquierdo.map((item) => (
            <MenuLinkItem key={item.id} item={item} align="left" />
          ))}
        </ul>
        <ul className="flex items-center gap-6">
          {grupoDerecho.map((item) => (
            <MenuLinkItem key={item.id} item={item} align="right" />
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Un ítem individual del menú, con su dropdown si tiene columnas */
function MenuLinkItem({ item, align }: { item: MenuItem; align: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const [activeCategoria, setActiveCategoria] = useState<MenuHijo | null>(null);

  // "Marca": grid de logos. "Servicios"/"Exóticos": lista simple.
  const esMarca = item.tipo === 'marca';
  const esListaPlana =
    item.columnas.length > 0 && item.columnas[0].items.every((i) => i.hijos.length === 0);

  const handleOpen = () => {
    if (item.columnas.length === 0) return;
    setOpen(true);
    setActiveCategoria(item.columnas[0]?.items[0] ?? null);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveCategoria(null);
  };

  return (
    <li
      className="relative h-full flex items-center"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <Link
        href={item.href ?? '#'}
        className={`flex items-center gap-1 text-sm font-semibold whitespace-nowrap ${
          item.destacado ? 'text-mosso-yellow' : 'text-gray-900'
        } hover:text-mosso-yellow transition-colors`}
      >
        {item.icono && <span>{item.icono}</span>}
        {item.nombre}
        {item.columnas.length > 0 && <ChevronDown />}
      </Link>

      {open && item.columnas.length > 0 && (
        <div
          className={`absolute top-full mt-0 bg-white shadow-lg rounded-lg border border-gray-100 z-50 ${
            align === 'left' ? 'left-0' : 'right-0'
          } ${esMarca ? 'w-[420px] p-4' : esListaPlana ? 'w-56 p-3' : 'flex min-w-[500px]'}`}
        >
          {esMarca ? (
            // Grid de logos, estilo tienda de marcas
            <div className="grid grid-cols-3 gap-3">
              {item.columnas[0].items.map((marca) => (
                <Link
                  key={marca.id}
                  href={marca.href}
                  className="flex items-center justify-center border border-gray-100 rounded-lg h-16 p-2 hover:border-mosso-yellow transition-colors"
                >
                  {marca.logo ? (
                    <img
                      src={marca.logo}
                      alt={marca.nombre}
                      className="max-h-10 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-600 text-center">{marca.nombre}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : esListaPlana ? (
            // Lista simple: Servicios, Exóticos
            <ul>
              {item.columnas[0].items.map((op) => (
                <li key={op.id}>
                  <Link
                    href={op.href}
                    className="block px-2 py-1.5 text-sm text-gray-700 hover:text-mosso-yellow hover:bg-gray-50 rounded"
                  >
                    {op.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {/* Columna izquierda: categorías (Alimentos, Necesidad/Condición...) */}
              <ul className="w-56 py-2">
                {item.columnas[0].items.map((categoria) => (
                  <li key={categoria.id} onMouseEnter={() => setActiveCategoria(categoria)}>
                    <Link
                      href={categoria.href}
                      className={`flex items-center justify-between px-4 py-2 text-sm ${
                        activeCategoria?.id === categoria.id
                          ? 'text-gray-900 font-semibold bg-mosso-yellow/10'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {categoria.nombre}
                      {categoria.hijos.length > 0 && <span>›</span>}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Columna derecha: subcategorías de la categoría activa */}
              {activeCategoria && activeCategoria.hijos.length > 0 && (
                <div className="flex-1 py-4 px-4 border-l border-gray-100">
                  <p className="text-mosso-yellow font-bold text-sm mb-2 uppercase tracking-wide">Categorías</p>
                  <ul className="space-y-1">
                    {activeCategoria.hijos.map((sub) => (
                      <li key={sub.id}>
                        <Link href={sub.href} className="text-sm text-gray-700 hover:text-mosso-yellow">
                          {sub.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}