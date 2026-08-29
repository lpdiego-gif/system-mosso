import { router } from '@inertiajs/react';
import { Loader2, Minus, Plus, Replace } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProductoRow } from '@/types/producto';

type Modo = 'add' | 'subtract' | 'set';

const MODOS: { id: Modo; label: string; icon: typeof Plus }[] = [
    { id: 'add', label: 'Ingresar', icon: Plus },
    { id: 'subtract', label: 'Retirar', icon: Minus },
    { id: 'set', label: 'Fijar', icon: Replace },
];

export function StockAdjustDialog({
    producto,
    open,
    onOpenChange,
}: {
    producto: ProductoRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [modo, setModo] = useState<Modo>('add');
    const [cantidad, setCantidad] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio del formulario al abrir
            setModo('add');
            setCantidad('');
        }
    }, [open, producto?.id_producto]);

    const actual = producto?.stock ?? 0;
    const n = Number(cantidad) || 0;
    const resultado =
        modo === 'add'
            ? actual + n
            : modo === 'subtract'
              ? Math.max(0, actual - n)
              : n;

    function guardar() {
        if (!producto || cantidad === '') {
            return;
        }

        router.patch(
            route('admin.productos.stock', producto.id_producto),
            { modo, cantidad: n },
            {
                preserveScroll: true,
                preserveState: false,
                onStart: () => setGuardando(true),
                onFinish: () => {
                    setGuardando(false);
                    onOpenChange(false);
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !guardando && onOpenChange(o)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajustar stock</DialogTitle>
                    <DialogDescription className="line-clamp-1">
                        {producto?.nombre}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {MODOS.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setModo(m.id)}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                                    modo === m.id
                                        ? 'border-mosso-yellow bg-mosso-yellow/10 text-mosso-dark dark:text-mosso-yellow'
                                        : 'bg-background text-muted-foreground hover:bg-accent',
                                )}
                            >
                                <m.icon className="size-4" />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        autoFocus
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                guardar();
                            }
                        }}
                        placeholder="Cantidad"
                    />

                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3.5 py-2.5 text-sm">
                        <span className="text-muted-foreground">
                            {actual} <span aria-hidden>→</span>
                        </span>
                        <span className="text-lg font-semibold tabular-nums">
                            {resultado}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={guardando}
                        className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={guardando || cantidad === ''}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {guardando ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Guardar
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
