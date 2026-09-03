/**
 * Distrito devuelto por GET /ubigeo/distritos?provincia={id} (ver
 * UbigeoController). Incluye `activo`/`costo_envio` porque tanto el panel
 * admin (precargar el modal "Nuevo distrito") como /mi-cuenta/direcciones
 * (avisar si el distrito elegido no tiene envío) los necesitan.
 */
export interface DistritoUbigeo {
    id_distrito: number;
    nombre: string;
    activo: boolean | 0 | 1;
    costo_envio: string | number | null;
}
