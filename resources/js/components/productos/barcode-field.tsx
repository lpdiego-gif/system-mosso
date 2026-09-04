import { Camera, CircleCheck, ScanBarcode, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useRef, useState } from 'react';
import { BarcodeScannerDialog } from '@/components/productos/barcode-scanner-dialog';
import { evaluarCodigo, normalizarCodigo } from '@/lib/barcode';
import { cn } from '@/lib/utils';

interface Props {
    value: string;
    onChange: (value: string) => void;
    /** Se dispara al pulsar Enter (lector USB) o al detectar con la cámara. */
    onScan?: (codigo: string) => void;
    id?: string;
    placeholder?: string;
    /** Error de validación del servidor. */
    error?: string;
    autoFocus?: boolean;
    className?: string;
    /** Oculta el botón de cámara (p. ej. escáner de solo lectura + lector). */
    hideCamera?: boolean;
    /** Muestra el estado de formato / dígito verificador bajo el campo. */
    showValidation?: boolean;
    /** Contenido extra bajo el campo (p. ej. aviso de código duplicado). */
    statusSlot?: ReactNode;
    /** Tamaño del control. */
    size?: 'sm' | 'md';
}

const TONO_CLASE: Record<string, string> = {
    ok: 'text-emerald-600 dark:text-emerald-500',
    aviso: 'text-amber-600 dark:text-amber-500',
    error: 'text-destructive',
    neutral: 'text-muted-foreground',
};

export function BarcodeField({
    value,
    onChange,
    onScan,
    id,
    placeholder = 'Escanea o escribe el código…',
    error,
    autoFocus,
    className,
    hideCamera,
    showValidation,
    statusSlot,
    size = 'md',
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [scannerAbierto, setScannerAbierto] = useState(false);
    const reactId = useId();
    const describedBy = `${id ?? reactId}-desc`;

    const estado = evaluarCodigo(value);
    const mostrarEstado = showValidation && !error && !estado.vacio;

    return (
        <>
            <div className={cn('flex gap-2', className)}>
                <div className="relative flex-1">
                    <ScanBarcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        autoFocus={autoFocus}
                        value={value}
                        onChange={(e) =>
                            onChange(normalizarCodigo(e.target.value))
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // Evita que el Enter del lector envíe el formulario.
                                e.preventDefault();

                                if (value.trim() !== '') {
                                    onScan?.(value.trim());
                                }
                            }
                        }}
                        placeholder={placeholder}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={
                            mostrarEstado || error ? describedBy : undefined
                        }
                        className={cn(
                            'w-full rounded-md border border-input bg-transparent pr-3 pl-9 font-mono text-sm tracking-wide shadow-xs transition-[color,box-shadow] outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30',
                            size === 'sm' ? 'h-8' : 'h-9',
                        )}
                    />
                    {mostrarEstado && estado.tono === 'ok' ? (
                        <CircleCheck className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-emerald-500" />
                    ) : null}
                </div>

                {!hideCamera ? (
                    <button
                        type="button"
                        onClick={() => setScannerAbierto(true)}
                        className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground dark:bg-input/30',
                            size === 'sm' ? 'h-8' : 'h-9',
                        )}
                    >
                        <Camera className="size-4" />
                        <span className="hidden sm:inline">Cámara</span>
                    </button>
                ) : null}
            </div>

            {error ? (
                <p
                    id={describedBy}
                    className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive"
                    role="alert"
                >
                    <TriangleAlert className="size-3.5 shrink-0" />
                    {error}
                </p>
            ) : mostrarEstado ? (
                <p
                    id={describedBy}
                    className={cn(
                        'mt-1.5 flex items-center gap-1 text-xs',
                        TONO_CLASE[estado.tono],
                    )}
                >
                    {estado.tono === 'aviso' ? (
                        <TriangleAlert className="size-3.5 shrink-0" />
                    ) : null}
                    {estado.tono === 'ok' ? (
                        <CircleCheck className="size-3.5 shrink-0" />
                    ) : null}
                    {estado.mensaje}
                </p>
            ) : null}

            {statusSlot}

            <BarcodeScannerDialog
                open={scannerAbierto}
                onClose={() => {
                    setScannerAbierto(false);
                    inputRef.current?.focus();
                }}
                onDetected={(codigo) => {
                    const limpio = normalizarCodigo(codigo);
                    setScannerAbierto(false);
                    onChange(limpio);
                    onScan?.(limpio);
                    inputRef.current?.focus();
                }}
            />
        </>
    );
}
