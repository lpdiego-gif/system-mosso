<?php

namespace App\Http\Controllers;

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

    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => $this->stats(),
            'ventasPorDia' => $this->ventasPorDia(),
            'productosMasVendidos' => $this->productosMasVendidos(),
            'productosStockBajo' => $this->productosStockBajo(),
            'pedidosRecientes' => $this->pedidosRecientes(),
            'productosPorAnimal' => $this->productosPorAnimal(),
            'trabajadoresPorRol' => $this->trabajadoresPorRol(),
            'descuentosActivos' => $this->descuentosActivos(),
        ]);
    }

    private function stats(): array
    {
        $productos = DB::table('productos')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN fk_estado = 1 THEN 1 ELSE 0 END) as activos')
            ->selectRaw('SUM(CASE WHEN stock <= ? THEN 1 ELSE 0 END) as stock_bajo', [self::UMBRAL_STOCK_BAJO])
            ->selectRaw('COALESCE(SUM(precio * stock), 0) as valor_inventario')
            ->first();

        $clientesTotal = (int) DB::table('clientes')->count();

        $trabajadores = DB::table('trabajadores')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos')
            ->first();

        $pedidos = DB::table('pedidos')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COALESCE(SUM(total), 0) as total_ventas')
            ->selectRaw('COALESCE(SUM(CASE WHEN fecha_pedido >= ? AND fecha_pedido < ? THEN total ELSE 0 END), 0) as ventas_hoy', [
                Carbon::today(),
                Carbon::tomorrow(),
            ])
            ->selectRaw('COALESCE(SUM(CASE WHEN fecha_pedido >= ? THEN total ELSE 0 END), 0) as ventas_mes', [
                Carbon::now()->subDays(29)->startOfDay(),
            ])
            ->first();

        return [
            'productosTotal' => (int) $productos->total,
            'productosActivos' => (int) $productos->activos,
            'productosStockBajo' => (int) $productos->stock_bajo,
            'valorInventario' => (float) $productos->valor_inventario,
            'clientesTotal' => $clientesTotal,
            'trabajadoresTotal' => (int) $trabajadores->total,
            'trabajadoresActivos' => (int) $trabajadores->activos,
            'pedidosTotal' => (int) $pedidos->total,
            'ventasTotal' => (float) $pedidos->total_ventas,
            'ventasHoy' => (float) $pedidos->ventas_hoy,
            'ventasMes' => (float) $pedidos->ventas_mes,
        ];
    }

    /**
     * Serie de ventas (suma de `total` en pedidos) de los últimos 14 días,
     * completando con 0 los días sin pedidos para un gráfico continuo.
     */
    private function ventasPorDia(): array
    {
        $desde = Carbon::now()->subDays(13)->startOfDay();

        $porDia = DB::table('pedidos')
            ->selectRaw('DATE(fecha_pedido) as fecha, SUM(total) as total')
            ->where('fecha_pedido', '>=', $desde)
            ->groupBy(DB::raw('DATE(fecha_pedido)'))
            ->pluck('total', 'fecha');

        return collect(range(13, 0))
            ->map(function (int $diasAtras) use ($porDia) {
                $fecha = Carbon::now()->subDays($diasAtras)->toDateString();

                return [
                    'fecha' => $fecha,
                    'total' => (float) ($porDia[$fecha] ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function productosMasVendidos(): array
    {
        return DB::table('pedido_detalle as pd')
            ->join('productos as p', 'p.id_producto', '=', 'pd.fk_producto')
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
                DB::raw("COALESCE(CONCAT(per.nombres, ' ', per.apellido_paterno), 'Cliente') as cliente"),
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

    private function trabajadoresPorRol(): array
    {
        return DB::table('trabajadores as t')
            ->join('roles as r', 'r.id_rol', '=', 't.fk_rol')
            ->where('t.activo', 1)
            ->select('r.nombre as rol', DB::raw('COUNT(*) as total'))
            ->groupBy('r.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'rol' => $row->rol,
                'total' => (int) $row->total,
            ])
            ->all();
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
