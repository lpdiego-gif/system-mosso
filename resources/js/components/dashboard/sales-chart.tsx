import type { VentaPorDia } from '@/types/dashboard';

const formatoDia = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' });

type SalesChartProps = {
    data: VentaPorDia[];
    formatoMoneda: Intl.NumberFormat;
};

export function SalesChart({ data, formatoMoneda }: SalesChartProps) {
    const hayVentas = data.some((d) => d.total > 0);
    const max = Math.max(...data.map((d) => d.total), 1);
    const len = data.length;

    const puntos = data.map((d, i) => {
        const x = len > 1 ? (i / (len - 1)) * 100 : 50;
        const y = 100 - (d.total / max) * 82 - 4;

        return { x, y, ...d };
    });

    const linea = puntos.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `0,100 ${linea} 100,100`;

    return (
        <div className="relative">
            {!hayVentas && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/60 text-sm text-muted-foreground backdrop-blur-[1px]">
                    Aún no hay ventas registradas en los últimos 14 días
                </div>
            )}

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full overflow-visible sm:h-56">
                <defs>
                    <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {[25, 50, 75].map((y) => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} className="stroke-border" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                ))}

                <polygon points={area} fill="url(#ventasGradient)" />

                <polyline
                    points={linea}
                    fill="none"
                    className="stroke-chart-1"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {puntos.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.6" className="fill-chart-1" vectorEffect="non-scaling-stroke">
                        <title>
                            {formatoDia.format(new Date(`${p.fecha}T00:00:00`))}: {formatoMoneda.format(p.total)}
                        </title>
                    </circle>
                ))}
            </svg>

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{formatoDia.format(new Date(`${data[0].fecha}T00:00:00`))}</span>
                <span>{formatoDia.format(new Date(`${data[Math.floor(len / 2)].fecha}T00:00:00`))}</span>
                <span>{formatoDia.format(new Date(`${data[len - 1].fecha}T00:00:00`))}</span>
            </div>
        </div>
    );
}
