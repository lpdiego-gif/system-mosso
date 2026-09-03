import { cn } from '@/lib/utils';

/**
 * Colorea el estado del pedido según el id de `estados_pedido`:
 * 1 Pendiente de pago · 2 Pagado · 3 En preparación · 4 Enviado ·
 * 5 Entregado · 6 Cancelado · 7 Devuelto.
 */
const TONO: Record<number, string> = {
    1: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    2: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    3: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    4: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    5: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    6: 'bg-red-500/10 text-red-700 dark:text-red-400',
    7: 'bg-muted text-muted-foreground',
};

export function EstadoPedidoBadge({ estado, estadoId }: { estado: string; estadoId: number }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
                TONO[estadoId] ?? 'bg-muted text-muted-foreground',
            )}
        >
            <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
            {estado}
        </span>
    );
}
