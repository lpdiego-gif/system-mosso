import { Head, Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { destroy as sessionDestroy } from '@/actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaProps } from '@/types/cuenta';
import type { MenuCuentaItem } from '@/types/menu-cuenta';

interface PageProps {
  menuCuenta: MenuCuentaItem[];
  [key: string]: unknown;
}

function toTitleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number | string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2 hover:border-mosso-yellow hover:shadow-md transition-all"
    >
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
        {label}
      </span>
    </Link>
  );
}

/* ── Quick-access tile ──────────────────────────────────── */
function Acceso({
  icono,
  titulo,
  desc,
  href,
  isLogout,
}: {
  icono: ReactNode;
  titulo: string;
  desc: string;
  href: NonNullable<InertiaLinkProps['href']>;
  isLogout?: boolean;
}) {
  return (
    <Link
      href={href}
      as={isLogout ? 'button' : undefined}
      method={isLogout ? 'post' : undefined}
      className="group flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-mosso-yellow hover:shadow-md transition-all text-left"
    >
      <span className="shrink-0 w-10 h-10 rounded-xl bg-mosso-yellow/10 text-mosso-yellow flex items-center justify-center group-hover:bg-mosso-yellow/20 transition-colors">
        {icono}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{titulo}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function MiCuenta({ user, resumen }: MiCuentaProps) {
  const { menuCuenta } = usePage<PageProps>().props;
  const nombre = toTitleCase(user.name);

  return (
    <StorefrontLayout>
      <Head title="Mi cuenta" />

      <MiCuentaShell activo="escritorio">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">
            Hola, {nombre} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenido a tu cuenta MOSSO.{' '}
            <Link
              href={sessionDestroy.url()}
              method="post"
              as="button"
              className="text-gray-400 hover:text-mosso-red transition-colors hover:underline"
            >
              ¿No eres tú?
            </Link>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <StatCard label="Pedidos" value={resumen.total_pedidos} href="/mi-cuenta/pedidos" color="text-gray-900" />
          <StatCard label="Mascotas" value={resumen.total_mascotas} href="/mi-cuenta/mascotas" color="text-gray-900" />
          <StatCard label="Puntos" value={resumen.total_puntos.toLocaleString('es-PE')} href="/mi-cuenta/puntos" color="text-mosso-yellow" />
          <StatCard label={resumen.cupones_activos === 1 ? 'Cupón disponible' : 'Cupones disponibles'} value={resumen.cupones_activos} href="/mi-cuenta/puntos" color="text-green-600" />
        </div>

        {/* Quick access — construido desde menu_cuenta: si el admin desactiva
            una sección o enlace, desaparece de aquí automáticamente. */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuCuenta.map((item) => (
            <Acceso
              key={item.id}
              icono={iconoPorClave(item.clave)}
              titulo={item.nombre}
              desc={item.descripcion ?? ''}
              href={item.href}
            />
          ))}
          <Acceso
            icono={<LogoutIcon />}
            titulo="Cerrar sesión"
            desc="Salir de tu cuenta"
            href={sessionDestroy.url()}
            isLogout
          />
        </div>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}

/* ── Iconos por sección ─────────────────────────────────── */
function iconoPorClave(clave: string | null): ReactNode {
  switch (clave) {
    case 'pedidos':
      return <PedidosIcon />;
    case 'direcciones':
      return <DireccionesIcon />;
    case 'mascotas':
      return <MascotasIcon />;
    case 'puntos_cupones':
      return <PuntosIcon />;
    case 'detalles':
      return <DetallesIcon />;
    default:
      // Enlaces URL libres agregados desde el admin.
      return <EnlaceIcon />;
  }
}

function PedidosIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}
function DireccionesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function DetallesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function MascotasIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
  );
}
function PuntosIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function EnlaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}
