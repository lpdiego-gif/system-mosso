import { Camera, ScanBarcode } from 'lucide-react';
import { useRef, useState } from 'react';
import { BarcodeScannerDialog } from '@/components/productos/barcode-scanner-dialog';
import { cn } from '@/lib/utils';

interface Props {
    value: string;
    onChange: (value: string) => void;
    /** Se dispara al pulsar Enter (lector USB) o al detectar con la cámara. */
    onScan?: (codigo: string) => void;
    id?: string;
    placeholder?: string;
    error?: string;
    autoFocus?: boolean;
    className?: string;
    /** Oculta el botón de cámara (p. ej. si solo se quiere entrada manual + lector). */
    hideCamera?: boolean;
}

/** Deja solo dígitos: los lectores de barras 1D siempre emiten números. */
function soloDigitos(texto: string): string {
    return texto.replace(/\D/g, '').slice(0, 20);
}

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
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [scannerAbierto, setScannerAbierto] = useState(false);

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
                        onChange={(e) => onChange(soloDigitos(e.target.value))}
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
                        className={cn(
                            'h-9 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-sm font-mono tracking-wide shadow-xs transition-[color,box-shadow] outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30',
                        )}
                    />
                </div>

                {!hideCamera ? (
                    <button
                        type="button"
                        onClick={() => setScannerAbierto(true)}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground dark:bg-input/30"
                    >
                        <Camera className="size-4" />
                        <span className="hidden sm:inline">Cámara</span>
                    </button>
                ) : null}
            </div>

            {error ? (
                <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
                    {error}
                </p>
            ) : null}

            <BarcodeScannerDialog
                open={scannerAbierto}
                onClose={() => {
                    setScannerAbierto(false);
                    inputRef.current?.focus();
                }}
                onDetected={(codigo) => {
                    const limpio = soloDigitos(codigo);
                    setScannerAbierto(false);
                    onChange(limpio);
                    onScan?.(limpio);
                    inputRef.current?.focus();
                }}
            />
        </>
    );
}
