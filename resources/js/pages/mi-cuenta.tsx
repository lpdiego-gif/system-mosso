import { Head, Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { logout } from '@/routes';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaProps } from '@/types/cuenta';

export default function MiCuenta({ user }: MiCuentaProps) {
  return (
    <StorefrontLayout>
      <Head title="Mi cuenta" />

      <MiCuentaShell activo="escritorio">
        <p className="text-gray-900">
          Hola <strong>{user.name}</strong> (¿no eres <strong>{user.name}</strong>?{' '}
          <Link href={logout()} as="button" className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
            Cerrar sesión
          </Link>
          )
        </p>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-2xl">
          Desde el escritorio de tu cuenta puedes ver tus{' '}
          <Link href="/mi-cuenta/pedidos" className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
            pedidos
          </Link>{' '}
          recientes, gestionar tus{' '}
          <Link href="/mi-cuenta/direcciones" className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
            direcciones de envío y facturación
          </Link>{' '}
          y editar tu{' '}
          <Link href="/mi-cuenta/detalles" className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
            contraseña y los detalles de tu cuenta
          </Link>
          .
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <TarjetaAcceso icono={<PedidosIcon />} titulo="Pedidos" href="/mi-cuenta/pedidos" />
          <TarjetaAcceso icono={<DireccionesIcon />} titulo="Direcciones" href="/mi-cuenta/direcciones" />
          <TarjetaAcceso icono={<DetallesIcon />} titulo="Detalles de la cuenta" href="/mi-cuenta/detalles" />
          <TarjetaAcceso icono={<LogoutIcon />} titulo="Cerrar sesión" href={logout()} logout />
        </div>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}

function TarjetaAcceso({
  icono,
  titulo,
  href,
  logout,
}: {
  icono: ReactNode;
  titulo: string;
  href: NonNullable<InertiaLinkProps['href']>;
  logout?: boolean;
}) {
  return (
    <Link
      href={href}
      as={logout ? 'button' : undefined}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-center hover:border-mosso-yellow hover:shadow-md transition-all"
    >
      <span className="text-mosso-yellow">{icono}</span>
      <span className="text-sm font-semibold text-gray-900">{titulo}</span>
    </Link>
  );
}

/* --- Iconos --- */

function PedidosIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function DireccionesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DetallesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
