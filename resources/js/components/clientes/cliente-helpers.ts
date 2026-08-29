/** Formato de moneda del proyecto (soles peruanos). */
export function soles(monto: number): string {
    return `S/ ${Number(monto || 0).toFixed(2)}`;
}

/** Fecha legible corta: «12 mar 2026». */
export function fechaCorta(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Antigüedad relativa aproximada: «hace 3 días», «hace 2 meses». */
export function tiempoRelativo(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    const diffMs = Date.now() - new Date(iso).getTime();
    const seg = Math.round(diffMs / 1000);
    const min = Math.round(seg / 60);
    const hora = Math.round(min / 60);
    const dia = Math.round(hora / 24);
    const mes = Math.round(dia / 30);
    const anio = Math.round(dia / 365);

    if (Math.abs(seg) < 60) {
        return 'recién';
    }

    if (Math.abs(min) < 60) {
        return rtf.format(-min, 'minute');
    }

    if (Math.abs(hora) < 24) {
        return rtf.format(-hora, 'hour');
    }

    if (Math.abs(dia) < 30) {
        return rtf.format(-dia, 'day');
    }

    if (Math.abs(mes) < 12) {
        return rtf.format(-mes, 'month');
    }

    return rtf.format(-anio, 'year');
}

/** Edad en años/meses a partir de una fecha de nacimiento. */
export function edadDesde(iso: string | null): string | null {
    if (!iso) {
        return null;
    }

    const nacimiento = new Date(iso);
    const ahora = new Date();
    let meses =
        (ahora.getFullYear() - nacimiento.getFullYear()) * 12 +
        (ahora.getMonth() - nacimiento.getMonth());

    if (ahora.getDate() < nacimiento.getDate()) {
        meses -= 1;
    }

    if (meses < 0) {
        return null;
    }

    if (meses < 12) {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }

    const anios = Math.floor(meses / 12);

    return `${anios} ${anios === 1 ? 'año' : 'años'}`;
}
