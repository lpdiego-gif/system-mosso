/** Vista previa de un producto (para mostrar su imagen junto a la subcategoría en el menú). */
export interface ProductoMenu {
  id: number;
  nombre: string;
  imagen: string;
}

export interface MenuHijo {
  id: number;
  nombre: string;
  href: string;
  logo?: string | null;
  hijos: MenuHijo[];
  /** Solo presente en subcategorías: vista previa de sus productos con imagen. */
  productos?: ProductoMenu[];
  /** Total de productos con imagen en la subcategoría (puede ser mayor a `productos.length`). */
  totalProductos?: number;
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