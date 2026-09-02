/** Arma un link wa.me a partir de un teléfono peruano (con o sin +51), con mensaje opcional. */
export function whatsappUrl(telefono: string, mensaje?: string): string {
    const digitos = telefono.replace(/\D/g, '');
    const conCodigo = digitos.startsWith('51') ? digitos : `51${digitos}`;
    const query = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';

    return `https://wa.me/${conCodigo}${query}`;
}
