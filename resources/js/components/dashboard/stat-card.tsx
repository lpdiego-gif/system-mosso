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
};

export function StatCard({ title, value, subtitle, icon: Icon, gradient, href }: StatCardProps) {
    const content = (
        <div
            className={cn(
                'relative isolate flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-transform duration-300',
                href && 'hover:-translate-y-0.5 hover:shadow-xl',
                gradient,
            )}
        >
            <div className="absolute -top-6 -right-6 size-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-4 size-24 rounded-full bg-black/10 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-white/85">{title}</span>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="size-5" />
                </span>
            </div>

            <div className="relative z-10 mt-4">
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
                {subtitle && <p className="mt-1 text-xs text-white/80">{subtitle}</p>}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full">
                {content}
            </Link>
        );
    }

    return content;
}
