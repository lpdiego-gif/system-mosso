export interface MenuHijo {
  id: number;
  nombre: string;
  href: string;
  hijos: MenuHijo[];
}

export interface MenuColumna {
  titulo: string | null;
  items: MenuHijo[];
}

export interface MenuItem {
  id: number;
  nombre: string;
  icono: string | null;
  destacado: boolean;
  tipo: 'animal' | 'tipo_animal' | 'marca' | 'tipo_servicio' | 'url';
  href: string | null;
  columnas: MenuColumna[];
}