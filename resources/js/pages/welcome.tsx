import StorefrontLayout from '@/layouts/storefront-layout';
import { BeneficiosBar, ProductoCarrusel, MarcaCarrusel } from '@/components/HomeSections';
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
      <section className="bg-mosso-yellow/15 px-6 py-16 overflow-hidden">
        <div className="max-w-[1440px] mx-auto flex items-end justify-between gap-8">
          <div className="max-w-lg shrink-0">
            <h1 className="text-5xl font-black text-gray-900 leading-tight">
              Todo para tu engreído, en{' '}
              <span className="text-mosso-yellow">un solo lugar</span>
            </h1>
            <p className="mt-4 text-gray-600">
              Alimentos, accesorios e higiene para perros y gatos, con delivery
              directo a tu hogar.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                Ver catálogo
              </button>
              <button className="border-2 border-gray-900 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-900 hover:text-white transition-colors">
                Ver ofertas
              </button>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <img
              src="/image/pets-duo.png"
              alt="Perrito y cachorro MOSSO"
              className="max-w-md w-full h-auto"
            />
          </div>
        </div>
      </section>

      <BeneficiosBar />
      <ProductoCarrusel titulo="Productos Recomendados" productos={productosDestacados} />
      <MarcaCarrusel marcas={marcasDestacadas} />
      <ProductoCarrusel titulo="Ofertas Especiales" productos={productosEnOferta} />
    </StorefrontLayout>
  );
}
