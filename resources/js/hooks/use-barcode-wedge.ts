import { useEffect, useRef } from 'react';

/**
 * Detecta un lector de código de barras USB (tipo «keyboard wedge») a nivel de
 * documento, sin necesidad de enfocar un campo.
 *
 * Un lector USB teclea los dígitos del código muy rápido (normalmente < 35 ms
 * entre teclas) y termina con Enter. Un humano no escribe así. Acumulamos las
 * teclas rápidas; si llega un Enter (o hay una pausa) y hay suficientes dígitos,
 * disparamos `onScan`.
 *
 * Se ignora mientras el foco está en un input/textarea/select editable (incluido
 * el propio campo de código de barras, que gestiona su entrada y su Enter).
 */

interface Opciones {
    /** Se llama con el código detectado (solo dígitos). */
    onScan: (codigo: string) => void;
    /** Desactiva la escucha (p. ej. mientras hay un modal abierto). */
    enabled?: boolean;
    /** Mínimo de dígitos para considerarlo un código. Por defecto 6. */
    minLength?: number;
    /** Máx. ms entre teclas para contarlas como «ráfaga de lector». Por defecto 35. */
    maxIntervalMs?: number;
}

function esCampoEditable(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) {
        return false;
    }

    // Mientras el foco está en un campo editable (incluido el propio campo de
    // código de barras) el wedge global no captura: ese campo gestiona su entrada.
    const tag = el.tagName;

    return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
    );
}

export function useBarcodeWedge({
    onScan,
    enabled = true,
    minLength = 6,
    maxIntervalMs = 35,
}: Opciones) {
    const buffer = useRef('');
    const ultimaTecla = useRef(0);
    const timer = useRef<number | null>(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        function reset() {
            buffer.current = '';

            if (timer.current !== null) {
                window.clearTimeout(timer.current);
                timer.current = null;
            }
        }

        function commit() {
            const codigo = buffer.current;

            reset();

            if (codigo.length >= minLength) {
                onScanRef.current(codigo);
            }
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey || e.metaKey || e.altKey) {
                return;
            }

            const ahora = performance.now();
            const delta = ahora - ultimaTecla.current;
            ultimaTecla.current = ahora;

            // Una pausa larga rompe la ráfaga: lo que había era tecleo humano.
            if (delta > maxIntervalMs && buffer.current !== '') {
                reset();
            }

            if (e.key === 'Enter') {
                if (
                    buffer.current.length >= minLength &&
                    !esCampoEditable(e.target)
                ) {
                    e.preventDefault();
                    commit();
                } else {
                    reset();
                }

                return;
            }

            if (e.key.length === 1 && /\d/.test(e.key)) {
                // Solo capturamos si el foco no está en un campo editable normal.
                if (esCampoEditable(e.target)) {
                    reset();

                    return;
                }

                buffer.current += e.key;

                if (timer.current !== null) {
                    window.clearTimeout(timer.current);
                }

                // Algunos lectores no mandan Enter: cerramos por inactividad.
                timer.current = window.setTimeout(commit, maxIntervalMs * 4);
            } else if (e.key.length === 1) {
                // Un carácter no numérico en medio: no es un código de barras 1D.
                reset();
            }
        }

        window.addEventListener('keydown', onKeyDown, true);

        return () => {
            window.removeEventListener('keydown', onKeyDown, true);
            reset();
        };
    }, [enabled, minLength, maxIntervalMs]);
}
