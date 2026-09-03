import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Delta } from '@/types/dashboard';

type DeltaBadgeProps = {
    /** Variación porcentual, o `null` cuando no hay periodo previo con el que comparar. */
    delta: Delta;
    /**
     * Invierte el color: para métricas donde "menos es mejor" (p. ej. tiempo de
     * respuesta). Por defecto, subir es verde y bajar es rojo.
     */
    invert?: boolean;
    /** `pill` = fondo tintado (por defecto). `text` = solo texto con color, estilo reporte. */
    variant?: 'pill' | 'text';
    className?: string;
};

const formatoPorcentaje = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
});

export function DeltaBadge({ delta, invert = false, variant = 'pill', className }: DeltaBadgeProps) {
    if (delta === null) {
        return (
            <span className={cn('text-xs text-muted-foreground', className)}>Sin comparativa</span>
        );
    }

    const subeBien = invert ? delta < 0 : delta > 0;
    const bajaMal = invert ? delta > 0 : delta < 0;
    const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;

    const color = cn(
        subeBien && 'text-emerald-700 dark:text-emerald-400',
        bajaMal && 'text-red-700 dark:text-red-400',
        delta === 0 && 'text-muted-foreground',
    );

    if (variant === 'text') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                    color,
                    className,
                )}
            >
                <Icon className="size-3 shrink-0" aria-hidden />
                {formatoPorcentaje.format(delta)}%
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
                subeBien && 'bg-emerald-500/10',
                bajaMal && 'bg-red-500/10',
                delta === 0 && 'bg-muted',
                color,
                className,
            )}
        >
            <Icon className="size-3 shrink-0" aria-hidden />
            {formatoPorcentaje.format(delta)}%
        </span>
    );
}
