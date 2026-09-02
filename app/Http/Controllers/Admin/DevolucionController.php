<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Devolucion;
use App\Models\EstadoPedido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administración de las solicitudes de "Cambios y devoluciones" que los
 * clientes registran desde el Portal Web.
 */
class DevolucionController extends Controller
{
    private const ORDENABLES = ['fecha', 'estado'];

    private const POR_PAGINA = [10, 25, 50, 100];

    private const ESTADOS = ['pendiente', 'en_revision', 'aprobada', 'rechazada', 'completada'];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $query = Devolucion::query()
            ->with(['cliente.persona'])
            ->withCount('detalles')
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('devoluciones.id_devolucion', 'like', "%{$search}%")
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
            ->when($filtros['estado'], fn ($q) => $q->where('estado', $filtros['estado']))
            ->when($filtros['tipo'], fn ($q) => $q->where('tipo', $filtros['tipo']));

        $sort = $filtros['sort'] === 'estado' ? 'estado' : 'created_at';
        $query->orderBy($sort, $filtros['dir'])->orderByDesc('id_devolucion');

        $devoluciones = $query
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Devolucion $d) => $this->transformar($d));

        return Inertia::render('Admin/Devoluciones/Index', [
            'devoluciones' => $devoluciones,
            'filtros' => $filtros,
            'stats' => [
                'total' => Devolucion::count(),
                'pendientes' => Devolucion::where('estado', 'pendiente')->count(),
                'aprobadas' => Devolucion::where('estado', 'aprobada')->count(),
                'completadas' => Devolucion::where('estado', 'completada')->count(),
            ],
            'opciones' => [
                'estados' => self::ESTADOS,
                'porPagina' => self::POR_PAGINA,
            ],
        ]);
    }

    public function show(Devolucion $devolucion): Response
    {
        $devolucion->load([
            'cliente.persona',
            'pedido',
            'detalles.pedidoDetalle.producto',
        ]);

        return Inertia::render('Admin/Devoluciones/Show', [
            'devolucion' => [
                'id_devolucion' => $devolucion->id_devolucion,
                'tipo' => $devolucion->tipo,
                'motivo' => $devolucion->motivo,
                'detalle' => $devolucion->detalle,
                'telefono_contacto' => $devolucion->telefono_contacto,
                'email_contacto' => $devolucion->email_contacto,
                'estado' => $devolucion->estado,
                'nota_admin' => $devolucion->nota_admin,
                'creado_en' => $devolucion->created_at?->toISOString(),
                'cliente' => [
                    'nombre' => $this->nombreCliente($devolucion),
                    'correo' => $devolucion->cliente?->correo,
                ],
                'pedido' => [
                    'id_pedido' => $devolucion->pedido?->id_pedido,
                    'total' => (float) $devolucion->pedido?->total,
                ],
            ],
            'items' => $devolucion->detalles->map(fn ($d) => [
                'producto' => $d->pedidoDetalle?->producto?->nombre,
                'imagen' => $d->pedidoDetalle?->producto?->imagen_principal,
                'cantidad' => $d->cantidad,
            ])->values(),
            'opciones' => [
                'estados' => self::ESTADOS,
            ],
        ]);
    }

    public function actualizarEstado(Request $request, Devolucion $devolucion): RedirectResponse
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(self::ESTADOS)],
            'nota_admin' => ['nullable', 'string', 'max:2000'],
        ]);

        $devolucion->update([
            ...$data,
            'atendido_en' => in_array($data['estado'], ['aprobada', 'rechazada', 'completada'], true)
                ? now()
                : $devolucion->atendido_en,
        ]);

        // Una devolución completa (no un cambio) marca el pedido como
        // "Devuelto" -- así el listado de Pedidos deja de mostrarlo como
        // "Entregado" para siempre una vez que el producto ya volvió.
        if ($devolucion->tipo === 'devolucion' && $data['estado'] === 'completada') {
            $idDevuelto = EstadoPedido::where('nombre', 'Devuelto')->value('id_estado_pedido');

            if ($idDevuelto) {
                $devolucion->pedido()->update(['fk_estado_pedido' => $idDevuelto]);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Solicitud actualizada.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function filtros(Request $request): array
    {
        $sort = (string) $request->string('sort');
        $dir = strtolower((string) $request->string('dir'));
        $perPage = $request->integer('perPage', 10);
        $estado = (string) $request->string('estado');
        $tipo = (string) $request->string('tipo');
        $search = trim((string) $request->string('search'));

        return [
            'search' => $search !== '' ? $search : null,
            'estado' => in_array($estado, self::ESTADOS, true) ? $estado : null,
            'tipo' => in_array($tipo, ['cambio', 'devolucion'], true) ? $tipo : null,
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'fecha',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'desc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(Devolucion $devolucion): array
    {
        return [
            'id_devolucion' => $devolucion->id_devolucion,
            'cliente' => $this->nombreCliente($devolucion),
            'fk_pedido' => $devolucion->fk_pedido,
            'tipo' => $devolucion->tipo,
            'motivo' => $devolucion->motivo,
            'estado' => $devolucion->estado,
            'items_count' => (int) $devolucion->detalles_count,
            'creado_en' => $devolucion->created_at?->toISOString(),
        ];
    }

    private function nombreCliente(Devolucion $devolucion): string
    {
        $persona = $devolucion->cliente?->persona;

        if ($persona) {
            return trim("{$persona->nombres} {$persona->apellido_paterno} {$persona->apellido_materno}");
        }

        return (string) strtok((string) $devolucion->cliente?->correo, '@');
    }
}
