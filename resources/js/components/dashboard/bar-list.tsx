import { cn } from '@/lib/utils';

export type BarRow = {
    /** Clave estable para React y para el `key`. */
    id: string;
    label: string;
    /** Valor numérico que dimensiona la barra. */
    value: number;
    /** Texto alineado a la derecha (ya formateado). */
    valueLabel: string;
    /** Segunda línea opcional bajo la etiqueta (SKU, unidades, %…). */
    meta?: string;
    /** Prefijo opcional: número de ranking, medalla, etc. */
    rank?: number;
};

type BarListProps = {
    rows: BarRow[];
    emptyMessage: string;
    className?: string;
};

export function BarList({ rows, emptyMessage, className }: BarListProps) {
    if (rows.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    const max = Math.max(...rows.map((r) => r.value), 1);

    return (
        <ul className={cn('flex flex-col gap-3.5', className)}>
            {rows.map((row) => (
                <li key={row.id} className="grid gap-1.5">
                    <div className="flex items-baseline gap-3">
                        {row.rank !== undefined && (
                            <span className="w-4 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                                {row.rank}
                            </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {row.label}
                            {row.meta && (
                                <span className="ml-2 font-normal text-muted-foreground">{row.meta}</span>
                            )}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                            {row.valueLabel}
                        </span>
                    </div>
                    <div
                        className={cn(
                            'h-1.5 overflow-hidden rounded-full bg-muted',
                            row.rank !== undefined && 'ml-7',
                        )}
                    >
                        <div
                            className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                            style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
