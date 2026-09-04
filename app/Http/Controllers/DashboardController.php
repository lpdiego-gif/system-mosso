<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Umbral (unidades) por debajo del cual un producto se considera con stock bajo.
     */
    private const UMBRAL_STOCK_BAJO = 10;

    /**
     * Ventanas (en días) que el selector de periodo del dashboard acepta.
     * Cualquier otro valor recibido por query string cae al default.
     */
    private const PERIODOS_VALIDOS = [7, 30, 90];

    private const PERIODO_DEFAULT = 30;

    /**
     * Estados de pedido que cuentan como venta real (ya cobrada). Un pedido en
     * "Pendiente de pago" o "Cancelado" no debe sumar a las ventas ni a los
     * productos más vendidos. Se resuelven por nombre para no hardcodear IDs.
     *
     * @return array<int, int>
     */
    private function estadosVendidosIds(): array
    {
        return DB::table('estados_pedido')
            ->whereIn('nombre', ['Pagado', 'En preparación', 'Enviado', 'Entregado'])
            ->pluck('id_estado_pedido')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function estadoPendienteId(): ?int
    {
        $id = DB::table('estados_pedido')->where('nombre', 'Pendiente de pago')->value('id_estado_pedido');

        return $id !== null ? (int) $id : null;
    }

    public function index(Request $request): Response
    {
        $periodo = (int) $request->integer('periodo', self::PERIODO_DEFAULT);

        if (! in_array($periodo, self::PERIODOS_VALIDOS, true)) {
            $periodo = self::PERIODO_DEFAULT;
        }

        // Ventana actual: [hoy-periodo+1 00:00, ahora]. Ventana previa: los
        // `periodo` días inmediatamente anteriores, para la comparativa.
        $inicioActual = Carbon::now()->subDays($periodo - 1)->startOfDay();
        $inicioPrevio = (clone $inicioActual)->subDays($periodo);

        return Inertia::render('dashboard', [
            'periodo' => $periodo,
            'periodosDisponibles' => self::PERIODOS_VALIDOS,
            'stats' => fn () => $this->stats($inicioActual, $inicioPrevio),
            'alertas' => fn () => $this->alertas(),
            'ventasPorDia' => fn () => $this->ventasPorDia($periodo),
            'clientesPorDia' => fn () => $this->clientesPorDia($periodo),
            'ventasPorCategoria' => fn () => $this->ventasPorCategoria($inicioActual),
            'productosMasVendidos' => fn () => $this->productosMasVendidos($inicioActual),
            'productosStockBajo' => fn () => $this->productosStockBajo(),
            'pedidosRecientes' => fn () => $this->pedidosRecientes(),
            'productosPorAnimal' => fn () => $this->productosPorAnimal(),
            'descuentosActivos' => fn () => $this->descuentosActivos(),
            'saludCatalogo' => fn () => $this->saludCatalogo(),
            'carritosActivos' => fn () => $this->carritosActivos(),
            'programaFidelidad' => fn () => $this->programaFidelidad(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function stats(Carbon $inicioActual, Carbon $inicioPrevio): array
    {
        $vendidos = $this->estadosVendidosIds();

        // Ventas y nº de pedidos de la ventana actual y la previa en una sola
        // pasada: se filtra desde el inicio de la ventana previa y se reparte
        // con CASE según la fecha del pedido.
        $pedidos = DB::table('pedidos')
            ->whereIn('fk_estado_pedido', $vendidos)
            ->where('fecha_pedido', '>=', $inicioPrevio)
            ->selectRaw('COALESCE(SUM(CASE WHEN fecha_pedido >= ? THEN total ELSE 0 END), 0) as ventas_act', [$inicioActual])
            ->selectRaw('COALESCE(SUM(CASE WHEN fecha_pedido <  ? THEN total ELSE 0 END), 0) as ventas_prev', [$inicioActual])
            ->selectRaw('SUM(CASE WHEN fecha_pedido >= ? THEN 1 ELSE 0 END) as pedidos_act', [$inicioActual])
            ->selectRaw('SUM(CASE WHEN fecha_pedido <  ? THEN 1 ELSE 0 END) as pedidos_prev', [$inicioActual])
            ->first();

        $ventasAct = (float) $pedidos->ventas_act;
        $ventasPrev = (float) $pedidos->ventas_prev;
        $pedidosAct = (int) $pedidos->pedidos_act;
        $pedidosPrev = (int) $pedidos->pedidos_prev;

        // Ticket promedio: guardado contra división por cero (periodo sin pedidos).
        $ticketAct = $pedidosAct > 0 ? $ventasAct / $pedidosAct : 0.0;
        $ticketPrev = $pedidosPrev > 0 ? $ventasPrev / $pedidosPrev : 0.0;

        $clientes = DB::table('clientes')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as nuevos_act', [$inicioActual])
            ->selectRaw('SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as nuevos_prev', [$inicioPrevio, $inicioActual])
            ->first();

        $productos = DB::table('productos')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 THEN 1 ELSE 0 END) as activos')
            ->selectRaw('COALESCE(SUM(precio * stock), 0) as valor_inventario')
            ->first();

        $trabajadores = DB::table('trabajadores')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos')
            ->first();

        $historico = DB::table('pedidos')
            ->whereIn('fk_estado_pedido', $vendidos)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COALESCE(SUM(total), 0) as ventas')
            ->first();

        $clientesNuevos = (int) $clientes->nuevos_act;
        $clientesNuevosPrev = (int) $clientes->nuevos_prev;

        return [
            'ventasPeriodo' => $ventasAct,
            'ventasPeriodoPrev' => $ventasPrev,
            'ventasDelta' => $this->delta($ventasAct, $ventasPrev),
            'pedidosPeriodo' => $pedidosAct,
            'pedidosPeriodoPrev' => $pedidosPrev,
            'pedidosDelta' => $this->delta($pedidosAct, $pedidosPrev),
            'ticketPromedio' => $ticketAct,
            'ticketPromedioPrev' => $ticketPrev,
            'ticketDelta' => $this->delta($ticketAct, $ticketPrev),
            'clientesNuevos' => $clientesNuevos,
            'clientesNuevosPrev' => $clientesNuevosPrev,
            'clientesDelta' => $this->delta($clientesNuevos, $clientesNuevosPrev),

            'clientesTotal' => (int) $clientes->total,
            'ventasTotal' => (float) $historico->ventas,
            'pedidosTotal' => (int) $historico->total,
            'valorInventario' => (float) $productos->valor_inventario,
            'productosActivos' => (int) $productos->activos,
            'productosTotal' => (int) $productos->total,
            'trabajadoresActivos' => (int) $trabajadores->activos,
            'trabajadoresTotal' => (int) $trabajadores->total,
        ];
    }

    /**
     * Variación porcentual actual vs. previo, redondeada a un decimal. Devuelve
     * `null` cuando el periodo previo fue 0: no existe una variación porcentual
     * definida y el front lo rotula como «Sin comparativa».
     */
    private function delta(float $actual, float $previo): ?float
    {
        if ($previo <= 0.0) {
            return null;
        }

        return round((($actual - $previo) / $previo) * 100, 1);
    }

    /**
     * Contadores que exigen acción del equipo. Cada uno tiene su bandeja en el
     * panel; el dashboard solo los cuenta y enlaza.
     *
     * @return array<string, int>
     */
    private function alertas(): array
    {
        $pendienteId = $this->estadoPendienteId();

        return [
            'pedidosPendientes' => $pendienteId !== null
                ? (int) DB::table('pedidos')->where('fk_estado_pedido', $pendienteId)->count()
                : 0,
            'devolucionesAbiertas' => (int) DB::table('devoluciones')
                ->whereIn('estado', ['pendiente', 'en_revision'])
                ->count(),
            'reclamosAbiertos' => (int) DB::table('reclamos')
                ->whereIn('estado', ['pendiente', 'en_proceso'])
                ->count(),
            'productosStockBajo' => (int) DB::table('productos')
                ->where('stock', '<=', self::UMBRAL_STOCK_BAJO)
                ->where('fk_estado', 1)
                ->count(),
        ];
    }

    /**
     * Serie de ventas y nº de pedidos por día en la ventana seleccionada,
     * completando con 0 los días sin pedidos para una línea continua.
     *
     * @return array<int, array{fecha: string, total: float, pedidos: int}>
     */
    private function ventasPorDia(int $periodo): array
    {
        $desde = Carbon::now()->subDays($periodo - 1)->startOfDay();

        $porDia = DB::table('pedidos')
            ->selectRaw('DATE(fecha_pedido) as fecha, SUM(total) as total, COUNT(*) as pedidos')
            ->where('fecha_pedido', '>=', $desde)
            ->whereIn('fk_estado_pedido', $this->estadosVendidosIds())
            ->groupBy(DB::raw('DATE(fecha_pedido)'))
            ->get()
            ->keyBy('fecha');

        return collect(range($periodo - 1, 0))
            ->map(function (int $diasAtras) use ($porDia) {
                $fecha = Carbon::now()->subDays($diasAtras)->toDateString();
                $row = $porDia->get($fecha);

                return [
                    'fecha' => $fecha,
                    'total' => (float) ($row->total ?? 0),
                    'pedidos' => (int) ($row->pedidos ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Nº de clientes registrados por día en la ventana seleccionada, con los
     * días vacíos a 0. Alimenta la mini-gráfica de la tarjeta "Clientes nuevos".
     *
     * @return array<int, int>
     */
    private function clientesPorDia(int $periodo): array
    {
        $desde = Carbon::now()->subDays($periodo - 1)->startOfDay();

        $porDia = DB::table('clientes')
            ->selectRaw('DATE(created_at) as fecha, COUNT(*) as total')
            ->where('created_at', '>=', $desde)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'fecha');

        return collect(range($periodo - 1, 0))
            ->map(fn (int $diasAtras) => (int) ($porDia[Carbon::now()->subDays($diasAtras)->toDateString()] ?? 0))
            ->values()
            ->all();
    }

    /**
     * Ingresos por categoría (perro, gato, accesorios…) dentro de la ventana
     * seleccionada, para ver de dónde viene la facturación.
     *
     * @return array<int, array{categoria: string, total: float}>
     */
    private function ventasPorCategoria(Carbon $desde): array
    {
        return DB::table('pedido_detalle as pd')
            ->join('pedidos as pe', 'pe.id_pedido', '=', 'pd.fk_pedido')
            ->join('productos as p', 'p.id_producto', '=', 'pd.fk_producto')
            ->join('sub_categorias as sc', 'sc.id_subcategorias', '=', 'p.fk_id_subcategorias')
            ->join('categorias as c', 'c.id_categoria', '=', 'sc.fk_id_categoria')
            ->whereIn('pe.fk_estado_pedido', $this->estadosVendidosIds())
            ->where('pe.fecha_pedido', '>=', $desde)
            ->select('c.nombre as categoria', DB::raw('SUM(pd.subtotal) as total'))
            ->groupBy('c.nombre')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'categoria' => $row->categoria,
                'total' => (float) $row->total,
            ])
            ->all();
    }

    /**
     * @return array<int, array{nombre: string, cantidadVendida: int, totalVendido: float}>
     */
    private function productosMasVendidos(Carbon $desde): array
    {
        return DB::table('pedido_detalle as pd')
            ->join('productos as p', 'p.id_producto', '=', 'pd.fk_producto')
            ->join('pedidos as pe', 'pe.id_pedido', '=', 'pd.fk_pedido')
            ->whereIn('pe.fk_estado_pedido', $this->estadosVendidosIds())
            ->where('pe.fecha_pedido', '>=', $desde)
            ->select([
                'p.id_producto',
                'p.nombre',
                DB::raw('SUM(pd.cantidad) as cantidad_vendida'),
                DB::raw('SUM(pd.subtotal) as total_vendido'),
            ])
            ->groupBy('p.id_producto', 'p.nombre')
            ->orderByDesc('cantidad_vendida')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'nombre' => $row->nombre,
                'cantidadVendida' => (int) $row->cantidad_vendida,
                'totalVendido' => (float) $row->total_vendido,
            ])
            ->all();
    }

    private function productosStockBajo(): array
    {
        return DB::table('productos')
            ->where('stock', '<=', self::UMBRAL_STOCK_BAJO)
            ->where('fk_estado', 1)
            ->orderBy('stock')
            ->limit(6)
            ->select('id_producto', 'sku', 'nombre', 'stock', 'precio')
            ->get()
            ->map(fn ($row) => [
                'nombre' => $row->nombre,
                'sku' => $row->sku,
                'stock' => (int) $row->stock,
                'precio' => (float) $row->precio,
            ])
            ->all();
    }

    private function pedidosRecientes(): array
    {
        return DB::table('pedidos as pe')
            ->leftJoin('clientes as c', 'c.id_cliente', '=', 'pe.fk_cliente')
            ->leftJoin('personas as per', 'per.id_persona', '=', 'c.fk_persona')
            ->leftJoin('estados_pedido as ep', 'ep.id_estado_pedido', '=', 'pe.fk_estado_pedido')
            ->select([
                'pe.id_pedido',
                'pe.total',
                'pe.fecha_pedido',
                'pe.fk_estado_pedido as estado_id',
                DB::raw("COALESCE(NULLIF(TRIM(CONCAT(COALESCE(per.nombres, ''), ' ', COALESCE(per.apellido_paterno, ''))), ''), c.razon_social, 'Cliente') as cliente"),
                DB::raw("COALESCE(ep.nombre, 'Sin estado') as estado"),
            ])
            ->orderByDesc('pe.fecha_pedido')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id_pedido,
                'cliente' => $row->cliente,
                'total' => (float) $row->total,
                'estado' => $row->estado,
                'estadoId' => (int) $row->estado_id,
                'fecha' => $row->fecha_pedido,
            ])
            ->all();
    }

    /**
     * Distribución de productos activos por tipo de animal (perro, gato, etc.),
     * para visualizar qué categoría concentra más catálogo.
     */
    private function productosPorAnimal(): array
    {
        return DB::table('productos as p')
            ->join('sub_categorias as sc', 'sc.id_subcategorias', '=', 'p.fk_id_subcategorias')
            ->join('categorias as c', 'c.id_categoria', '=', 'sc.fk_id_categoria')
            ->join('animales as a', 'a.id_animal', '=', 'c.fk_id_animal')
            ->where('p.fk_estado', 1)
            ->select('a.nombre as animal', DB::raw('COUNT(*) as total'))
            ->groupBy('a.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'animal' => $row->animal,
                'total' => (int) $row->total,
            ])
            ->all();
    }

    /**
     * Salud del catálogo: fotografía de calidad de datos que el equipo puede
     * accionar hoy mismo, independientemente de si ya hay ventas. `sin_precio`
     * es la más crítica: un producto activo en S/ 0.00 se puede comprar gratis.
     *
     * @return array<string, int|float>
     */
    private function saludCatalogo(): array
    {
        $p = DB::table('productos')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 THEN 1 ELSE 0 END) as activos')
            ->selectRaw('SUM(CASE WHEN fk_estado <> 1 THEN 1 ELSE 0 END) as inactivos')
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 AND (precio IS NULL OR precio <= 0) THEN 1 ELSE 0 END) as sin_precio')
            ->selectRaw("SUM(CASE WHEN fk_estado = 1 AND (imagen_principal IS NULL OR imagen_principal = '') THEN 1 ELSE 0 END) as sin_imagen")
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 AND stock = 0 THEN 1 ELSE 0 END) as agotados')
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 AND stock > 0 AND stock <= ? THEN 1 ELSE 0 END) as stock_bajo', [self::UMBRAL_STOCK_BAJO])
            ->selectRaw('COALESCE(SUM(CASE WHEN fk_estado = 1 THEN stock ELSE 0 END), 0) as unidades')
            ->first();

        return [
            'total' => (int) $p->total,
            'activos' => (int) $p->activos,
            'inactivos' => (int) $p->inactivos,
            'sinPrecio' => (int) $p->sin_precio,
            'sinImagen' => (int) $p->sin_imagen,
            'agotados' => (int) $p->agotados,
            'stockBajo' => (int) $p->stock_bajo,
            'unidades' => (int) $p->unidades,
            'marcas' => (int) DB::table('marcas')->count(),
            'categorias' => (int) DB::table('categorias')->count(),
        ];
    }

    /**
     * Carritos con al menos un producto en los últimos 30 días — demanda
     * latente que aún no es pedido. El valor potencial es la suma de
     * `cantidad * precio_unitario` congelado al momento de agregar.
     *
     * @return array<string, int|float>
     */
    private function carritosActivos(): array
    {
        $desde = Carbon::now()->subDays(30)->startOfDay();

        $agg = DB::table('carritos as c')
            ->join('carrito_detalle as cd', 'cd.fk_carrito', '=', 'c.id_carrito')
            ->where('c.updated_at', '>=', $desde)
            ->selectRaw('COUNT(DISTINCT c.id_carrito) as carritos')
            ->selectRaw('COALESCE(SUM(cd.cantidad), 0) as items')
            ->selectRaw('COALESCE(SUM(cd.cantidad * cd.precio_unitario), 0) as valor')
            ->selectRaw('SUM(CASE WHEN c.fk_cliente IS NOT NULL THEN 1 ELSE 0 END) as de_clientes')
            ->first();

        return [
            'carritos' => (int) $agg->carritos,
            'items' => (int) $agg->items,
            'valorPotencial' => (float) $agg->valor,
            'deClientes' => (int) $agg->de_clientes,
        ];
    }

    /**
     * Promociones vigentes y las que caducan en 7 días — para no dejar que un
     * descuento o cupón se venza sin avisar.
     *
     * @return array<string, int>
     */
    private function programaFidelidad(): array
    {
        $ahora = Carbon::now();
        $en7dias = (clone $ahora)->addDays(7);

        return [
            'cuponesVigentes' => (int) DB::table('cupones')
                ->where('usado', 0)
                ->whereDate('fecha_vencimiento', '>=', $ahora)
                ->count(),
            'cuponesPorVencer' => (int) DB::table('cupones')
                ->where('usado', 0)
                ->whereBetween('fecha_vencimiento', [$ahora->toDateString(), $en7dias->toDateString()])
                ->count(),
            'descuentosVigentes' => (int) DB::table('descuentos')
                ->where('activo', 1)
                ->where('fecha_fin', '>=', $ahora)
                ->count(),
            'descuentosPorVencer' => (int) DB::table('descuentos')
                ->where('activo', 1)
                ->whereBetween('fecha_fin', [$ahora, $en7dias])
                ->count(),
        ];
    }

    private function descuentosActivos(): array
    {
        return DB::table('descuentos as d')
            ->join('productos as p', 'p.id_producto', '=', 'd.fk_producto')
            ->where('d.activo', 1)
            ->where('d.fecha_fin', '>=', Carbon::now())
            ->select('p.nombre', 'd.tipo', 'd.valor', 'd.fecha_fin')
            ->orderBy('d.fecha_fin')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'nombre' => $row->nombre,
                'tipo' => $row->tipo,
                'valor' => (float) $row->valor,
                'fechaFin' => $row->fecha_fin,
            ])
            ->all();
    }
}
