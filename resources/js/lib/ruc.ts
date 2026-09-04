/**
 * Validación de RUC peruano en el cliente: mismo algoritmo que
 * `App\Rules\RucValido` (11 dígitos, prefijo de tipo de contribuyente y
 * dígito verificador módulo 11). Sirve para dar feedback en vivo; el
 * servidor sigue siendo la autoridad.
 */

const PREFIJOS = ['10', '15', '16', '17', '20'];
const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export type EstadoRuc = 'vacio' | 'incompleto' | 'prefijo' | 'digito' | 'valido';

export function evaluarRuc(valor: string): EstadoRuc {
    const ruc = valor.replace(/\D/g, '');

    if (ruc.length === 0) {
        return 'vacio';
    }

    if (ruc.length < 11) {
        return 'incompleto';
    }

    if (!PREFIJOS.includes(ruc.slice(0, 2))) {
        return 'prefijo';
    }

    let suma = 0;

    for (let i = 0; i < 10; i++) {
        suma += Number(ruc[i]) * PESOS[i];
    }

    let esperado = 11 - (suma % 11);

    if (esperado === 10) {
        esperado = 0;
    } else if (esperado === 11) {
        esperado = 1;
    }

    return Number(ruc[10]) === esperado ? 'valido' : 'digito';
}

export const MENSAJE_RUC: Record<Exclude<EstadoRuc, 'vacio' | 'valido'>, string> = {
    incompleto: 'El RUC tiene 11 dígitos.',
    prefijo: 'Un RUC empieza con 10, 15, 16, 17 o 20.',
    digito: 'El dígito verificador no coincide. Revisa los números.',
};
