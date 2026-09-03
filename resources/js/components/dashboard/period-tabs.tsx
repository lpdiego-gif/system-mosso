import { cn } from '@/lib/utils';

type PeriodTabsProps = {
    value: number;
    options: number[];
    onChange: (dias: number) => void;
    disabled?: boolean;
};

export function PeriodTabs({ value, options, onChange, disabled = false }: PeriodTabsProps) {
    return (
        <div
            role="tablist"
            aria-label="Rango de fechas"
            className="inline-flex items-center gap-0.5 rounded-lg border bg-muted/60 p-0.5"
        >
            {options.map((dias) => {
                const activo = dias === value;

                return (
                    <button
                        key={dias}
                        type="button"
                        role="tab"
                        aria-selected={activo}
                        disabled={disabled}
                        onClick={() => onChange(dias)}
                        className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                            activo
                                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {dias} días
                    </button>
                );
            })}
        </div>
    );
}
