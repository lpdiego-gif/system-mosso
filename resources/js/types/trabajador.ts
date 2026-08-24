export interface Trabajador {
    id_trabajador: number;
    id_persona: number;
    num_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    telefono: string;
    id_user: number;
    user_name: string;
    email: string;
    id_rol: number;
    rol: string;
    direccion: string | null;
    distrito: string | null;
    fecha_ingreso: string;
    activo: 0 | 1;
}

export interface Rol {
    id_rol: number;
    nombre: string;
}

export interface TipoDocumento {
    id_tipo_documento: number;
    nombre: string;
}

export interface Departamento {
    id_departamento: number;
    nombre: string;
}

export interface Provincia {
    id_provincia: number;
    nombre: string;
    fk_departamento: number;
}

export interface Distrito {
    id_distrito: number;
    nombre: string;
    fk_provincia: number;
}

export interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface TrabajadoresResponse {
    data: Trabajador[];
    meta: PaginatedMeta;
}

export interface PersonaEncontrada {
    fk_tipo_documento?: number;
    num_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string | null;
    telefono?: string;
    fecha_nacimiento?: string | null;
}

export interface BusquedaDocumentoResponse {
    origen: 'local' | 'reniec' | 'nuevo';
    ya_es_trabajador: boolean;
    persona: PersonaEncontrada | null;
}

export interface TrabajadorFormValues {
    fk_tipo_documento: string;
    num_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    telefono: string;
    fecha_nacimiento: string;
    direccion: string;
    referencia: string;
    fk_departamento: string;
    fk_provincia: string;
    fk_distrito: string;
    email: string;
    password: string;
    password_confirmation: string;
    fk_rol: string;
    fecha_ingreso: string;
}