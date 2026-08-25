export interface ProductoCard {
  id: number;
  nombre: string;
  marca: string | null;
  imagen: string | null;
  precio: number;
  precioFinal: number;
  porcentajeOff: number | null;
  href: string;
}

export interface MarcaCard {
  id: number;
  nombre: string;
  logo: string;
  href: string;
}
