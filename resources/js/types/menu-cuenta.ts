export interface MenuCuentaItem {
  id: number;
  tipo: 'seccion_interna' | 'url';
  clave: string | null;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  href: string;
}
