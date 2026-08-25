// Tipos espejo de lo que devuelven ServicioController (público) y
// Admin\ServicioController (panel). Ver app/Http/Controllers/ServicioController.php
// y app/Http/Controllers/Admin/ServicioController.php.

export interface ServicioCard {
    id: number;
    tipo: string;
    nombre_negocio: string;
    nombre_servicio: string;
    descripcion: string | null;
    imagen: string | null;
    href: string;
}

export interface TipoServicioOption {
    id_tipo_servicio: number;
    nombre: string;
}

export interface ServicioListadoProps {
    titulo: string;
    tipos: TipoServicioOption[];
    tipoActivo: string | null;
    servicios: ServicioCard[];
}

export interface ServicioHorarioDetalle {
    dia_semana: string;
    hora_inicio: string | null;
    hora_fin: string | null;
}

export interface ServicioImagenDetalle {
    id: number;
    url: string;
    orden: number;
}

export interface ServicioBeneficioDetalle {
    icono: string | null;
    titulo: string;
    descripcion: string | null;
}

export interface ServicioRedDetalle {
    red: string;
    link: string;
}

export interface ServicioDetalle {
    id: number;
    tipo: string;
    nombre_negocio: string;
    nombre_servicio: string;
    descripcion: string | null;
    responsable: string | null;
    foto_responsable: string | null;
    telefono_contacto: string | null;
    correo_contacto: string | null;
    whatsapp_href: string | null;
    direccion: string | null;
    distrito: string | null;
    imagenes: ServicioImagenDetalle[];
    horarios: ServicioHorarioDetalle[];
    beneficios: ServicioBeneficioDetalle[];
    redes: ServicioRedDetalle[];
}

export interface ServicioShowProps {
    breadcrumbs: { label: string; href: string | null }[];
    servicio: ServicioDetalle;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface RedSocialOption {
    id_red_social: number;
    nombre: string;
}

export interface DepartamentoOption {
    id_departamento: number;
    nombre: string;
}

export interface ProvinciaOption {
    id_provincia: number;
    nombre: string;
}

export interface DistritoOption {
    id_distrito: number;
    nombre: string;
}

export interface ServicioFormLookups {
    tiposServicio: TipoServicioOption[];
    redesSociales: RedSocialOption[];
    departamentos: DepartamentoOption[];
    diasSemana: string[];
}

export interface ServicioAdminRow {
    id_servicio: number;
    nombre_negocio: string;
    nombre_servicio: string;
    tipo_servicio: string;
    activo: boolean;
    imagen: string | null;
}

export interface HorarioFormValue {
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
}

export interface BeneficioFormValue {
    icono: string;
    titulo: string;
    descripcion: string;
}

export interface RedFormValue {
    fk_red: string;
    link: string;
}

export interface ImagenExistente {
    id_servicio_imagen: number;
    url: string;
    orden: number;
}

export interface ServicioEditData {
    id_servicio: number;
    fk_tipo_servicio: number;
    nombre_negocio: string;
    nombre_servicio: string;
    responsable: string | null;
    foto_responsable: string | null;
    descripcion: string | null;
    telefono_contacto: string | null;
    correo_contacto: string | null;
    activo: boolean;
    direccion: string | null;
    referencia: string | null;
    fk_departamento: number | null;
    fk_provincia: number | null;
    fk_distrito: number | null;
    horarios: HorarioFormValue[];
    beneficios: BeneficioFormValue[];
    redes: RedFormValue[];
    imagenes: ImagenExistente[];
}
