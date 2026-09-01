<?php

namespace App\Http\Controllers;

use App\Models\Devolucion;
use App\Services\CuentaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Flujo público de "Cambios y devoluciones" (enlazado desde el footer). Sin
 * modelo previo en el proyecto — tabla y flujo creados de cero. Solo se
 * puede pedir cambio/devolución de pedidos ya entregados, y solo por la
 * cantidad de cada producto que todavía no tenga una solicitud activa.
 */
class DevolucionController extends Controller
{
    private const MOTIVOS = [
        'producto_defectuoso', 'producto_dañado', 'no_es_lo_que_pedi',
        'talla_o_tamaño_incorrecto', 'llego_incompleto', 'ya_no_lo_necesito', 'otro',
    ];

    public function create(Request $request, CuentaService $cuentaService): Response
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        $pedidos = $this->pedidosElegibles($clienteId);

        $contacto = DB::table('clientes as c')
            ->leftJoin('personas as per', 'per.id_persona', '=', 'c.fk_persona')
            ->where('c.id_cliente', $clienteId)
            ->select('c.correo as email', 'per.telefono')
            ->first();

        return Inertia::render('cambios-y-devoluciones', [
            'pedidos' => $pedidos,
            'motivos' => self::MOTIVOS,
            'contacto' => [
                'telefono' => $contacto?->telefono,
                'email' => $contacto?->email,
            ],
        ]);
    }

    public function store(Request $request, CuentaService $cuentaService): RedirectResponse
    {
        $clienteId = $cuentaService->clienteIdDe($request->user());

        abort_if($clienteId === null, 403, 'Esta sección es solo para cuentas de cliente.');

        $data = $request->validate([
            'fk_pedido' => ['required', 'integer'],
            'tipo' => ['required', Rule::in(['cambio', 'devolucion'])],
            'motivo' => ['required', Rule::in(self::MOTIVOS)],
            'detalle' => ['required', 'string', 'max:2000'],
            'telefono_contacto' => ['required', 'string', 'max:20'],
            'email_contacto' => ['nullable', 'email', 'max:150'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.fk_pedido_detalle' => ['required', 'integer'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
        ]);

        // El pedido debe ser del cliente logueado y estar entregado.
        $pedidoValido = DB::table('pedidos as p')
            ->join('estados_pedido as ep', 'ep.id_estado_pedido', '=', 'p.fk_estado_pedido')
            ->where('p.id_pedido', $data['fk_pedido'])
            ->where('p.fk_cliente', $clienteId)
            ->where('ep.nombre', 'Entregado')
            ->exists();

        if (! $pedidoValido) {
            throw ValidationException::withMessages([
                'fk_pedido' => 'Ese pedido no está disponible para cambio o devolución.',
            ]);
        }

        $disponiblesPorDetalle = $this->disponiblePorDetalle($data['fk_pedido']);

        foreach ($data['items'] as $item) {
            $disponible = $disponiblesPorDetalle[$item['fk_pedido_detalle']] ?? null;

            if ($disponible === null || $item['cantidad'] > $disponible['disponible']) {
                throw ValidationException::withMessages([
                    'items' => 'Uno de los productos seleccionados ya no tiene esa cantidad disponible para solicitar.',
                ]);
            }
        }

        $devolucion = DB::transaction(function () use ($data, $clienteId) {
            $devolucion = Devolucion::create([
                'fk_cliente' => $clienteId,
                'fk_pedido' => $data['fk_pedido'],
                'tipo' => $data['tipo'],
                'motivo' => $data['motivo'],
                'detalle' => $data['detalle'],
                'telefono_contacto' => $data['telefono_contacto'],
                'email_contacto' => $data['email_contacto'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $devolucion->detalles()->create([
                    'fk_pedido_detalle' => $item['fk_pedido_detalle'],
                    'cantidad' => $item['cantidad'],
                ]);
            }

            return $devolucion;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Tu solicitud N° {$devolucion->id_devolucion} fue registrada. Te contactaremos pronto.",
        ]);

        return redirect()->route('mi-cuenta');
    }

    /**
     * Pedidos entregados del cliente, con sus ítems y la cantidad todavía
     * disponible para pedir cambio/devolución (descuenta lo ya solicitado
     * en solicitudes que no estén rechazadas).
     *
     * @return list<array<string, mixed>>
     */
    private function pedidosElegibles(int $clienteId): array
    {
        $pedidos = DB::table('pedidos as p')
            ->join('estados_pedido as ep', 'ep.id_estado_pedido', '=', 'p.fk_estado_pedido')
            ->where('p.fk_cliente', $clienteId)
            ->where('ep.nombre', 'Entregado')
            ->orderByDesc('p.fecha_pedido')
            ->select('p.id_pedido', 'p.fecha_pedido', 'p.total')
            ->get();

        return $pedidos->map(function ($pedido) {
            $disponibles = $this->disponiblePorDetalle($pedido->id_pedido);

            $items = collect($disponibles)
                ->filter(fn ($d) => $d['disponible'] > 0)
                ->values()
                ->map(fn ($d) => [
                    'id_pedido_detalle' => $d['id_pedido_detalle'],
                    'producto' => $d['producto'],
                    'imagen' => $d['imagen'],
                    'cantidad_disponible' => $d['disponible'],
                ]);

            return [
                'id_pedido' => $pedido->id_pedido,
                'fecha_pedido' => $pedido->fecha_pedido,
                'total' => (float) $pedido->total,
                'items' => $items->values()->all(),
            ];
        })
            ->filter(fn ($p) => count($p['items']) > 0)
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id_pedido_detalle: int, producto: string|null, imagen: string|null, disponible: int}>
     */
    private function disponiblePorDetalle(int $pedidoId): array
    {
        $detalles = DB::table('pedido_detalle as pd')
            ->leftJoin('productos as pr', 'pr.id_producto', '=', 'pd.fk_producto')
            ->where('pd.fk_pedido', $pedidoId)
            ->select('pd.id_pedido_detalle', 'pd.cantidad', 'pr.nombre as producto', 'pr.imagen_principal as imagen')
            ->get();

        $yaSolicitado = DB::table('devolucion_detalle as dd')
            ->join('devoluciones as d', 'd.id_devolucion', '=', 'dd.fk_devolucion')
            ->where('d.fk_pedido', $pedidoId)
            ->where('d.estado', '!=', 'rechazada')
            ->select('dd.fk_pedido_detalle', DB::raw('SUM(dd.cantidad) as cantidad'))
            ->groupBy('dd.fk_pedido_detalle')
            ->pluck('cantidad', 'fk_pedido_detalle');

        $resultado = [];

        foreach ($detalles as $d) {
            $solicitado = (int) ($yaSolicitado[$d->id_pedido_detalle] ?? 0);

            $resultado[$d->id_pedido_detalle] = [
                'id_pedido_detalle' => $d->id_pedido_detalle,
                'producto' => $d->producto,
                'imagen' => $d->imagen,
                'disponible' => max(0, (int) $d->cantidad - $solicitado),
            ];
        }

        return $resultado;
    }
}
