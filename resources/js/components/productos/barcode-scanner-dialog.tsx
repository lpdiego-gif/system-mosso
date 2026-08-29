import { Loader2, ScanBarcode, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Escáner de código de barras con la cámara del dispositivo.
 *
 * Usa @zxing/browser (carga diferida: el bundle solo baja cuando se abre el
 * escáner). Prefiere la cámara trasera del móvil. Si la cámara falla o no hay
 * permiso, el usuario siempre puede cerrar y escribir el código a mano.
 */

interface Props {
    open: boolean;
    onClose: () => void;
    onDetected: (codigo: string) => void;
}

type Estado = 'cargando' | 'escaneando' | 'error';

export function BarcodeScannerDialog({ open, onClose, onDetected }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);
    const [estado, setEstado] = useState<Estado>('cargando');
    const [mensajeError, setMensajeError] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelado = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio al abrir el escáner
        setEstado('cargando');
        setMensajeError('');

        (async () => {
            try {
                const [{ BrowserMultiFormatReader }, zxing] = await Promise.all([
                    import('@zxing/browser'),
                    import('@zxing/library'),
                ]);

                if (cancelado) {
                    return;
                }

                const hints = new Map();
                hints.set(zxing.DecodeHintType.POSSIBLE_FORMATS, [
                    zxing.BarcodeFormat.EAN_13,
                    zxing.BarcodeFormat.EAN_8,
                    zxing.BarcodeFormat.UPC_A,
                    zxing.BarcodeFormat.UPC_E,
                    zxing.BarcodeFormat.CODE_128,
                    zxing.BarcodeFormat.CODE_39,
                    zxing.BarcodeFormat.ITF,
                ]);

                const reader = new BrowserMultiFormatReader(hints, {
                    delayBetweenScanAttempts: 120,
                });

                const controls = await reader.decodeFromConstraints(
                    { video: { facingMode: { ideal: 'environment' } } },
                    videoRef.current as HTMLVideoElement,
                    (result) => {
                        if (result && !cancelado) {
                            const texto = result.getText().trim();
                            controlsRef.current?.stop();
                            controlsRef.current = null;
                            onDetected(texto);
                        }
                    },
                );

                if (cancelado) {
                    controls.stop();

                    return;
                }

                controlsRef.current = controls;
                setEstado('escaneando');
            } catch (error) {
                if (cancelado) {
                    return;
                }

                setEstado('error');
                setMensajeError(descripcionError(error));
            }
        })();

        return () => {
            cancelado = true;
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [open, onDetected]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previo;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white">
            {/* Barra superior */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <ScanBarcode className="size-4" />
                    Escanear código de barras
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar escáner"
                    className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* Vídeo */}
            <div className="relative flex-1 overflow-hidden">
                <video
                    ref={videoRef}
                    className="size-full object-cover"
                    playsInline
                    muted
                />

                {estado === 'escaneando' ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="relative h-40 w-11/12 max-w-sm rounded-2xl ring-2 ring-mosso-yellow/90">
                            <span className="absolute -top-px left-6 right-6 h-0.5 animate-pulse bg-mosso-yellow" />
                        </div>
                    </div>
                ) : null}

                {estado === 'cargando' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 text-sm">
                        <Loader2 className="size-6 animate-spin" />
                        Iniciando la cámara…
                    </div>
                ) : null}

                {estado === 'error' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 px-8 text-center">
                        <TriangleAlert className="size-7 text-amber-400" />
                        <p className="max-w-xs text-sm text-white/80">
                            {mensajeError}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
                        >
                            Ingresar el código a mano
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Pie */}
            <div className="px-6 py-4 text-center text-xs text-white/60">
                Apunta al código de barras del producto. Se detecta solo.
            </div>
        </div>
    );
}

function descripcionError(error: unknown): string {
    const nombre =
        typeof error === 'object' && error !== null && 'name' in error
            ? String((error as { name: unknown }).name)
            : '';

    if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
        return 'No se concedió permiso para usar la cámara. Habilítalo en el navegador o ingresa el código manualmente.';
    }

    if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') {
        return 'No se encontró ninguna cámara disponible en este dispositivo.';
    }

    if (nombre === 'NotReadableError') {
        return 'La cámara está siendo usada por otra aplicación.';
    }

    return 'No se pudo iniciar la cámara. Ingresa el código de barras manualmente.';
}
