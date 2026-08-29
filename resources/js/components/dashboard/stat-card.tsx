import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    gradient: string;
    href?: string;
    /** Convierte la tarjeta en un botón (p. ej. para aplicar un filtro). */
    onClick?: () => void;
    /** Marca la tarjeta como seleccionada cuando actúa como filtro. */
    active?: boolean;
};

export function StatCard({ title, value, subtitle, icon: Icon, gradient, href, onClick, active }: StatCardProps) {
    const interactive = Boolean(href || onClick);
    const content = (
        <div
            className={cn(
                'group relative isolate flex flex-col justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br px-3.5 py-2.5 text-white shadow-sm transition-all duration-200',
                interactive && 'hover:-translate-y-0.5 hover:shadow-md hover:border-white/20 active:translate-y-0',
                active && 'ring-2 ring-[#FFC527] ring-offset-1 ring-offset-background',
                gradient,
            )}
        >
            {/* Glow sutil */}
            <div className="absolute -top-8 -right-8 size-16 rounded-full bg-white/10 blur-lg transition-all duration-300 group-hover:bg-white/20" />

            {/* Fila Superior: Título e Icono */}
            <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-white/85">{title}</span>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/20 backdrop-blur-md transition-transform duration-200 group-hover:scale-105">
                    <Icon className="size-3 text-white/90" />
                </span>
            </div>

            {/* Fila Inferior: Número y Subtítulo integrados */}
            <div className="relative z-10 mt-1 flex items-baseline gap-2">
                <p className="text-xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
                {subtitle && <p className="text-[11px] font-normal leading-none text-white/75 truncate">{subtitle}</p>}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]">
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-pressed={active}
                className="block w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC527]"
            >
                {content}
            </button>
        );
    }

    return content;
}
