import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuItem, MenuHijo } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  [key: string]: unknown;
}

/**
 * Barra de navegación con mega menu.
 * Se divide en dos grupos según el orden que ya trae `menu` desde la BD:
 * - Izquierda: ítems tipo 'animal' / 'tipo_animal' (Perros, Gatos, Exóticos)
 * - Derecha: el resto (Marca, Servicios, Ofertas)
 */
export default function MegaMenu() {
  const { menu } = usePage<PageProps>().props;

  const grupoIzquierdo = menu.filter((i) => i.tipo === 'animal' || i.tipo === 'tipo_animal');
  const grupoDerecho = menu.filter((i) => i.tipo !== 'animal' && i.tipo !== 'tipo_animal');

  return (
    <nav className="border-t border-b border-gray-200 relative">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1440px] mx-auto">
        <ul className="flex items-center gap-6">
          {grupoIzquierdo.map((item) => (
            <MenuLinkItem key={item.id} item={item} />
          ))}
        </ul>
        <ul className="flex items-center gap-6">
          {grupoDerecho.map((item) => (
            <MenuLinkItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Un ítem individual del menú, con su dropdown si tiene columnas */
function MenuLinkItem({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [activeCategoria, setActiveCategoria] = useState<MenuHijo | null>(null);

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
        className={`flex items-center gap-1 text-sm font-semibold ${
          item.destacado ? 'text-orange-500' : 'text-gray-900'
        } hover:text-orange-500 transition-colors`}
      >
        {item.icono && <span>{item.icono}</span>}
        {item.nombre}
        {item.columnas.length > 0 && <ChevronDown />}
      </Link>

      {open && item.columnas.length > 0 && (
        <div className="absolute top-full left-0 mt-0 bg-white shadow-lg rounded-lg border border-gray-100 flex min-w-[500px] z-50">
          {/* Columna izquierda: lista de categorías (Alimentos, Necesidad/Condición...) */}
          <ul className="w-56 py-2">
            {item.columnas[0].items.map((categoria) => (
              <li key={categoria.id} onMouseEnter={() => setActiveCategoria(categoria)}>
                <Link
                  href={categoria.href}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${
                    activeCategoria?.id === categoria.id
                      ? 'text-orange-500 font-semibold bg-orange-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {categoria.nombre}
                  {categoria.hijos.length > 0 && <span>›</span>}
                </Link>
              </li>
            ))}
          </ul>

          {/* Columna derecha: subcategorías de la categoría activa (Alimento Seco, Húmedo...) */}
          {activeCategoria && activeCategoria.hijos.length > 0 && (
            <div className="flex-1 py-4 px-4 border-l border-gray-100">
              <p className="text-orange-500 font-semibold text-sm mb-2">Categorías</p>
              <ul className="space-y-1">
                {activeCategoria.hijos.map((sub) => (
                  <li key={sub.id}>
                    <Link href={sub.href} className="text-sm text-gray-700 hover:text-orange-500">
                      {sub.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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