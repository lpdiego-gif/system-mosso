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

const PLACEHOLDER_PRODUCTO = '/image/paw-icon.png';

export function imagenProducto(p: Pick<ProductoCard, 'imagen'>): string {
    return p.imagen ?? PLACEHOLDER_PRODUCTO;
}

export function onImagenError(e: React.SyntheticEvent<HTMLImageElement>): void {
    e.currentTarget.src = PLACEHOLDER_PRODUCTO;
    e.currentTarget.onerror = null;
}

// Shape que devuelve CatalogoController::formato() — extiende ProductoCard con
// los campos que necesita el panel de filtros de /catalogo/{animal|categoria|subcategoria}.
// No se toca ProductoCard porque Home/Ofertas/Marcas/Buscar/Favoritos dependen de su shape actual.
export interface ProductoCatalogo extends ProductoCard {
    stock: number;
    marcaId: number | null;
    categoriaId: number | null;
    categoriaNombre: string | null;
    subcategoriaId: number | null;
    subcategoriaNombre: string | null;
}

export interface MarcaCard {
    id: number;
    nombre: string;
    logo: string;
    href: string;
}

// Espejo de app/Http/Controllers/Admin/ProductoController.php.

export interface AnimalOption {
    id_animal: number;
    nombre: string;
}

export interface MarcaOption {
    id_marca: number;
    nombre: string;
}

export interface UnidadOption {
    id_unidad_medida: number;
    nombre: string;
    abreviatura: string;
}

export interface EstadoOption {
    id_estado_producto: number;
    nombre: string;
}

export interface CategoriaOption {
    id_categoria: number;
    nombre: string;
    fk_id_animal: number;
}

export interface SubCategoriaOption {
    id_subcategorias: number;
    nom_sub_categoria: string;
    fk_id_categoria: number;
}

export interface EtapaOption {
    id_etapa_vida: number;
    nombre: string;
    edad_min_meses: number;
    edad_max_meses: number | null;
}

export interface ProductoRow {
    id_producto: number;
    sku: string;
    codigo_barras: string | null;
    nombre: string;
    marca_nombre: string | null;
    animal_nombre: string | null;
    categoria_nombre: string | null;
    subcategoria_nombre: string | null;
    etapa_nombre: string | null;
    unidad_abreviatura: string | null;
    precio: number;
    precio_final: number;
    descuento_label: string | null;
    stock: number;
    stock_bajo: boolean;
    activo: boolean;
    estado_nombre: string | null;
    imagen_url: string | null;
    creado_en: string | null;
}

export interface ProductoDetalle extends ProductoRow {
    descripcion: string | null;
    unidad_nombre: string | null;
    actualizado_en: string | null;
}

export interface ProductoFiltros {
    search: string | null;
    animal: number | null;
    marca: number | null;
    estado: number | null;
    stock: 'todos' | 'bajo' | 'sin';
    sort: string;
    dir: 'asc' | 'desc';
    perPage: number;
}

export interface ProductoStats {
    total: number;
    activos: number;
    sin_stock: number;
    valor_inventario: number;
}

export interface ProductoOpciones {
    animales: AnimalOption[];
    marcas: MarcaOption[];
    estados: EstadoOption[];
    porPagina: number[];
    stock: string[];
    umbralStockBajo: number;
}

export interface ProductoFormLookups {
    animales: AnimalOption[];
    marcas: MarcaOption[];
    unidades: UnidadOption[];
    estados: EstadoOption[];
}

export interface ProductoEditData {
    id_producto: number;
    sku: string;
    codigo_barras: string | null;
    nombre: string;
    descripcion: string | null;
    fk_id_animal: string;
    fk_id_categoria: string;
    fk_id_subcategorias: string;
    fk_etapa_vida: string;
    fk_marca: string;
    fk_unidad_medida: string;
    fk_estado: string;
    precio: string;
    stock: string;
    imagen_url: string | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}
