import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuItem } from '@/types/menu';

interface PageProps {
  menu: MenuItem[];
  [key: string]: unknown;
}

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { menu } = usePage<PageProps>().props;
  const [expandido, setExpandido] = useState<number | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* fondo oscuro */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel lateral */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="font-bold text-lg">Menú</span>
          <button onClick={onClose} aria-label="Cerrar menú" className="p-1">
            <CloseIcon />
          </button>
        </div>

        <ul>
          {menu.map((item) => (
            <li key={item.id} className="border-b border-gray-50">
              <div className="flex items-center justify-between px-4 py-3">
                <Link
                  href={item.href ?? '#'}
                  className={`text-sm font-semibold ${
                    item.destacado ? 'text-orange-500' : 'text-gray-900'
                  }`}
                  onClick={() => item.columnas.length === 0 && onClose()}
                >
                  {item.icono && <span className="mr-1">{item.icono}</span>}
                  {item.nombre}
                </Link>

                {item.columnas.length > 0 && (
                  <button
                    onClick={() => setExpandido(expandido === item.id ? null : item.id)}
                    aria-label="Expandir"
                    className="p-1"
                  >
                    <ChevronDown expanded={expandido === item.id} />
                  </button>
                )}
              </div>

              {expandido === item.id && item.columnas.length > 0 && (
                <ul className="bg-gray-50 px-6 pb-2">
                  {item.columnas[0].items.map((sub) => (
                    <li key={sub.id} className="py-1.5">
                      <Link
                        href={sub.href}
                        className="text-sm text-gray-700"
                        onClick={onClose}
                      >
                        {sub.nombre}
                      </Link>
                      {sub.hijos.length > 0 && (
                        <ul className="pl-4 mt-1 space-y-1">
                          {sub.hijos.map((nieto) => (
                            <li key={nieto.id}>
                              <Link
                                href={nieto.href}
                                className="text-xs text-gray-500"
                                onClick={onClose}
                              >
                                {nieto.nombre}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronDown({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}