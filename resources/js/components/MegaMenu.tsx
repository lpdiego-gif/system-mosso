import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import type { MenuHijo, MenuItem } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  [key: string]: unknown;
}

/**
 * Barra de navegación con mega menu.
 *
 * Desktop: MegaMenu
 * Mobile: MobileMenu.tsx
 */
export default function MegaMenu() {
  const { menu } = usePage<PageProps>().props;

  const grupoIzquierdo = menu.filter(
    (i) => i.tipo === 'animal' || i.tipo === 'tipo_animal'
  );

  const grupoDerecho = menu.filter(
    (i) => i.tipo !== 'animal' && i.tipo !== 'tipo_animal'
  );

  return (
    <nav className="relative hidden border-t border-gray-100 bg-white md:block">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 md:px-6">

        {/* Menú izquierdo */}
        <ul className="flex items-center gap-1">
          {grupoIzquierdo.map((item) => (
            <MenuLinkItem
              key={item.id}
              item={item}
              align="left"
            />
          ))}
        </ul>

        {/* Menú derecho */}
        <ul className="flex items-center gap-1">
          {grupoDerecho.map((item) => (
            <MenuLinkItem
              key={item.id}
              item={item}
              align="right"
            />
          ))}
        </ul>

      </div>
    </nav>
  );
}

/**
 * Ítem individual del menú.
 *
 * Maneja:
 * - Animales
 * - Categorías
 * - Subcategorías
 * - Productos
 * - Marcas
 * - Servicios
 * - Exóticos
 */
