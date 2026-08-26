export interface Empresa {
    id_empresa: number;
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
    logo: string | null;
    correo: string;
    telefono: string;
    fk_direccion: number;
    direccion: string;
    referencia: string | null;
    fk_distrito: number;
    fk_provincia: number;
    fk_departamento: number;
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

/** Datos públicos de la empresa compartidos en todas las páginas (header/footer). */
export interface EmpresaPublica {
    nombre_comercial: string;
    logo: string | null;
    correo: string;
    telefono: string;
    direccion: string | null;
    distrito: string | null;
}

export interface EmpresaFormValues {
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
    correo: string;
    telefono: string;
    direccion: string;
    referencia: string;
    fk_departamento: string;
    fk_provincia: string;
    fk_distrito: string;
}
