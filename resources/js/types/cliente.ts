// Tipos espejo de lo que devuelve app/Http/Controllers/Admin/ClienteController.php.

export interface TipoDocumentoOption {
    id_tipo_documento: number;
    nombre: string;
}

export type ClienteSegmento =
    | 'todos'
    | 'personas'
    | 'empresas'
    | 'con_cuenta'
    | 'sin_cuenta';

export interface ClienteRow {
    id_cliente: number;
    nombre: string;
    iniciales: string;
    num_documento: string | null;
    tipo_documento: string | null;
    correo: string;
    telefono: string | null;
    razon_social: string | null;
    ruc: string | null;
    es_empresa: boolean;
    tiene_cuenta: boolean;
    mascotas_count: number;
    pedidos_count: number;
    total_gastado: number;
    creado_en: string | null;
    sin_persona: boolean;
}

export interface ClienteStats {
    total: number;
    con_cuenta: number;
    empresas: number;
    nuevos_mes: number;
}

export interface ClienteFiltros {
    search: string | null;
    segmento: ClienteSegmento;
    sort: string;
    dir: 'asc' | 'desc';
    perPage: number;
}

export interface ClienteOpciones {
    porPagina: number[];
    segmentos: ClienteSegmento[];
}

export interface ClienteEditData {
    id_cliente: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    fk_tipo_documento: string;
    num_documento: string;
    telefono: string;
    fecha_nacimiento: string;
    correo: string;
    es_empresa: boolean;
    razon_social: string;
    ruc: string;
    tiene_cuenta: boolean;
    cuenta_email: string | null;
}

export interface ClienteDetalle {
    id_cliente: number;
    nombre: string;
    iniciales: string;
    correo: string;
    telefono: string | null;
    num_documento: string | null;
    tipo_documento: string | null;
    fecha_nacimiento: string | null;
    razon_social: string | null;
    ruc: string | null;
    es_empresa: boolean;
    cuenta_email: string | null;
    cuenta_verificada: boolean;
    sin_persona: boolean;
    creado_en: string | null;
}

export interface ClienteMetricas {
    pedidos: number;
    total_gastado: number;
    mascotas: number;
    puntos: number;
    direcciones: number;
}

export interface ClienteMascota {
    id_mascota: number;
    nombre: string;
    animal: string | null;
    fecha_nacimiento: string | null;
}

export interface ClienteDireccionItem {
    id_cliente_direccion: number;
    alias: string | null;
    es_principal: boolean;
    direccion: string | null;
    referencia: string | null;
}

export interface ClientePedidoItem {
    id_pedido: number;
    estado: string | null;
    total: number;
    fecha: string | null;
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
