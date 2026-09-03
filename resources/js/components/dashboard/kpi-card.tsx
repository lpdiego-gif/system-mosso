import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Delta } from '@/types/dashboard';
import { DeltaBadge } from './delta-badge';
import { Sparkline } from './sparkline';

export type KpiAccent = 'indigo' | 'emerald' | 'amber' | 'violet' | 'sky' | 'rose';

/**
 * Clases literales (el compilador de Tailwind necesita verlas completas).
 * En claro la tarjeta lleva un lavado de color para que resalte; en oscuro
 * la superficie es neutra y el color lo cargan el icono y la mini-gráfica.
 */
const CARD: Record<KpiAccent, string> = {
    indigo: 'bg-indigo-50 border-indigo-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
    emerald: 'bg-emerald-50 border-emerald-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
    amber: 'bg-amber-50 border-amber-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
    violet: 'bg-violet-50 border-violet-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
    sky: 'bg-sky-50 border-sky-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
    rose: 'bg-rose-50 border-rose-200/70 dark:bg-white/[0.02] dark:border-white/[0.07]',
};

const CHIP: Record<KpiAccent, string> = {
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
    sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
};

const LINEA: Record<KpiAccent, string> = {
    indigo: 'text-indigo-500 dark:text-indigo-400',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    amber: 'text-amber-500 dark:text-amber-400',
    violet: 'text-violet-500 dark:text-violet-400',
    sky: 'text-sky-500 dark:text-sky-400',
    rose: 'text-rose-500 dark:text-rose-400',
};

type KpiCardProps = {
    label: string;
    value: string;
    /** Texto pequeño junto al delta (p. ej. "vs. 30 días previos"). */
    context: string;
    delta: Delta;
    invertDelta?: boolean;
    icon: LucideIcon;
    accent: KpiAccent;
    /** Serie diaria para la mini-gráfica del pie de la tarjeta. */
    serie: number[];
    /** Convierte toda la tarjeta en un enlace a la bandeja correspondiente. */
    href?: string;
};

export function KpiCard({
    label,
    value,
    context,
    delta,
    invertDelta,
    icon: Icon,
    accent,
    serie,
    href,
}: KpiCardProps) {
    const body = (
        <>
            <div className="flex items-center gap-2.5">
                <span
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        CHIP[accent],
                    )}
                >
                    <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {value}
            </p>

            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <DeltaBadge delta={delta} invert={invertDelta} variant="text" />
                <span className="text-xs text-muted-foreground">{context}</span>
            </p>

            <div className={cn('mt-3', LINEA[accent])}>
                <Sparkline values={serie} />
            </div>
        </>
    );

    const base = cn('rounded-xl border p-4 shadow-sm sm:p-5', CARD[accent]);

    if (href) {
        return (
            <Link
                href={href}
                className={cn(
                    base,
                    'group block transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                )}
            >
                {body}
            </Link>
        );
    }

    return <div className={base}>{body}</div>;
}
