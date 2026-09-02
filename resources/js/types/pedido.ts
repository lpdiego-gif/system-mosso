// Espejo de App\Http\Controllers\Admin\PedidoController (index/detalleCompleto).

export interface PedidoRow {
    id_pedido: number;
    cliente: string;
    correo: string | null;
    estado: string;
    fk_estado_pedido: number;
    total: number;
    fecha_pedido: string;
}

export interface EstadoOpcion {
    id_estado_pedido: number;
    nombre: string;
}

export interface PedidoDetalleItem {
    id_pedido_detalle: number;
    producto: string | null;
    imagen: string | null;
    cantidad: number;
    precio_unitario: number;
    descuento_unitario: number;
    subtotal: number;
}

export interface PedidoCompleto {
    id_pedido: number;
    estado: string | null;
    fk_estado_pedido: number;
    fecha_pedido: string | null;
    subtotal: number;
    descuento_total: number;
    igv: number;
    total: number;
    tipo_entrega: string | null;
    forma_pago: string | null;
    cliente: {
        id_cliente: number | null;
        nombre: string;
        correo: string | null;
        telefono: string | null;
        documento: string | null;
    };
    direccion_envio: { direccion: string | null; referencia: string | null; distrito: string | null } | null;
    recojo_tercero: { nombres: string; documento: string | null; telefono: string | null } | null;
    pago: { estado: string | null; monto: number; referencia: string | null; fecha_pago: string | null } | null;
    comprobante: { tipo: string | null; serie: string | null; numero: string | null; fecha_emision: string | null } | null;
}

export interface PedidoDetalleResponse {
    pedido: PedidoCompleto;
    detalles: PedidoDetalleItem[];
    opciones: { estados: EstadoOpcion[] };
}
