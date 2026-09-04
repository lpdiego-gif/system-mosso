<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Valida un RUC peruano: 11 dígitos, prefijo de tipo de contribuyente
 * reconocido y dígito verificador correcto (módulo 11 con pesos SUNAT).
 *
 * Un RUC mal formado no es solo un dato feo: SUNAT rechaza el comprobante
 * electrónico emitido con él, así que se valida en serio antes de guardarlo.
 */
class RucValido implements ValidationRule
{
    /** Prefijos de tipo de contribuyente que SUNAT emite hoy. */
    private const PREFIJOS = ['10', '15', '16', '17', '20'];

    /** Pesos SUNAT para los primeros 10 dígitos. */
    private const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $ruc = (string) $value;

        if (! preg_match('/^\d{11}$/', $ruc)) {
            $fail('El RUC debe tener exactamente 11 dígitos.');

            return;
        }

        if (! in_array(substr($ruc, 0, 2), self::PREFIJOS, true)) {
            $fail('El RUC debe empezar con 10, 15, 16, 17 o 20.');

            return;
        }

        $suma = 0;

        for ($i = 0; $i < 10; $i++) {
            $suma += ((int) $ruc[$i]) * self::PESOS[$i];
        }

        $resto = $suma % 11;
        $esperado = 11 - $resto;
        $esperado = match ($esperado) {
            10 => 0,
            11 => 1,
            default => $esperado,
        };

        if ((int) $ruc[10] !== $esperado) {
            $fail('El dígito verificador del RUC no es correcto. Revisa los números.');
        }
    }
}
