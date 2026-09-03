import { useId } from 'react';
import { cn } from '@/lib/utils';

type SparklineProps = {
    values: number[];
    /** Clase de color aplicada vía `currentColor` (línea y relleno). */
    className?: string;
};

/**
 * Mini-gráfica de línea sin ejes para las tarjetas KPI. Hereda su color de
 * `currentColor`, así que se controla con una clase `text-*` en el contenedor.
 */
export function Sparkline({ values, className }: SparklineProps) {
    const id = useId();

    if (values.length < 2 || values.every((v) => v === 0)) {
        return <div className={cn('h-8 w-full', className)} aria-hidden />;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;

    const puntos = values.map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - min) / span) * 90 - 5;

        return { x, y };
    });

    const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${linea} L 100 100 L 0 100 Z`;

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={cn('h-8 w-full overflow-visible', className)}
            aria-hidden
        >
            <defs>
                <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#spark-${id})`} />
            <path
                d={linea}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
