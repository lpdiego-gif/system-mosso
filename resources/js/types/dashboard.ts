export type DashboardStats = {
    productosTotal: number;
    productosActivos: number;
    productosStockBajo: number;
    valorInventario: number;
    clientesTotal: number;
    trabajadoresTotal: number;
    trabajadoresActivos: number;
    pedidosTotal: number;
    ventasTotal: number;
    ventasHoy: number;
    ventasMes: number;
};

export type VentaPorDia = {
    fecha: string;
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
    fecha: string;
};

export type ProductoPorAnimal = {
    animal: string;
    total: number;
};

export type TrabajadorPorRol = {
    rol: string;
    total: number;
};

export type DescuentoActivo = {
    nombre: string;
    tipo: 'porcentaje' | 'monto_fijo';
    valor: number;
    fechaFin: string;
};

export type DashboardPageProps = {
    stats: DashboardStats;
    ventasPorDia: VentaPorDia[];
    productosMasVendidos: ProductoMasVendido[];
    productosStockBajo: ProductoStockBajo[];
    pedidosRecientes: PedidoReciente[];
    productosPorAnimal: ProductoPorAnimal[];
    trabajadoresPorRol: TrabajadorPorRol[];
    descuentosActivos: DescuentoActivo[];
};
