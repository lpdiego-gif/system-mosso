import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { BeneficiosBar, CategoriasRapidas, ProductoCarrusel, MarcaCarrusel } from '@/components/HomeSections';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { ProductoCard, MarcaCard } from '@/types/producto';

interface WelcomeProps {
  productosDestacados: ProductoCard[];
  productosEnOferta: ProductoCard[];
  marcasDestacadas: MarcaCard[];
}

export default function Welcome({
  productosDestacados = [],
  productosEnOferta = [],
  marcasDestacadas = [],
}: WelcomeProps) {
  return (
    <StorefrontLayout>
      {/* Banner principal */}
      <section className="relative overflow-hidden bg-mosso-yellow/15 px-4 py-10 sm:px-6 sm:py-14 md:py-16 lg:px-8 lg:py-20">
        {/* Decoración de fondo */}
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-mosso-yellow/40 blur-3xl sm:h-72 sm:w-72" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 hidden h-64 w-64 rounded-full bg-mosso-red/10 blur-3xl sm:block" />
        <PawScatter />

        <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-10 md:flex-row md:items-end md:justify-center md:gap-12 lg:gap-16">
          <div className="w-full max-w-lg text-center md:text-left">
            <span aria-hidden className="mb-3 hidden items-center gap-1.5 text-mosso-yellow sm:inline-flex">
              <PawIcon className="size-4" />
              <PawIcon className="size-3.5 opacity-70" />
              <PawIcon className="size-3 opacity-40" />
            </span>

            <h1 className="text-3xl leading-[1.05] font-black text-balance text-gray-900 sm:text-4xl lg:text-5xl">
              Todo para tu engreído, en{' '}
              <span className="text-mosso-yellow">un solo lugar</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base text-pretty text-gray-600 sm:text-lg md:mx-0">
              Alimentos, accesorios e higiene para perros y gatos, con delivery
              directo a tu hogar.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-mosso-yellow px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-mosso-yellow/85 hover:shadow-md active:translate-y-0"
              >
                <PawIcon className="size-3.5" />
                Ver catálogo
              </Link>
              <Link
                href={route('ofertas')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-gray-900 px-4 py-2 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
              >
                <TagIcon className="size-3.5" />
                Ver ofertas
              </Link>
            </div>

            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-gray-900/10 pt-6 sm:max-w-md">
              <div>
                <dt className="sr-only">Productos destacados</dt>
                <dd className="text-2xl font-black text-gray-900 sm:text-3xl">{productosDestacados.length}</dd>
                <dd className="text-xs text-gray-500">Destacados</dd>
              </div>
              <div>
                <dt className="sr-only">Delivery</dt>
                <dd className="text-2xl font-black text-gray-900 sm:text-3xl">24h</dd>
                <dd className="text-xs text-gray-500">Delivery</dd>
              </div>
              <div>
                <dt className="sr-only">Productos originales</dt>
                <dd className="text-2xl font-black text-gray-900 sm:text-3xl">100%</dd>
                <dd className="text-xs text-gray-500">Originales</dd>
              </div>
            </dl>
          </div>

          <div className="relative w-full max-w-[260px] shrink-0 sm:max-w-xs md:max-w-sm">
            <BoneIcon className="absolute -top-2 right-2 hidden size-12 rotate-12 text-mosso-yellow/70 lg:block" />

            <img
              src="/image/pets-duo.png"
              alt="Perrito y cachorro MOSSO"
              className="h-auto w-full drop-shadow-xl"
            />

            {productosEnOferta.length > 0 && (
              <div className="absolute -top-3 -left-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lg ring-1 ring-black/5 sm:-left-6">
                <span className="text-lg">🔥</span>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-gray-900">{productosEnOferta.length} ofertas</p>
                  <p className="text-[10px] text-gray-500">activas hoy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <BeneficiosBar />
      <CategoriasRapidas />
      <ProductoCarrusel titulo="Productos Recomendados" productos={productosDestacados} />
      <MarcaCarrusel marcas={marcasDestacadas} />
      <ProductoCarrusel titulo="Ofertas Especiales" productos={productosEnOferta} />
    </StorefrontLayout>
  );
}

function PawScatter() {
  const posiciones = [
    'top-10 left-[8%] size-5 rotate-[-15deg]',
    'top-24 left-[20%] size-3 rotate-[20deg]',
    'bottom-16 right-[14%] size-6 rotate-[10deg]',
    'top-8 right-[28%] size-3.5 rotate-[-25deg]',
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {posiciones.map((clases, i) => (
        <PawIcon key={i} className={`absolute text-gray-900/[0.06] ${clases}`} />
      ))}
    </div>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse cx="7" cy="8.5" rx="1.9" ry="2.4" />
      <ellipse cx="12" cy="6.3" rx="2" ry="2.6" />
      <ellipse cx="17" cy="8.5" rx="1.9" ry="2.4" />
      <path d="M12 11c-3.2 0-6 2.3-6 5.2 0 1.9 1.6 3.3 3.5 3 .9-.1 1.7-.5 2.5-.5s1.6.4 2.5.5c1.9.3 3.5-1.1 3.5-3 0-2.9-2.8-5.2-6-5.2Z" />
    </svg>
  );
}

function BoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.5 9.5a2 2 0 1 0-3.2 2.4 2 2 0 0 0 1.2 3.5 2 2 0 0 0 3.2 2.4l8.3-8.3a2 2 0 0 0 2.4-3.2 2 2 0 0 0-3.5-1.2 2 2 0 0 0-2.4-3.2 2 2 0 0 0-3.5 1.2 2 2 0 0 0-2.5 6.4Z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20.6 12.2 12.4 20.4a1.9 1.9 0 0 1-2.7 0l-6.1-6.1a1.9 1.9 0 0 1 0-2.7L11.8 3.4 20.6 3.4Z" />
      <circle cx="16.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
