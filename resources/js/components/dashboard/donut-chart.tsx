type DonutDatum = {
    label: string;
    total: number;
};

type DonutChartProps = {
    data: DonutDatum[];
    centerLabel?: string;
};

const COLOR_VARS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
];

export function DonutChart({ data, centerLabel }: DonutChartProps) {
    const total = data.reduce((acc, d) => acc + d.total, 0);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex size-32 items-center justify-center rounded-full border-8 border-muted text-xs text-muted-foreground">
                    Sin datos
                </div>
            </div>
        );
    }

    const segmentos = data.map((d, i) => {
        const inicio = (data.slice(0, i).reduce((acc, x) => acc + x.total, 0) / total) * 360;
        const fin = inicio + (d.total / total) * 360;

        return `${COLOR_VARS[i % COLOR_VARS.length]} ${inicio}deg ${fin}deg`;
    });

    return (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around">
            <div
                className="relative size-32 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${segmentos.join(', ')})` }}
            >
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card text-center shadow-inner">
                    <span className="text-xl font-bold">{total}</span>
                    {centerLabel && <span className="text-[10px] text-muted-foreground">{centerLabel}</span>}
                </div>
            </div>

            <ul className="flex w-full flex-col gap-2 sm:w-auto">
                {data.map((d, i) => (
                    <li key={d.label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: COLOR_VARS[i % COLOR_VARS.length] }}
                            />
                            {d.label}
                        </span>
                        <span className="font-medium text-muted-foreground">
                            {d.total} · {Math.round((d.total / total) * 100)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
