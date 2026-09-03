type DonutDatum = {
    label: string;
    total: number;
};

type DonutChartProps = {
    data: DonutDatum[];
    centerLabel?: string;
    emptyMessage?: string;
};

const COLOR_VARS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
];

const formatoPorcentaje = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

export function DonutChart({ data, centerLabel, emptyMessage = 'Sin datos' }: DonutChartProps) {
    const total = data.reduce((acc, d) => acc + d.total, 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    const segmentos = data.map((d, i) => {
        const previo = data.slice(0, i).reduce((acc, x) => acc + x.total, 0);
        const inicio = (previo / total) * 360;
        const fin = ((previo + d.total) / total) * 360;

        return `${COLOR_VARS[i % COLOR_VARS.length]} ${inicio}deg ${fin}deg`;
    });

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div
                className="relative size-32 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${segmentos.join(', ')})` }}
            >
                <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-xl font-semibold tabular-nums text-foreground">{total}</span>
                    {centerLabel && (
                        <span className="text-[10px] text-muted-foreground">{centerLabel}</span>
                    )}
                </div>
            </div>

            <ul className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-44">
                {data.map((d, i) => (
                    <li key={d.label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 text-foreground">
                            <span
                                className="size-2.5 shrink-0 rounded-[3px]"
                                style={{ backgroundColor: COLOR_VARS[i % COLOR_VARS.length] }}
                                aria-hidden
                            />
                            {d.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                            {d.total} · {formatoPorcentaje.format((d.total / total) * 100)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
