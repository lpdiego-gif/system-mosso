import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ServicioPageHeaderProps {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    /** Botones u otros controles alineados a la derecha en desktop. */
    action?: ReactNode;
    className?: string;
}

/**
 * Cabecera compartida de las pantallas de administración de servicios.
 * Mantiene idénticos el chip de marca, la escala tipográfica y el espaciado
 * en el listado, la creación y la edición.
 */
export function ServicioPageHeader({
    icon: Icon,
    title,
    description,
    action,
    className,
}: ServicioPageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                    <Icon className="size-5" />
                </span>
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {action ? (
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                    {action}
                </div>
            ) : null}
        </div>
    );
}
