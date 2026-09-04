import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { VentaPorDia } from '@/types/dashboard';

const formatoDiaCorto = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' });
const formatoDiaLargo = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});

const formatoMonedaCompacta = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    notation: 'compact',
    maximumFractionDigits: 1,
});

type SalesChartProps = {
    data: VentaPorDia[];
    formatoMoneda: Intl.NumberFormat;
};

/** Fecha (YYYY-MM-DD) a Date en zona local, sin desfase por UTC. */
function aFecha(iso: string): Date {
    return new Date(`${iso}T00:00:00`);
}

export function SalesChart({ data, formatoMoneda }: SalesChartProps) {
    const [activo, setActivo] = useState<number | null>(null);

    const { puntos, areaPath, linePath, max, hayVentas, etiquetasX } = useMemo(() => {
        const len = data.length;
        const maxLocal = Math.max(...data.map((d) => d.total), 1);

        const pts = data.map((d, i) => ({
            ...d,
            x: len > 1 ? (i / (len - 1)) * 100 : 50,
            y: 100 - (d.total / maxLocal) * 88 - 6,
        }));

        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const area = `${line} L 100 100 L 0 100 Z`;

        const pasos = Math.min(5, len);
        const etiquetas = Array.from({ length: pasos }, (_, k) => {
            const idx = Math.round((k / (pasos - 1)) * (len - 1));

            return { idx, fecha: data[idx].fecha };
        });

        return {
            puntos: pts,
            areaPath: area,
            linePath: line,
            max: maxLocal,
            hayVentas: data.some((d) => d.total > 0),
            etiquetasX: etiquetas,
        };
    }, [data]);

    const activoPunto = activo !== null ? puntos[activo] : null;

    function manejarPuntero(e: React.PointerEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const idx = Math.round(ratio * (puntos.length - 1));
        setActivo(Math.min(Math.max(idx, 0), puntos.length - 1));
    }

    return (
        <div className="text-mosso-dark dark:text-mosso-yellow">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Ingresos diarios</span>
                <span className="tabular-nums">Máx. {formatoMonedaCompacta.format(max)}</span>
            </div>

            <div className="flex gap-3">
                <div className="flex h-[220px] w-14 shrink-0 flex-col justify-between py-1 text-right text-[10px] leading-none tabular-nums whitespace-nowrap text-muted-foreground sm:h-[260px]">
                    <span>{formatoMonedaCompacta.format(max)}</span>
                    <span>{formatoMonedaCompacta.format(max / 2)}</span>
                    <span>{formatoMonedaCompacta.format(0)}</span>
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className="relative h-[220px] w-full touch-none sm:h-[260px]"
                        onPointerMove={manejarPuntero}
                        onPointerLeave={() => setActivo(null)}
                    >
                        {!hayVentas && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-dashed bg-card/40 text-sm text-muted-foreground">
                                Sin ventas registradas en este periodo
                            </div>
                        )}

                        <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="h-full w-full overflow-visible"
                            aria-hidden
                        >
                            <defs>
                                <linearGradient id="ventasArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>

                            {[0, 25, 50, 75, 100].map((y) => (
                                <line
                                    key={y}
                                    x1="0"
                                    y1={y}
                                    x2="100"
                                    y2={y}
                                    className="stroke-border"
                                    strokeWidth="1"
                                    strokeDasharray={y === 100 ? undefined : '2 3'}
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}

                            {hayVentas && (
                                <>
                                    <path d={areaPath} fill="url(#ventasArea)" />
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </>
                            )}

                            {activoPunto && (
                                <line
                                    x1={activoPunto.x}
                                    y1="0"
                                    x2={activoPunto.x}
                                    y2="100"
                                    className="stroke-foreground/25"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            )}
                        </svg>

                        {hayVentas && !activoPunto && (
                            <span
                                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-background"
                                style={{
                                    left: `${puntos[puntos.length - 1].x}%`,
                                    top: `${puntos[puntos.length - 1].y}%`,
                                }}
                            />
                        )}

                        {activoPunto && (
                            <>
                                <span
                                    className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-background"
                                    style={{ left: `${activoPunto.x}%`, top: `${activoPunto.y}%` }}
                                />
                                <div
                                    className={cn(
                                        'pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md',
                                        activoPunto.y < 32
                                            ? 'translate-y-3'
                                            : '-translate-y-[calc(100%+12px)]',
                                    )}
                                    style={{
                                        left: `${Math.min(Math.max(activoPunto.x, 12), 88)}%`,
                                        top: `${activoPunto.y}%`,
                                    }}
                                >
                                    <p className="font-medium text-foreground capitalize">
                                        {formatoDiaLargo.format(aFecha(activoPunto.fecha))}
                                    </p>
                                    <p className="mt-0.5 tabular-nums text-muted-foreground">
                                        {formatoMoneda.format(activoPunto.total)} ·{' '}
                                        {activoPunto.pedidos}{' '}
                                        {activoPunto.pedidos === 1 ? 'pedido' : 'pedidos'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        {etiquetasX.map(({ idx, fecha }) => (
                            <span key={idx} className="tabular-nums">
                                {formatoDiaCorto.format(aFecha(fecha))}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
