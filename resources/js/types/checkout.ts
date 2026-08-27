import type {
    Departamento,
    Distrito,
    Provincia,
    TipoDocumento,
} from '@/types/trabajador';

export interface CheckoutItem {
    id_producto: number;
    nombre: string;
    marca: string | null;
    imagen: string | null;
    cantidad: number;
    precio_unitario: number;
    descuento_unitario: number;
    precio_final: number;
    subtotal: number;
    stock: number;
    activo: boolean;
}

export interface CheckoutResumen {
    items: CheckoutItem[];
    subtotal: number;
    descuento_total: number;
    problemas: string[];
}

export interface CheckoutPersona {
    fk_tipo_documento: number;
    num_documento: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    telefono: string;
}

export interface CheckoutComprador {
    correo: string;
    persona: CheckoutPersona | null;
    datos_completos: boolean;
}

export interface TipoEntregaOpcion {
    id_tipo_entrega: number;
    nombre: string;
    requiere_direccion: 0 | 1;
}

export interface DireccionGuardada {
    id_cliente_direccion: number;
    alias: string | null;
    es_principal: 0 | 1;
    id_direccion: number;
    direccion: string;
    referencia: string | null;
    id_distrito: number;
    distrito: string;
    costo_envio: string | number;
    provincia: string;
    departamento: string;
}

export interface EmpresaCheckout {
    nombre_comercial: string;
    razon_social: string;
    ruc: string;
    correo: string;
    telefono: string;
    direccion: string | null;
    referencia: string | null;
    distrito: string | null;
}

export interface CheckoutDistrito extends Distrito {
    costo_envio: string | number;
}

export interface CheckoutIndexProps {
    resumen: CheckoutResumen;
    comprador: CheckoutComprador;
    facturacion: { razon_social: string | null; ruc: string | null };
    tiposDocumento: TipoDocumento[];
    tipoEntregas: TipoEntregaOpcion[];
    direcciones: DireccionGuardada[];
    departamentos: Departamento[];
    provincias: Provincia[];
    distritos: CheckoutDistrito[];
    empresa: EmpresaCheckout | null;
    igvIncluido: boolean;
    culqiPublicKey: string | null;
    culqiConfigurado: boolean;
}

export interface CotizacionEnvio {
    costo_envio: number;
    gratis: boolean;
    motivo: string;
}

export interface CheckoutConfirmacionProps {
    pedido: {
        id: number;
        fecha: string | null;
        subtotal: number;
        descuento_total: number;
        igv: number;
        total: number;
        costo_envio: number;
        tipo_entrega: string | null;
        estado: string | null;
        items: Array<{
            nombre: string | null;
            marca: string | null;
            imagen: string | null;
            cantidad: number;
            precio_final: number;
            subtotal: number;
        }>;
    };
    comprobante: { tipo: string | null; serie: string; numero: string } | null;
    pago: { transaccion: string | null; monto: number };
    direccion: {
        direccion: string;
        referencia: string | null;
        distrito: string;
    } | null;
    receptor: {
        nombres: string;
        apellidos: string;
        telefono: string | null;
    } | null;
    empresa: EmpresaCheckout | null;
}

/**
 * Tipos mínimos de Culqi Checkout Custom (script https://js.culqi.com/checkout-js).
 * Es el reemplazo oficial de Culqi Checkout v4 (`checkout.culqi.com/js/v4`), que
 * quedó deprecado y provoca errores de sesión (CCKT-408 / 401 en get-session).
 */
export interface CulqiCheckoutConfig {
    settings: {
        title: string;
        currency: string;
        amount: number;
        order?: string;
    };
    client?: { email?: string };
    options?: {
        lang?: string;
        installments?: boolean;
        modal?: boolean;
        paymentMethods?: Record<string, boolean>;
        paymentMethodsSort?: string[];
    };
    appearance?: Record<string, unknown>;
}

export interface CulqiCheckoutInstance {
    open: () => void;
    close: () => void;
    culqi: () => void;
    token?: { id: string; object?: string };
    order?: { id: string; state?: string };
    error?: { user_message?: string; merchant_message?: string };
}

export type CulqiCheckoutConstructor = new (
    publicKey: string,
    config: CulqiCheckoutConfig,
) => CulqiCheckoutInstance;
