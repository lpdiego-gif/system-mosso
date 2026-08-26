import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuHijo, MenuItem } from '@/types/menu';

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
    <nav className="relative hidden border-t border-gray-100 bg-white md:block">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 md:px-6">
        <ul className="flex items-center gap-1">
          {grupoIzquierdo.map((item) => (
            <MenuLinkItem key={item.id} item={item} align="left" />
          ))}
        </ul>
        <ul className="flex items-center gap-1">
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
  const [activeSubcategoria, setActiveSubcategoria] = useState<MenuHijo | null>(null);

  const tieneDropdown = item.columnas.length > 0;
  // "Marca": grid de logos. "Servicios"/"Exóticos": lista simple.
  const esMarca = item.tipo === 'marca';
  const esListaPlana = tieneDropdown && item.columnas[0].items.every((i) => i.hijos.length === 0);

  const handleOpen = () => {
    if (!tieneDropdown) {
return;
}

    const primeraCategoria = item.columnas[0]?.items[0] ?? null;
    setOpen(true);
    setActiveCategoria(primeraCategoria);
    setActiveSubcategoria(primeraCategoria?.hijos[0] ?? null);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveCategoria(null);
    setActiveSubcategoria(null);
  };

  const seleccionarCategoria = (categoria: MenuHijo) => {
    setActiveCategoria(categoria);
    setActiveSubcategoria(categoria.hijos[0] ?? null);
  };

  return (
    <li className="relative flex h-14 items-center" onMouseEnter={handleOpen} onMouseLeave={handleClose}>
      <Link
        href={item.href ?? '#'}
        className={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
          item.destacado
            ? 'bg-mosso-red/10 text-mosso-red hover:bg-mosso-red/15'
            : open
              ? 'bg-gray-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {item.icono && <span className="text-base leading-none">{item.icono}</span>}
        {item.nombre}
        {tieneDropdown && <ChevronDown open={open} />}
      </Link>

      {tieneDropdown && (
        <div
          className={`absolute top-full pt-2 transition-[opacity,transform] duration-150 ease-out ${
            align === 'left' ? 'left-0' : 'right-0'
          } ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}
        >
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-black/[0.02]">
            {esMarca ? (
              // Grid de logos, estilo tienda de marcas
              <div className="grid w-[440px] grid-cols-3 gap-3 p-5">
                {item.columnas[0].items.map((marca) => (
                  <Link
                    key={marca.id}
                    href={marca.href}
                    className="flex h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-mosso-yellow hover:bg-white hover:shadow-md"
                  >
                    {marca.logo ? (
                      <img src={marca.logo} alt={marca.nombre} className="max-h-10 max-w-full object-contain" />
                    ) : (
                      <span className="text-center text-xs font-medium text-gray-600">{marca.nombre}</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : esListaPlana ? (
              // Lista simple: Servicios, Exóticos
              <ul className="w-60 p-2">
                {item.columnas[0].items.map((op) => (
                  <li key={op.id}>
                    <Link
                      href={op.href}
                      className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-mosso-yellow/10 hover:text-mosso-dark"
                    >
                      {op.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex">
                {/* Columna izquierda: categorías (Alimentos, Necesidad/Condición...) */}
                <ul className="w-60 shrink-0 space-y-0.5 border-r border-gray-100 p-2">
                  {item.columnas[0].items.map((categoria) => {
                    const activa = activeCategoria?.id === categoria.id;

                    return (
                      <li key={categoria.id} onMouseEnter={() => seleccionarCategoria(categoria)}>
                        <Link
                          href={categoria.href}
                          className={`flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors ${
                            activa ? 'bg-mosso-yellow/10 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{categoria.nombre}</span>
                          {categoria.hijos.length > 0 && (
                            <ChevronRight className={activa ? 'text-mosso-dark' : 'text-gray-300'} />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Columna central: subcategorías de la categoría activa */}
                {activeCategoria && activeCategoria.hijos.length > 0 && (
                  <ul className="w-56 shrink-0 space-y-0.5 border-r border-gray-100 p-2">
                    {activeCategoria.hijos.map((sub) => {
                      const subActiva = activeSubcategoria?.id === sub.id;
                      const tieneProductos = !!sub.productos?.length;

                      return (
                        <li key={sub.id} onMouseEnter={() => setActiveSubcategoria(sub)}>
                          <Link
                            href={sub.href}
                            className={`flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors ${
                              subActiva ? 'bg-mosso-yellow/10 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">{sub.nombre}</span>
                            {tieneProductos && (
                              <ChevronRight className={subActiva ? 'text-mosso-dark' : 'text-gray-300'} />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Columna derecha: imágenes de los productos de la subcategoría activa */}
                {activeSubcategoria && !!activeSubcategoria.productos?.length && (
                  <div className="w-[236px] shrink-0 p-4">
                    <p className="mb-2 truncate px-1 text-xs font-bold tracking-wide text-gray-400 uppercase">
                      {activeSubcategoria.nombre}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {activeSubcategoria.productos.map((producto) => (
                        <img
                          key={producto.id}
                          src={`/storage/${producto.imagen}`}
                          alt={producto.nombre}
                          title={producto.nombre}
                          className="aspect-square w-full rounded-lg border border-gray-200 bg-gray-50 object-cover transition-colors hover:border-mosso-yellow"
                        />
                      ))}
                    </div>
                    <Link
                      href={activeSubcategoria.href}
                      className="mt-3 flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-mosso-dark transition-colors hover:bg-mosso-yellow/10"
                    >
                      Ver todo en {activeSubcategoria.nombre}
                      <ChevronRight className="text-mosso-dark" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 ${className ?? ''}`}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
