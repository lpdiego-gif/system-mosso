import { Head } from '@inertiajs/react';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaPedidosProps, Pedido } from '@/types/cuenta';

const ESTADO: Record<string, { label: string; cls: string }> = {
  'pendiente de pago': { label: 'Pendiente de pago', cls: 'bg-yellow-50  text-yellow-800  border-yellow-200' },
  pagado:              { label: 'Pagado',            cls: 'bg-sky-50     text-sky-800     border-sky-200'    },
  'en preparación':    { label: 'En preparación',    cls: 'bg-purple-50  text-purple-800  border-purple-200' },
  enviado:             { label: 'Enviado',            cls: 'bg-indigo-50  text-indigo-800  border-indigo-200' },
  entregado:           { label: 'Entregado',          cls: 'bg-green-50   text-green-800   border-green-200'  },
  cancelado:           { label: 'Cancelado',          cls: 'bg-red-50     text-red-700     border-red-200'    },
};

function EstadoBadge({ estado }: { estado: string }) {
  const key = estado.toLowerCase();
  const { label, cls } = ESTADO[key] ?? { label: estado, cls: 'bg-gray-50 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              Pedido #{String(pedido.id_pedido).padStart(6, '0')}
            </span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <p className="mt-1 text-xs text-gray-400">{fecha}</p>
          {pedido.descuento_total > 0 && (
            <p className="mt-0.5 text-xs text-green-600 font-medium">
              Descuento: −S/ {pedido.descuento_total.toFixed(2)}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-gray-900">S/ {pedido.total.toFixed(2)}</p>
          {pedido.descuento_total > 0 && (
            <p className="text-xs text-gray-400">
              Subtotal: S/ {pedido.subtotal.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiCuentaPedidos({ pedidos }: MiCuentaPedidosProps) {
  return (
    <StorefrontLayout>
      <Head title="Mis pedidos" />

      <MiCuentaShell activo="pedidos">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-gray-900">Mis pedidos</h1>
            <p className="mt-1 text-sm text-gray-500">Historial completo de tus compras en MOSSO.</p>
          </div>
          <a
            href="/cambios-y-devoluciones"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300"
          >
            Solicitar cambio o devolución
          </a>
        </div>

        {pedidos.length > 0 ? (
          <div className="space-y-3">
            {pedidos.map((p) => (
              <PedidoCard key={p.id_pedido} pedido={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-3xl select-none">
              📦
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">Aún no tienes pedidos</p>
              <p className="mt-1 text-sm text-gray-500 max-w-xs">
                Cuando realices tu primera compra, aparecerá aquí con su estado y detalle.
              </p>
            </div>
          </div>
        )}
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
