import type { ReactNode } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ModalAcceso from '@/components/ModalAcceso';

/**
 * Layout para las páginas PÚBLICAS de la tienda (home, catálogo, producto, carrito...).
 * Distinto de AppLayout (que trae sidebar y es para el panel autenticado/admin).
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mosso-cream flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ModalAcceso />
    </div>
  );
}
