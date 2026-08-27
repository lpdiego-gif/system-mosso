import type { Departamento, Distrito, Provincia, TipoDocumento } from '@/types/trabajador';

export type TipoCuenta = 'trabajador' | 'cliente' | 'otro';

export interface RegistroPendienteFlash {
  email: string;
}

export interface MiCuentaProps {
  user: {
    name: string;
    email: string;
  };
}

export interface DireccionCliente {
  id_cliente_direccion: number;
  alias: string | null;
  es_principal: 0 | 1;
  id_direccion: number;
  direccion: string;
  referencia: string | null;
  distrito: string;
  provincia: string;
  departamento: string;
}

export interface MiCuentaDireccionesProps {
  direcciones: DireccionCliente[];
  departamentos: Departamento[];
  provincias: Provincia[];
  distritos: Distrito[];
}

export interface PersonaDetalle {
  fk_tipo_documento: number;
  num_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  telefono: string;
  fecha_nacimiento: string | null;
}

export interface MiCuentaDetallesProps {
  email: string;
  persona: PersonaDetalle | null;
  tiposDocumento: TipoDocumento[];
}

export interface PasskeyResumen {
  id: number;
  name: string;
  created_at_diff: string;
  last_used_at_diff: string | null;
}

export interface MiCuentaSeguridadProps {
  passwordRules: string;
  canManagePasskeys: boolean;
  passkeys: PasskeyResumen[];
}
