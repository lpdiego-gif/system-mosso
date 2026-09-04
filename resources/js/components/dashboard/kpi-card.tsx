import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Delta } from '@/types/dashboard';
import { DeltaBadge } from './delta-badge';
import { Sparkline } from './sparkline';

type KpiCardProps = {
    label: string;
    value: string;
    /** Texto pequeño junto al delta (p. ej. "vs. 30 días previos"). */
    context: string;
    delta: Delta;
    invertDelta?: boolean;
    icon: LucideIcon;
    /** Serie diaria para la mini-gráfica del pie de la tarjeta. */
    serie: number[];
    /** Convierte toda la tarjeta en un enlace a la bandeja correspondiente. */
    href?: string;
};

export function KpiCard({ label, value, context, delta, invertDelta, icon: Icon, serie, href }: KpiCardProps) {
    const body = (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                {href && (
                    <ArrowUpRight
                        className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                        aria-hidden
                    />
                )}
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>

            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <DeltaBadge delta={delta} invert={invertDelta} variant="text" />
                <span className="text-xs text-muted-foreground">{context}</span>
            </p>

            <div className="mt-3 text-mosso-dark dark:text-mosso-yellow">
                <Sparkline values={serie} />
            </div>
        </>
    );

    const base = 'rounded-xl border border-border bg-card p-4 sm:p-5';

    if (href) {
        return (
            <Link
                href={href}
                className={cn(
                    base,
                    'group block outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring',
                )}
            >
                {body}
            </Link>
        );
    }

    return <div className={base}>{body}</div>;
}
