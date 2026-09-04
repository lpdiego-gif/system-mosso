/**
 * Variación porcentual contra el periodo anterior de igual longitud.
 * `null` cuando no hay base de comparación (el periodo previo fue 0) — la
 * interfaz lo muestra como «Sin comparativa» en vez de un salto de +100 %.
 */
export type Delta = number | null;

export type DashboardStats = {
    // --- Ventana temporal (depende del `periodo` seleccionado) ---
    ventasPeriodo: number;
    ventasPeriodoPrev: number;
    ventasDelta: Delta;
    pedidosPeriodo: number;
    pedidosPeriodoPrev: number;
    pedidosDelta: Delta;
    ticketPromedio: number;
    ticketPromedioPrev: number;
    ticketDelta: Delta;
    clientesNuevos: number;
    clientesNuevosPrev: number;
    clientesDelta: Delta;

    // --- Fotografía actual (no depende del periodo) ---
    clientesTotal: number;
    ventasTotal: number;
    pedidosTotal: number;
    valorInventario: number;
    productosActivos: number;
    productosTotal: number;
    trabajadoresActivos: number;
    trabajadoresTotal: number;
};

/** Contadores accionables: cada uno enlaza a su bandeja de gestión. */
export type DashboardAlertas = {
    pedidosPendientes: number;
    devolucionesAbiertas: number;
    reclamosAbiertos: number;
    productosStockBajo: number;
};

export type VentaPorDia = {
    fecha: string;
    total: number;
    pedidos: number;
};

export type VentaPorCategoria = {
    categoria: string;
    total: number;
};

export type ProductoMasVendido = {
    nombre: string;
    cantidadVendida: number;
    totalVendido: number;
};

export type ProductoStockBajo = {
    nombre: string;
    sku: string;
    stock: number;
    precio: number;
};

export type PedidoReciente = {
    id: number;
    cliente: string;
    total: number;
    estado: string;
    estadoId: number;
    fecha: string;
};

export type ProductoPorAnimal = {
    animal: string;
    total: number;
};

export type SaludCatalogo = {
    total: number;
    activos: number;
    inactivos: number;
    sinPrecio: number;
    sinImagen: number;
    agotados: number;
    stockBajo: number;
    unidades: number;
    marcas: number;
    categorias: number;
};

export type CarritosActivos = {
    carritos: number;
    items: number;
    valorPotencial: number;
    deClientes: number;
};

export type ProgramaFidelidad = {
    cuponesVigentes: number;
    cuponesPorVencer: number;
    descuentosVigentes: number;
    descuentosPorVencer: number;
};

export type DescuentoActivo = {
    nombre: string;
    tipo: 'porcentaje' | 'monto_fijo';
    valor: number;
    fechaFin: string;
};

export type DashboardPageProps = {
    periodo: number;
    periodosDisponibles: number[];
    stats: DashboardStats;
    alertas: DashboardAlertas;
    ventasPorDia: VentaPorDia[];
    /** Serie diaria de clientes registrados (longitud = periodo) para la mini-gráfica. */
    clientesPorDia: number[];
    ventasPorCategoria: VentaPorCategoria[];
    productosMasVendidos: ProductoMasVendido[];
    productosStockBajo: ProductoStockBajo[];
    pedidosRecientes: PedidoReciente[];
    productosPorAnimal: ProductoPorAnimal[];
    descuentosActivos: DescuentoActivo[];
    saludCatalogo: SaludCatalogo;
    carritosActivos: CarritosActivos;
    programaFidelidad: ProgramaFidelidad;
};