function MenuLinkItem({
  item,
  align,
}: {
  item: MenuItem;
  align: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);

  const [activeCategoria, setActiveCategoria] =
    useState<MenuHijo | null>(null);

  const [activeSubcategoria, setActiveSubcategoria] =
    useState<MenuHijo | null>(null);

  const tieneDropdown = item.columnas.length > 0;

  /**
   * Marcas:
   * Se muestran como un grid de logos.
   */
  const esMarca = item.tipo === 'marca';

  /**
   * Listas simples:
   * Servicios, Exóticos, etc.
   */
  const esListaPlana =
    tieneDropdown &&
    item.columnas[0].items.every(
      (i) => i.hijos.length === 0
    );

  /**
   * Abrir menú.
   */
  const handleOpen = () => {
    if (!tieneDropdown) {
      return;
    }

    const primeraCategoria =
      item.columnas[0]?.items[0] ?? null;

    setOpen(true);

    setActiveCategoria(primeraCategoria);

    setActiveSubcategoria(
      primeraCategoria?.hijos[0] ?? null
    );
  };

  /**
   * Cerrar menú.
   */
  const handleClose = () => {
    setOpen(false);

    setActiveCategoria(null);

    setActiveSubcategoria(null);
  };

  /**
   * Seleccionar categoría.
   */
  const seleccionarCategoria = (
    categoria: MenuHijo
  ) => {
    setActiveCategoria(categoria);

    setActiveSubcategoria(
      categoria.hijos[0] ?? null
    );
  };

  return (
    <li
      className="relative flex h-14 items-center"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >

      {/* Botón principal */}
      <Link
        href={item.href ?? '#'}
        className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
          item.destacado
            ? 'bg-mosso-red/10 text-mosso-red hover:bg-mosso-red/15'
            : open
              ? 'bg-gray-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >

        {item.icono && (
          <span className="text-base leading-none">
            {item.icono}
          </span>
        )}

        {item.nombre}

        {tieneDropdown && (
          <ChevronDown open={open} />
        )}

      </Link>

      {/* Dropdown */}
      {tieneDropdown && (
        <div
          className={`absolute top-full pt-2 transition-[opacity,transform] duration-150 ease-out ${
            align === 'left'
              ? 'left-0'
              : 'right-0'
          } ${
            open
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-1 opacity-0'
          }`}
        >

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-black/[0.02]">

            {/* =====================================================
                MARCAS
            ====================================================== */}
            {esMarca ? (
              <>

                <div className="flex items-center justify-between px-5 pt-5">

                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Nuestras marcas
                  </p>

                  <Link
                    href={item.href ?? '/marcas'}
                    className="text-xs font-semibold text-mosso-yellow hover:underline"
                  >
                    Ver todas →
                  </Link>

                </div>

                <div className="grid w-[680px] grid-cols-4 gap-3 p-5">

                  {item.columnas[0].items.map(
                    (marca) => (
                      <Link
                        key={marca.id}
                        href={marca.href}
                        className="flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-mosso-yellow hover:shadow-md"
                      >

                        {marca.logo ? (
                          <img
                            src={marca.logo}
                            alt={marca.nombre}
                            className="mx-auto h-12 max-w-full object-contain"
                          />
                        ) : (
                          <span className="px-1 text-center text-xs font-bold leading-tight text-gray-900">
                            {marca.nombre}
                          </span>
                        )}

                      </Link>
                    )
                  )}

                </div>

              </>

            ) : esListaPlana ? (

              /* =====================================================
                 SERVICIOS / EXÓTICOS
              ====================================================== */
              <ul className="w-60 p-2">

                {item.columnas[0].items.map(
                  (op) => (
                    <li key={op.id}>

                      <Link
                        href={op.href}
                        className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-mosso-yellow/10 hover:text-mosso-dark"
                      >
                        {op.nombre}
                      </Link>

                    </li>
                  )
                )}

              </ul>

            ) : (

              /* =====================================================
                 MEGA MENÚ NORMAL
              ====================================================== */
              <div className="flex">

                {/* =================================================
                    CATEGORÍAS
                ================================================== */}
                <ul className="w-60 shrink-0 space-y-0.5 border-r border-gray-100 p-2">

                  {item.columnas[0].items.map(
                    (categoria) => {

                      const activa =
                        activeCategoria?.id ===
                        categoria.id;

                      return (
                        <li
                          key={categoria.id}
                          onMouseEnter={() =>
                            seleccionarCategoria(
                              categoria
                            )
                          }
                        >

                          <Link
                            href={categoria.href}
                            className={`flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors ${
                              activa
                                ? 'bg-mosso-yellow/10 font-semibold text-gray-900'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >

                            <span className="truncate">
                              {categoria.nombre}
                            </span>

                            {categoria.hijos.length >
                              0 && (
                                <ChevronRight
                                  className={
                                    activa
                                      ? 'text-mosso-dark'
                                      : 'text-gray-300'
                                  }
                                />
                              )}

                          </Link>

                        </li>
                      );
                    }
                  )}

                </ul>

                {/* =================================================
                    SUBCATEGORÍAS
                ================================================== */}
                {activeCategoria &&
                  activeCategoria.hijos.length >
                    0 && (

                    <ul className="w-56 shrink-0 space-y-0.5 border-r border-gray-100 p-2">

                      {activeCategoria.hijos.map(
                        (sub) => {

                          const subActiva =
                            activeSubcategoria?.id ===
                            sub.id;

                          const tieneProductos =
                            !!sub.productos?.length;

                          return (
                            <li
                              key={sub.id}
                              onMouseEnter={() =>
                                setActiveSubcategoria(
                                  sub
                                )
                              }
                            >

                              <Link
                                href={sub.href}
                                className={`flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors ${
                                  subActiva
                                    ? 'bg-mosso-yellow/10 font-semibold text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >

                                <span className="min-w-0 flex-1 truncate">
                                  {sub.nombre}
                                </span>

                                {tieneProductos && (
                                  <ChevronRight
                                    className={
                                      subActiva
                                        ? 'text-mosso-dark'
                                        : 'text-gray-300'
                                    }
                                  />
                                )}

                              </Link>

                            </li>
                          );
                        }
                      )}

                    </ul>
                  )}

                {/* =================================================
                    PRODUCTOS
                ================================================== */}
                {activeSubcategoria &&
                  !!activeSubcategoria.productos
                    ?.length && (

                    <div className="w-[236px] shrink-0 p-4">

                      <p className="mb-2 truncate px-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                        {activeSubcategoria.nombre}
                      </p>

                      <div className="grid grid-cols-2 gap-2">

                        {activeSubcategoria.productos.map(
                          (producto) => (

                            <img
                              key={producto.id}
                              src={producto.imagen ?? '/image/paw-icon.png'}
                              alt={producto.nombre}
                              title={producto.nombre}
                              className="aspect-square w-full rounded-lg border border-gray-200 bg-gray-50 object-cover transition-colors hover:border-mosso-yellow"
                              onError={(e) => { e.currentTarget.src = '/image/paw-icon.png'; e.currentTarget.onerror = null; }}
                            />

                          )
                        )}

                      </div>

                      <Link
                        href={
                          activeSubcategoria.href
                        }
                        className="mt-3 flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-mosso-dark transition-colors hover:bg-mosso-yellow/10"
                      >

                        Ver todo en{' '}
                        {activeSubcategoria.nombre}

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

/**
 * Icono flecha hacia abajo.
 */
function ChevronDown({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Icono flecha hacia la derecha.
 */
function ChevronRight({
  className,
}: {
  className?: string;
}) {
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