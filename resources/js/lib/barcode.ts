/**
 * Utilidades de código de barras para el módulo de productos.
 *
 * Los lectores 1D (USB o cámara) emiten dígitos. Los formatos de retail más
 * comunes — EAN-13, EAN-8, UPC-A, UPC-E — llevan un dígito verificador que
 * podemos comprobar en el cliente para avisar de un escaneo mal leído antes
 * de mandar nada al servidor.
 */

export type FormatoBarras =
    'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'CODE' | 'DESCONOCIDO';

/** Deja solo dígitos y recorta a 20 (límite de la columna `codigo_barras`). */
export function normalizarCodigo(texto: string): string {
    return texto.replace(/\D/g, '').slice(0, 20);
}

/** Dígito verificador módulo-10 para EAN/UPC (pesos 3 y 1 alternados desde la derecha). */
function digitoVerificadorEan(cuerpo: string): number {
    let suma = 0;

    for (let i = 0; i < cuerpo.length; i++) {
        const d = Number(cuerpo[cuerpo.length - 1 - i]);
        suma += i % 2 === 0 ? d * 3 : d;
    }

    return (10 - (suma % 10)) % 10;
}

/** Comprueba el dígito verificador de un código EAN/UPC completo. */
export function checksumValido(codigo: string): boolean {
    if (!/^\d+$/.test(codigo)) {
        return false;
    }

    if (![8, 12, 13].includes(codigo.length)) {
        return false;
    }

    const cuerpo = codigo.slice(0, -1);
    const verificador = Number(codigo.slice(-1));

    return digitoVerificadorEan(cuerpo) === verificador;
}

export function detectarFormato(codigo: string): FormatoBarras {
    switch (codigo.length) {
        case 13:
            return 'EAN-13';
        case 12:
            return 'UPC-A';
        case 8:
            return 'EAN-8';
        case 6:
        case 7:
            return 'UPC-E';
        default:
            return codigo.length >= 6 ? 'CODE' : 'DESCONOCIDO';
    }
}

export interface EstadoCodigo {
    /** Vacío, sin evaluar. */
    vacio: boolean;
    /** Cumple la regla del backend: 6–20 dígitos. */
    aceptable: boolean;
    /** Longitud EAN/UPC con dígito verificador correcto. */
    checksumOk: boolean;
    formato: FormatoBarras;
    /** Mensaje de ayuda / advertencia para mostrar bajo el campo. */
    mensaje: string | null;
    tono: 'ok' | 'aviso' | 'error' | 'neutral';
}

export function evaluarCodigo(valor: string): EstadoCodigo {
    const codigo = normalizarCodigo(valor);

    if (codigo === '') {
        return {
            vacio: true,
            aceptable: true,
            checksumOk: false,
            formato: 'DESCONOCIDO',
            mensaje: null,
            tono: 'neutral',
        };
    }

    const aceptable = codigo.length >= 6 && codigo.length <= 20;
    const formato = detectarFormato(codigo);

    if (!aceptable) {
        return {
            vacio: false,
            aceptable: false,
            checksumOk: false,
            formato,
            mensaje:
                codigo.length < 6
                    ? 'Muy corto: un código de barras tiene al menos 6 dígitos.'
                    : 'Demasiado largo (máx. 20 dígitos).',
            tono: 'error',
        };
    }

    if ([8, 12, 13].includes(codigo.length)) {
        const ok = checksumValido(codigo);

        return {
            vacio: false,
            aceptable: true,
            checksumOk: ok,
            formato,
            mensaje: ok
                ? `${formato} válido`
                : `El dígito verificador de este ${formato} no cuadra. Revisa el escaneo.`,
            tono: ok ? 'ok' : 'aviso',
        };
    }

    return {
        vacio: false,
        aceptable: true,
        checksumOk: false,
        formato,
        mensaje: `${codigo.length} dígitos · se guardará tal cual`,
        tono: 'neutral',
    };
}
