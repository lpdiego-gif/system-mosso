import { cn } from '@/lib/utils';

/**
 * Monograma del cliente. El tono se deriva del nombre (hash estable) para
 * que cada cliente conserve su color entre pantallas y recargas, siempre
 * dentro de la paleta del sistema y con contraste válido en claro/oscuro.
 */

const TONOS = [
    'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
    'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
    'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
    'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300',
    'bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300',
];

const DIMENSIONES = {
    sm: 'size-8 text-[0.7rem]',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
    xl: 'size-16 text-xl',
} as const;

function hashTono(valor: string): number {
    let hash = 0;

    for (let i = 0; i < valor.length; i += 1) {
        hash = (Math.imul(31, hash) + valor.charCodeAt(i)) | 0;
    }

    return Math.abs(hash);
}

export function ClienteAvatar({
    nombre,
    iniciales,
    size = 'md',
    className,
}: {
    nombre: string;
    iniciales: string;
    size?: keyof typeof DIMENSIONES;
    className?: string;
}) {
    const tono = TONOS[hashTono(nombre || iniciales) % TONOS.length];

    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-tight ring-1 ring-inset ring-black/[0.06] dark:ring-white/10',
                DIMENSIONES[size],
                tono,
                className,
            )}
        >
            {iniciales || '—'}
        </span>
    );
}
