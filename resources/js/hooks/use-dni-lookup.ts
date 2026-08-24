import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { BusquedaDocumentoResponse } from '@/types/trabajador';

/**
 * Hook de búsqueda de documento (DNI/CE/RUC) con debounce.
 *
 * NOTA: si tu proyecto ya cuenta con un hook equivalente (usado en
 * EquipoTrabajo / Cargos / inscripciones para el lookup por RENIEC),
 * usa ese en su lugar y elimina este archivo para no duplicar lógica.
 * El endpoint esperado es POST /trabajador/buscar-documento.
 */
export function useDniLookup(
    numDocumento: string,
    fkTipoDocumento: string | number,
    endpoint = '/trabajador/buscar-documento',
    delay = 450,
) {
    const [resultado, setResultado] = useState<BusquedaDocumentoResponse | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        setResultado(null);
        setError(null);
        setCargando(false);
    }, []);

    useEffect(() => {
        const documentoLimpio = numDocumento.trim();
        const tipoValido = Number(fkTipoDocumento) > 0;
        const longitudValida = documentoLimpio.length >= 8;

        if (!documentoLimpio || !tipoValido || !longitudValida) {
            reset();
            return;
        }

        setCargando(true);
        setError(null);

        const timeout = window.setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const { data } = await axios.post<BusquedaDocumentoResponse>(
                    endpoint,
                    {
                        num_documento: documentoLimpio,
                        fk_tipo_documento: Number(fkTipoDocumento),
                    },
                    { signal: controller.signal },
                );

                setResultado(data);
            } catch (err) {
                if (axios.isCancel(err)) return;
                setError('No se pudo verificar el documento. Intenta nuevamente.');
                setResultado(null);
            } finally {
                setCargando(false);
            }
        }, delay);

        return () => {
            window.clearTimeout(timeout);
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numDocumento, fkTipoDocumento, endpoint, delay]);

    return { resultado, cargando, error, reset };
}