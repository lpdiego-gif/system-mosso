import { Head } from '@inertiajs/react';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { CuponCliente, MiCuentaPuntosProps, PuntoCliente } from '@/types/cuenta';

const TIPO_MOV: Record<string, string> = {
  acumulacion:     'Puntos ganados',
  canje_descuento: 'Canje por descuento',
  canje_producto:  'Canje por producto',
  vencimiento:     'Puntos vencidos',
};

const ORIGEN_CUPON: Record<string, string> = {
  cumpleanos_mascota: '🐾 Cumpleaños mascota',
  bienvenida:         '🎉 Bienvenida',
  promocion_manual:   '🏷️ Promoción',
};

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function descripcionCupon(c: CuponCliente) {
  if (c.tipo === 'descuento_porcentaje' && c.valor != null) return `${c.valor}% de descuento`;
  if (c.tipo === 'descuento_monto' && c.valor != null) return `S/ ${c.valor.toFixed(2)} de descuento`;
  if (c.tipo === 'envio_gratis') return 'Envío gratis';
  if (c.tipo === 'producto_gratis') return 'Producto gratis';
  if (c.tipo === 'puntos_bonus') return 'Puntos bonus';
  return c.tipo;
}

function CuponCard({ c }: { c: CuponCliente }) {
  const vencido = new Date(c.fecha_vencimiento) < new Date();
  const inactivo = c.usado || vencido;

  return (
    <div
      className={`rounded-2xl border p-4 flex items-start justify-between gap-4 transition-opacity ${
        inactivo
          ? 'border-gray-200 bg-white opacity-50'
          : 'border-mosso-yellow bg-mosso-yellow/5'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 mb-0.5">{ORIGEN_CUPON[c.origen] ?? c.origen}</p>
        <p className="text-base font-black text-gray-900 leading-tight">{descripcionCupon(c)}</p>
        <code className="mt-1.5 inline-block text-xs font-mono bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-gray-600 tracking-wider">
          {c.codigo}
        </code>
        <p className="mt-1 text-[11px] text-gray-400">Válido hasta {fechaCorta(c.fecha_vencimiento)}</p>
      </div>
      <span
        className={`shrink-0 text-[11px] font-bold pt-0.5 ${
          c.usado ? 'text-gray-400' : vencido ? 'text-red-400' : 'text-green-600'
        }`}
      >
        {c.usado ? 'Usado' : vencido ? 'Vencido' : 'Activo'}
      </span>
    </div>
  );
}

function MovFila({ m }: { m: PuntoCliente }) {
  const pos = m.monto > 0;
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-gray-800 font-medium">{TIPO_MOV[m.tipo] ?? m.tipo}</p>
        {m.descripcion && <p className="text-xs text-gray-400 truncate">{m.descripcion}</p>}
        <p className="text-xs text-gray-400">{fechaCorta(m.fecha)}</p>
      </div>
      <span className={`shrink-0 text-sm font-bold ${pos ? 'text-green-600' : 'text-red-500'}`}>
        {pos ? '+' : ''}{m.monto} pts
      </span>
    </div>
  );
}

export default function MiCuentaPuntos({ total_puntos, movimientos, cupones }: MiCuentaPuntosProps) {
  const activos = cupones.filter((c) => !c.usado && new Date(c.fecha_vencimiento) >= new Date());

  return (
    <StorefrontLayout>
      <Head title="Puntos y cupones" />

      <MiCuentaShell activo="puntos">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Puntos y cupones</h1>
          <p className="mt-1 text-sm text-gray-500">Acumula puntos con cada compra y canjéalos por descuentos.</p>
        </div>

        {/* Balance widget */}
        <div className="bg-gradient-to-br from-mosso-yellow to-amber-400 rounded-2xl p-6 mb-8 flex items-center justify-between gap-6 shadow-md">
          <div>
            <p className="text-xs font-semibold text-amber-900/60 uppercase tracking-widest">Tus puntos</p>
            <p className="text-5xl font-black text-gray-900 mt-1 leading-none">
              {total_puntos.toLocaleString('es-PE')}
            </p>
            <p className="text-sm text-amber-900/60 mt-1">
              {activos.length > 0
                ? `${activos.length} cupón${activos.length > 1 ? 'es' : ''} disponible${activos.length > 1 ? 's' : ''}`
                : 'Sin cupones activos'}
            </p>
          </div>
          <span className="text-6xl select-none opacity-80">⭐</span>
        </div>

        {/* Cupones */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Cupones
            {activos.length > 0 && (
              <span className="ml-2 text-[11px] font-bold bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                {activos.length} activo{activos.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          {cupones.length > 0 ? (
            <div className="space-y-3">
              {cupones.map((c) => <CuponCard key={c.id_cupon} c={c} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aún no tienes cupones asignados.</p>
          )}
        </section>

        {/* Historial */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Historial de puntos</h2>
          {movimientos.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5">
              {movimientos.map((m) => <MovFila key={m.id_punto} m={m} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aún no tienes movimientos registrados.</p>
          )}
        </section>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
