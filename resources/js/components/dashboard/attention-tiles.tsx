import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AttentionTile = {
    label: string;
    /** Frase corta bajo la etiqueta (p. ej. "Por cobrar"). */
    hint: string;
    count: number;
    icon: LucideIcon;
    href: string;
    /** Tono cuando `count > 0`: "warn" es ámbar (puede esperar), "alert" es rojo (urge). */
    tone: 'warn' | 'alert';
};

export function AttentionTiles({ tiles }: { tiles: AttentionTile[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tiles.map(({ label, hint, count, icon: Icon, href, tone }) => {
                const activo = count > 0;
                const rojo = activo && tone === 'alert';
                const ambar = activo && tone === 'warn';

                return (
                    <Link
                        key={label}
                        href={href}
                        className={cn(
                            'group flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            !activo &&
                                'border-border/70 bg-card dark:border-white/[0.07] dark:bg-white/[0.02]',
                            ambar &&
                                'border-amber-500/25 bg-amber-500/[0.06] dark:border-amber-400/20 dark:bg-amber-400/[0.07]',
                            rojo &&
                                'border-red-500/25 bg-red-500/[0.06] dark:border-red-400/20 dark:bg-red-400/[0.07]',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                rojo && 'bg-red-500/15 text-red-600 dark:text-red-400',
                                ambar && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                                !activo && 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Icon className="size-4" aria-hidden />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="truncate text-xs text-muted-foreground">{hint}</p>
                        </div>

                        <span
                            className={cn(
                                'text-xl font-semibold tabular-nums',
                                rojo && 'text-red-600 dark:text-red-400',
                                ambar && 'text-amber-600 dark:text-amber-400',
                                !activo && 'text-muted-foreground',
                            )}
                        >
                            {count}
                        </span>
                        <ChevronRight
                            className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                            aria-hidden
                        />
                    </Link>
                );
            })}
        </div>
    );
}
