import {
    Keyboard,
    Loader2,
    ScanBarcode,
    TriangleAlert,
    X,
    Zap,
    ZapOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { normalizarCodigo } from '@/lib/barcode';

/**
 * Escáner de código de barras con la cámara del dispositivo.
 *
 * Usa @zxing/browser (carga diferida: el bundle solo baja cuando se abre el
 * escáner). Prefiere la cámara trasera del móvil. Si la cámara falla o no hay
 * permiso, el usuario siempre puede escribir el código a mano ahí mismo.
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
    const trackRef = useRef<MediaStreamTrack | null>(null);
    const [estado, setEstado] = useState<Estado>('cargando');
    const [mensajeError, setMensajeError] = useState('');
    const [linterna, setLinterna] = useState(false);
    const [linternaDisponIble, setLinternaDisponible] = useState(false);
    const [manual, setManual] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelado = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio al abrir el escáner
        setEstado('cargando');
        setMensajeError('');
        setLinterna(false);
        setLinternaDisponible(false);
        setManual('');

        (async () => {
            try {
                const [{ BrowserMultiFormatReader }, zxing] = await Promise.all(
                    [import('@zxing/browser'), import('@zxing/library')],
                );

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
                            navigator.vibrate?.(60);
                            onDetected(texto);
                        }
                    },
                );

                if (cancelado) {
                    controls.stop();

                    return;
                }

                controlsRef.current = controls;

                const stream = videoRef.current?.srcObject;

                if (stream instanceof MediaStream) {
                    const track = stream.getVideoTracks()[0] ?? null;
                    trackRef.current = track;
                    const caps = track?.getCapabilities?.() as
                        { torch?: boolean } | undefined;
                    setLinternaDisponible(Boolean(caps?.torch));
                }

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
            trackRef.current = null;
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

    async function alternarLinterna() {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        try {
            const siguiente = !linterna;
            await track.applyConstraints({
                advanced: [{ torch: siguiente }],
            } as unknown as MediaTrackConstraints);
            setLinterna(siguiente);
        } catch {
            setLinternaDisponible(false);
        }
    }

    function enviarManual() {
        const limpio = normalizarCodigo(manual);

        if (limpio.length >= 6) {
            onDetected(limpio);
        }
    }

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
                <div className="flex items-center gap-1.5">
                    {linternaDisponIble ? (
                        <button
                            type="button"
                            onClick={alternarLinterna}
                            aria-pressed={linterna}
                            aria-label={
                                linterna
                                    ? 'Apagar linterna'
                                    : 'Encender linterna'
                            }
                            className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                        >
                            {linterna ? (
                                <Zap className="size-5 text-mosso-yellow" />
                            ) : (
                                <ZapOff className="size-5" />
                            )}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar escáner"
                        className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                    >
                        <X className="size-5" />
                    </button>
                </div>
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
                        <div className="relative h-40 w-11/12 max-w-sm rounded-xl outline outline-2 outline-white/25">
                            <span className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-mosso-yellow" />
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
                    </div>
                ) : null}
            </div>

            {/* Pie: entrada manual siempre disponible */}
            <div className="space-y-2 border-t border-white/10 px-4 py-3">
                <label className="flex items-center gap-1.5 text-xs text-white/60">
                    <Keyboard className="size-3.5" />
                    ¿No lee? Escribe el código
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={manual}
                        onChange={(e) =>
                            setManual(normalizarCodigo(e.target.value))
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                enviarManual();
                            }
                        }}
                        placeholder="7501234567890"
                        className="h-10 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 font-mono text-sm tracking-wide text-white placeholder:text-white/30 focus:border-mosso-yellow focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={enviarManual}
                        disabled={normalizarCodigo(manual).length < 6}
                        className="rounded-lg bg-mosso-yellow px-4 text-sm font-semibold text-mosso-dark transition-opacity disabled:opacity-40"
                    >
                        Usar
                    </button>
                </div>
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
        return 'No se concedió permiso para usar la cámara. Habilítalo en el navegador o escribe el código abajo.';
    }

    if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') {
        return 'No se encontró ninguna cámara en este dispositivo. Escribe el código abajo.';
    }

    if (nombre === 'NotReadableError') {
        return 'La cámara está siendo usada por otra aplicación.';
    }

    return 'No se pudo iniciar la cámara. Escribe el código de barras abajo.';
}
