import { Link } from '@inertiajs/react';

/**
 * Footer del sitio público (StorefrontLayout). Mismo criterio visual que Header.tsx:
 * componentes simples + íconos SVG hechos a mano (sin lucide-react ni componentes de ui/,
 * esos son del panel admin).
 */

const enlacesTienda = [
  { label: 'Perros', href: '/catalogo/animal/1' },
  { label: 'Gatos', href: '/catalogo/animal/2' },
  { label: 'Alimentos', href: '#' },
  { label: 'Accesorios', href: '#' },
  { label: 'Higiene', href: '#' },
  { label: 'Ofertas', href: '/ofertas' },
];

const enlacesAyuda = [
  { label: 'Delivery', href: '#' },
  { label: 'Métodos de pago', href: '#' },
  { label: 'Cambios y devoluciones', href: '#' },
  { label: 'Preguntas frecuentes', href: '#' },
  { label: 'Términos y condiciones', href: '#' },
  { label: 'Libro de reclamaciones', href: '/libro-de-reclamaciones' },
];

const mediosPago = ['VISA', 'Mastercard', 'Amex', 'Yape', 'Plin', 'Culqi'];

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-gray-300">
      <div className="max-w-[1440px] mx-auto px-6 py-10 md:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-10">
        {/* Columna 1: Branding */}
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            MOSSO
          </Link>
          <p className="mt-3 text-sm text-gray-400 max-w-[220px]">
            Todo para tu engreído, en un solo lugar.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <RedSocialIcon href="#" label="Facebook">
              <FacebookIcon />
            </RedSocialIcon>
            <RedSocialIcon href="#" label="Instagram">
              <InstagramIcon />
            </RedSocialIcon>
            <RedSocialIcon href="#" label="TikTok">
              <TiktokIcon />
            </RedSocialIcon>
          </div>
        </div>

        {/* Columna 2: Tienda */}
        <FooterColumna titulo="Tienda">
          {enlacesTienda.map((item) => (
            <FooterLink key={item.label} href={item.href}>
              {item.label}
            </FooterLink>
          ))}
        </FooterColumna>

        {/* Columna 3: Ayuda */}
        <FooterColumna titulo="Ayuda">
          {enlacesAyuda.map((item) => (
            <FooterLink key={item.label} href={item.href}>
              {item.label}
            </FooterLink>
          ))}
        </FooterColumna>

        {/* Columna 4: Contacto */}
        <FooterColumna titulo="Contacto">
          <li className="flex items-start gap-2 text-sm text-gray-400">
            <MapPinIcon className="shrink-0 mt-0.5 text-orange-500" />
            Lima, Perú
          </li>
          <li className="flex items-start gap-2 text-sm">
            <PhoneIcon className="shrink-0 mt-0.5 text-orange-500" />
            <a
              href="https://wa.me/51999123456"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white"
            >
              +51 999 123 456
            </a>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <MailIcon className="shrink-0 mt-0.5 text-orange-500" />
            <a href="mailto:hola@mosso.com.pe" className="text-gray-400 hover:text-white">
              hola@mosso.com.pe
            </a>
          </li>
        </FooterColumna>

        {/* Columna 5: Medios de pago */}
        <FooterColumna titulo="Medios de pago">
          <li className="flex flex-wrap gap-2">
            {mediosPago.map((medio) => (
              <span
                key={medio}
                className="flex items-center justify-center rounded-md bg-white/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-200"
              >
                {medio}
              </span>
            ))}
          </li>
        </FooterColumna>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-xs text-gray-500 text-center">
          <p>© {new Date().getFullYear()} MOSSO. Todos los derechos reservados.</p>
          <p className="flex flex-wrap items-center justify-center gap-2">
            <a href="#" className="hover:text-gray-300">
              Política de privacidad
            </a>
            <span aria-hidden="true">|</span>
            <a href="#" className="hover:text-gray-300">
              Términos y condiciones
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wide">{titulo}</h3>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const esExterno = href === '#';

  if (esExterno) {
    return (
      <li>
        <a href={href} className="text-sm text-gray-400 hover:text-white">
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className="text-sm text-gray-400 hover:text-white">
        {children}
      </Link>
    </li>
  );
}

function RedSocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

/* --- Iconos --- */

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-2.79-2.15h-3.09v13.3a2.6 2.6 0 1 1-2.19-2.57v-3.13a5.76 5.76 0 1 0 5.28 5.7V9.4a7.3 7.3 0 0 0 4.38 1.45V7.71a4.26 4.26 0 0 1-1.59-1.89Z" />
    </svg>
  );
}
