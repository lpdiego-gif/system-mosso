import type { Departamento, Distrito, Provincia, TipoDocumento } from '@/types/trabajador';

export type TipoCuenta = 'trabajador' | 'cliente' | 'otro';

export interface RegistroPendienteFlash {
  email: string;
}

export interface MiCuentaResumen {
  total_pedidos: number;
  total_mascotas: number;
  total_puntos: number;
  cupones_activos: number;
}

export interface MiCuentaProps {
  user: { name: string; email: string };
  resumen: MiCuentaResumen;
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

/* ── Pedidos ─────────────────────────────────────────────── */

export interface Pedido {
  id_pedido: number;
  estado: string;
  subtotal: number;
  descuento_total: number;
  igv: number;
  total: number;
  fecha_pedido: string;
}

export interface MiCuentaPedidosProps {
  pedidos: Pedido[];
}

/* ── Mascotas ─────────────────────────────────────────────── */

export interface Animal {
  id_animal: number;
  nombre: string;
}

export interface Mascota {
  id_mascota: number;
  nombre: string;
  fk_animal: number;
  animal: string;
  fecha_nacimiento: string | null;
}

export interface MiCuentaMascotasProps {
  mascotas: Mascota[];
  animales: Animal[];
}

/* ── Puntos y Cupones ─────────────────────────────────────── */

export type TipoMovimiento = 'acumulacion' | 'canje_descuento' | 'canje_producto' | 'vencimiento';
export type TipoCupon = 'descuento_porcentaje' | 'descuento_monto' | 'envio_gratis' | 'producto_gratis' | 'puntos_bonus';
export type OrigenCupon = 'cumpleanos_mascota' | 'bienvenida' | 'promocion_manual';

export interface PuntoCliente {
  id_punto: number;
  tipo: TipoMovimiento;
  monto: number;
  fecha: string;
  fecha_vencimiento: string | null;
  descripcion: string | null;
}

export interface CuponCliente {
  id_cupon: number;
  codigo: string;
  origen: OrigenCupon;
  tipo: TipoCupon;
  valor: number | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  usado: boolean;
}

export interface MiCuentaPuntosProps {
  total_puntos: number;
  movimientos: PuntoCliente[];
  cupones: CuponCliente[];
}
