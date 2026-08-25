export type TipoDocumentoReclamo = 'DNI' | 'CE' | 'Pasaporte';

export interface ReclamoRegistradoFlash {
  id: number;
  fecha: string | null;
  tipo: 'reclamo' | 'queja';
}
