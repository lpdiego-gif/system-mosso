import { Link, usePage } from '@inertiajs/react';
import type { EmpresaPublica } from '@/types/empresa';

interface FooterPageProps {
  empresa: EmpresaPublica | null;
  [key: string]: unknown;
}

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

function whatsappUrl(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  const conCodigo = digitos.startsWith('51') ? digitos : `51${digitos}`;

  return `https://wa.me/${conCodigo}`;
}

export default function Footer() {
  const { empresa } = usePage<FooterPageProps>().props;

  const nombre = empresa?.nombre_comercial || 'MOSSO';
  const direccion = empresa?.direccion
    ? `${empresa.direccion}${empresa.distrito ? `, ${empresa.distrito}` : ''}`
    : 'Lima, Perú';
  const telefono = empresa?.telefono || '+51 999 123 456';
  const correo = empresa?.correo || 'hola@mosso.com.pe';

  return (
    <footer className="relative overflow-hidden bg-black text-gray-300">
      {/* Acento de marca */}
      <div className="h-[3px] w-full bg-gradient-to-r from-mosso-yellow via-amber-300 to-mosso-yellow" />

      {/* Resplandores decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-mosso-yellow/10 blur-[110px]" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-mosso-red/5 blur-[110px]" />
      </div>

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:gap-x-8 sm:px-6 md:py-16 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] lg:gap-x-10">
        {/* Columna 1: Branding */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label={nombre} className="flex items-center gap-2.5">
            {empresa?.logo ? (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
                  <img
                    src={`/storage/${empresa.logo}`}
                    alt={nombre}
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="text-lg font-black tracking-tight text-white">{nombre}</span>
              </>
            ) : (
              <span className="text-xl font-black tracking-tight text-white">{nombre}</span>
            )}
          </Link>
          <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-gray-400">
            Todo para tu engreído, en un solo lugar.
          </p>
          <div className="mt-6 flex items-center gap-2.5">
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
          <li className="flex items-start gap-3 text-sm">
            <IconChip>
              <MapPinIcon />
            </IconChip>
            <span className="break-words pt-1.5 text-gray-400">{direccion}</span>
          </li>
          <li className="group flex items-start gap-3 text-sm">
            <IconChip>
              <PhoneIcon />
            </IconChip>
            <a
              href={whatsappUrl(telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words pt-1.5 text-gray-400 transition-colors group-hover:text-white"
            >
              {telefono}
            </a>
          </li>
          <li className="group flex items-start gap-3 text-sm">
            <IconChip>
              <MailIcon />
            </IconChip>
            <a
              href={`mailto:${correo}`}
              className="break-all pt-1.5 text-gray-400 transition-colors group-hover:text-white"
            >
              {correo}
            </a>
          </li>
        </FooterColumna>

        {/* Columna 5: Medios de pago */}
        <FooterColumna titulo="Medios de pago">
          <li className="flex flex-wrap gap-2">
            {mediosPago.map((medio) => (
              <span
                key={medio}
                className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-300 transition-colors hover:border-mosso-yellow/40 hover:text-white"
              >
                {medio}
              </span>
            ))}
          </li>
        </FooterColumna>
      </div>

      {/* Barra inferior */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-3 px-4 py-6 text-center text-xs text-gray-500 sm:flex-row sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-gray-400">{nombre.toUpperCase()}</span>.
            Todos los derechos reservados.
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="#" className="transition-colors hover:text-gray-300">
              Política de privacidad
            </a>
            <span className="h-1 w-1 shrink-0 rounded-full bg-gray-700" aria-hidden="true" />
            <a href="#" className="transition-colors hover:text-gray-300">
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
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
        <span className="h-3.5 w-1 shrink-0 rounded-full bg-mosso-yellow" aria-hidden="true" />
        {titulo}
      </h3>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const esExterno = href === '#';
  const className =
    'inline-block text-sm text-gray-400 transition-all duration-200 hover:translate-x-0.5 hover:text-white';

  if (esExterno) {
    return (
      <li>
        <a href={href} className={className}>
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-mosso-yellow ring-1 ring-white/10">
      {children}
    </span>
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-mosso-yellow hover:bg-mosso-yellow hover:text-gray-900 hover:shadow-lg hover:shadow-mosso-yellow/20"
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
