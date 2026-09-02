<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstadoPedido;
use App\Models\Pedido;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administración de pedidos hechos desde el Portal Web (checkout). De
 * lectura + cambio de estado únicamente: los pedidos los crea el cliente al
 * pagar, el admin no registra pedidos manualmente.
 */
class PedidoController extends Controller
{
    private const ORDENABLES = ['fecha', 'total', 'estado'];

    private const POR_PAGINA = [10, 25, 50, 100];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $query = Pedido::query()
            ->with(['cliente.persona', 'estadoPedido'])
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('pedidos.id_pedido', 'like', "%{$search}%")
                        ->orWhereHas('cliente', function ($cliente) use ($search) {
                            $cliente->where('correo', 'like', "%{$search}%")
                                ->orWhereHas('persona', function ($persona) use ($search) {
                                    $persona->whereRaw(
                                        "CONCAT_WS(' ', nombres, apellido_paterno, apellido_materno) LIKE ?",
                                        ["%{$search}%"],
                                    );
                                });
                        });
                });
            })
            ->when($filtros['estado'], fn ($q) => $q->where('fk_estado_pedido', $filtros['estado']));

        $this->ordenar($query, $filtros['sort'], $filtros['dir']);

        $pedidos = $query
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Pedido $pedido) => $this->transformar($pedido));

        return Inertia::render('Admin/Pedidos/Index', [
            'pedidos' => $pedidos,
            'filtros' => $filtros,
            'stats' => [
                'total' => Pedido::count(),
                'ventas_mes' => (float) Pedido::where('fecha_pedido', '>=', now()->startOfMonth())->sum('total'),
                'pendientes' => Pedido::whereHas('estadoPedido', fn ($q) => $q->where('nombre', 'Pendiente de pago'))->count(),
                'entregados' => Pedido::whereHas('estadoPedido', fn ($q) => $q->where('nombre', 'Entregado'))->count(),
            ],
            'opciones' => [
                'estados' => EstadoPedido::orderBy('id_estado_pedido')->get(['id_estado_pedido', 'nombre']),
                'porPagina' => self::POR_PAGINA,
            ],
        ]);
    }

    public function show(Pedido $pedido): Response
    {
        return Inertia::render('Admin/Pedidos/Show', [
            ...$this->detalleCompleto($pedido),
            'opciones' => [
                'estados' => EstadoPedido::orderBy('id_estado_pedido')->get(['id_estado_pedido', 'nombre']),
            ],
        ]);
    }

    /**
     * Detalle completo del pedido en JSON, para el Drawer de la tabla de
     * Pedidos (evita navegar a la página completa para una vista rápida).
     */
    public function detalle(Pedido $pedido): JsonResponse
    {
        return response()->json([
            ...$this->detalleCompleto($pedido),
            'opciones' => [
                'estados' => EstadoPedido::orderBy('id_estado_pedido')->get(['id_estado_pedido', 'nombre']),
            ],
        ]);
    }

    /**
     * Comprobante del pedido en PDF (mismo detalle que el Drawer/Show, con
     * los datos de la empresa emisora) para revisión o impresión rápida.
     */
    public function pdf(Pedido $pedido)
    {
        $empresa = DB::table('empresa as e')
            ->leftJoin('direcciones as d', 'd.id_direccion', '=', 'e.fk_direccion')
            ->leftJoin('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->select(['e.ruc', 'e.razon_social', 'e.nombre_comercial', 'e.logo', 'e.correo', 'e.telefono', 'd.direccion', 'dist.nombre as distrito'])
            ->first();

        $pdf = Pdf::loadView('pdf.pedido', [
            ...$this->detalleCompleto($pedido),
            'empresa' => $empresa,
            'generadoEl' => now()->format('d/m/Y H:i'),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream(sprintf('pedido-%s.pdf', str_pad((string) $pedido->id_pedido, 6, '0', STR_PAD_LEFT)));
    }

    public function actualizarEstado(Request $request, Pedido $pedido): RedirectResponse
    {
        $data = $request->validate([
            'fk_estado_pedido' => ['required', 'integer', Rule::exists('estados_pedido', 'id_estado_pedido')],
        ]);

        $pedido->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Estado del pedido actualizado.']);

        return back();
    }

    /**
     * @return array{search: string|null, estado: int|null, sort: string, dir: string, perPage: int}
     */
    private function filtros(Request $request): array
    {
        $sort = (string) $request->string('sort');
        $dir = strtolower((string) $request->string('dir'));
        $perPage = $request->integer('perPage', 10);
        $estado = $request->integer('estado') ?: null;
        $search = trim((string) $request->string('search'));

        return [
            'search' => $search !== '' ? $search : null,
            'estado' => $estado,
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'fecha',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'desc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    private function ordenar($query, string $sort, string $dir): void
    {
        match ($sort) {
            'total' => $query->orderBy('pedidos.total', $dir),
            'estado' => $query->orderBy(
                EstadoPedido::select('nombre')->whereColumn('estados_pedido.id_estado_pedido', 'pedidos.fk_estado_pedido'),
                $dir,
            ),
            default => $query->orderBy('pedidos.fecha_pedido', $dir),
        };

        $query->orderBy('pedidos.id_pedido', 'desc');
    }

    /**
     * Detalle completo de un pedido (cabecera + cliente + entrega + pago +
     * comprobante + ítems), compartido por show(), detalle() y pdf() para no
     * duplicar la forma del payload entre la página completa, el Drawer y el PDF.
     *
     * @return array{pedido: array<string, mixed>, detalles: array<int, array<string, mixed>>}
     */
    private function detalleCompleto(Pedido $pedido): array
    {
        $pedido->load([
            'cliente.persona',
            'cliente.user',
            'estadoPedido',
            'tipoEntrega',
            'formaPago',
            'direccionEnvio',
            'pago',
            'comprobante.tipoComprobante',
            'recojoTercero',
            'detalles.producto',
        ]);

        return [
            'pedido' => [
                'id_pedido' => $pedido->id_pedido,
                'estado' => $pedido->estadoPedido?->nombre,
                'fk_estado_pedido' => $pedido->fk_estado_pedido,
                'fecha_pedido' => $pedido->fecha_pedido?->toISOString(),
                'subtotal' => (float) $pedido->subtotal,
                'descuento_total' => (float) $pedido->descuento_total,
                'igv' => (float) $pedido->igv,
                'total' => (float) $pedido->total,
                'tipo_entrega' => $pedido->tipoEntrega?->nombre,
                'forma_pago' => $pedido->formaPago?->nombre,
                'cliente' => [
                    'id_cliente' => $pedido->cliente?->id_cliente,
                    'nombre' => $this->nombreCliente($pedido),
                    'correo' => $pedido->cliente?->correo,
                    'telefono' => $pedido->cliente?->persona?->telefono,
                    'documento' => $pedido->cliente?->persona
                        ? trim((string) $pedido->cliente->persona->num_documento)
                        : null,
                ],
                'direccion_envio' => $pedido->direccionEnvio ? [
                    'direccion' => $pedido->direccionEnvio->direccion,
                    'referencia' => $pedido->direccionEnvio->referencia,
                    'distrito' => DB::table('distritos')
                        ->where('id_distrito', $pedido->direccionEnvio->fk_distrito)
                        ->value('nombre'),
                ] : null,
                'recojo_tercero' => $pedido->recojoTercero ? [
                    'nombres' => trim("{$pedido->recojoTercero->nombres} {$pedido->recojoTercero->apellidos}"),
                    'documento' => $pedido->recojoTercero->num_documento,
                    'telefono' => $pedido->recojoTercero->telefono,
                ] : null,
                'pago' => $pedido->pago ? [
                    'estado' => $pedido->pago->estado,
                    'monto' => (float) $pedido->pago->monto,
                    'referencia' => $pedido->pago->referencia,
                    'fecha_pago' => $pedido->pago->fecha_pago?->toISOString(),
                ] : null,
                'comprobante' => $pedido->comprobante ? [
                    'tipo' => $pedido->comprobante->tipoComprobante?->nombre,
                    'serie' => $pedido->comprobante->serie,
                    'numero' => $pedido->comprobante->numero,
                    'fecha_emision' => $pedido->comprobante->fecha_emision?->toISOString(),
                ] : null,
            ],
            'detalles' => $pedido->detalles->map(fn ($d) => [
                'id_pedido_detalle' => $d->id_pedido_detalle,
                'producto' => $d->producto?->nombre,
                'imagen' => $d->producto?->imagen_principal,
                'cantidad' => $d->cantidad,
                'precio_unitario' => (float) $d->precio_unitario,
                'descuento_unitario' => (float) $d->descuento_unitario,
                'subtotal' => (float) $d->subtotal,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(Pedido $pedido): array
    {
        return [
            'id_pedido' => $pedido->id_pedido,
            'cliente' => $this->nombreCliente($pedido),
            'correo' => $pedido->cliente?->correo,
            'estado' => $pedido->estadoPedido?->nombre,
            'fk_estado_pedido' => $pedido->fk_estado_pedido,
            'total' => (float) $pedido->total,
            'fecha_pedido' => $pedido->fecha_pedido?->toISOString(),
        ];
    }

    private function nombreCliente(Pedido $pedido): string
    {
        $persona = $pedido->cliente?->persona;

        if ($persona) {
            return trim("{$persona->nombres} {$persona->apellido_paterno} {$persona->apellido_materno}");
        }

        return $pedido->cliente?->razon_social ?: (string) strtok((string) $pedido->cliente?->correo, '@');
    }
}
