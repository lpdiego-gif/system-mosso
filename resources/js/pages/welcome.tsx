import StorefrontLayout from '@/layouts/storefront-layout';

export default function Welcome() {
  return (
    <StorefrontLayout>
      <section className="bg-orange-50 px-6 py-16">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="max-w-lg">
            <h1 className="text-5xl font-black text-gray-900 leading-tight">
              Todo para tu engreído, en{' '}
              <span className="text-orange-500">un solo lugar</span>
            </h1>
            <p className="mt-4 text-gray-600">
              Alimentos, accesorios e higiene para perros y gatos, con delivery
              directo a tu hogar.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg">
                Ver catálogo
              </button>
              <button className="border border-gray-300 font-bold px-6 py-3 rounded-lg">
                Ver ofertas
              </button>
            </div>
          </div>
          <img
            src="/image/pets-duo.png"
            alt="Perrito y cachorro MOSSO"
            className="max-w-md w-full h-auto"
          />
        </div>
      </section>

      {/* Franja de beneficios: Delivery rápido, Paga seguro, Calidad, WhatsApp */}
      <section className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-4 gap-6">
          {/* aquí van tus 4 bloques de beneficios */}
        </div>
      </section>
    </StorefrontLayout>
  );
}