<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comprobante;
use App\Services\ComprobanteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Ventas": listado y detalle de comprobantes electrónicos ya emitidos. Solo
 * lectura + reenvío (el reenvío en sí vive en ComprobanteController, que
 * comparten cliente y admin). Fase actual: `estado_sunat` siempre
 * 'no_enviado' — cuando exista firma/envío real a SUNAT, este mismo panel
 * es donde irían las acciones de esa fase (columna y filtro ya contemplan
 * más estados que solo 'no_enviado').
 */
class VentaController extends Controller
{
    private const POR_PAGINA = [10, 25, 50, 100];

    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Ventas/Index', [
            'filtros' => $this->filtros($request),
            'opciones' => [
                'tipos' => DB::table('tipo_comprobante')->select('id_tipo_comprobante', 'nombre')->get(),
                'porPagina' => self::POR_PAGINA,
            ],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $f = $this->filtros($request);

        $query = DB::table('comprobantes as c')
            ->join('tipo_comprobante as tc', 'tc.id_tipo_comprobante', '=', 'c.fk_tipo_comprobante')
            ->join('pedidos as p', 'p.id_pedido', '=', 'c.fk_pedido')
            ->join('clientes as cl', 'cl.id_cliente', '=', 'p.fk_cliente')
            ->leftJoin('personas as per', 'per.id_persona', '=', 'cl.fk_persona')
            ->select([
                'c.id_comprobante', 'c.serie', 'c.numero', 'tc.id_tipo_comprobante', 'tc.nombre as tipo',
                'c.fecha_emision', 'c.total', 'c.estado_sunat', 'c.correo_enviado_en',
                'cl.correo as cliente_correo', 'cl.razon_social as cliente_razon_social',
                'per.num_documento', 'per.nombres', 'per.apellido_paterno', 'per.apellido_materno',
            ]);

        if ($f['tipo']) {
            $query->where('tc.id_tipo_comprobante', $f['tipo']);
        }

        if ($f['desde']) {
            $query->whereDate('c.fecha_emision', '>=', $f['desde']);
        }

        if ($f['hasta']) {
            $query->whereDate('c.fecha_emision', '<=', $f['hasta']);
        }

        if ($f['estado_sunat']) {
            $query->where('c.estado_sunat', $f['estado_sunat']);
        }

        if ($f['q']) {
            $like = '%'.$f['q'].'%';
            $query->where(function ($q) use ($like) {
                $q->where('c.serie', 'like', $like)
                    ->orWhere('c.numero', 'like', $like)
                    ->orWhere('cl.correo', 'like', $like)
                    ->orWhere('cl.razon_social', 'like', $like)
                    ->orWhere('per.nombres', 'like', $like)
                    ->orWhere('per.apellido_paterno', 'like', $like)
                    ->orWhere('per.apellido_materno', 'like', $like);
            });
        }

        $total = (clone $query)->count(DB::raw('DISTINCT c.id_comprobante'));

        $rows = $query
            ->orderByDesc('c.fecha_emision')
            ->forPage($f['page'], $f['perPage'])
            ->get()
            ->map(fn ($row) => $this->transformar($row))
            ->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $f['page'],
                'per_page' => $f['perPage'],
                'total' => $total,
                'last_page' => (int) max(1, ceil($total / $f['perPage'])),
            ],
        ]);
    }

    public function show(Comprobante $comprobante, ComprobanteService $comprobantes): Response
    {
        $comprobante->loadMissing('pedido.cliente');

        return Inertia::render('Admin/Ventas/Show', [
            'comprobante' => [
                'id' => $comprobante->id_comprobante,
                'pedido_id' => $comprobante->fk_pedido,
                'correo_enviado_en' => $comprobante->correo_enviado_en?->toISOString(),
                'cliente_correo' => $comprobante->pedido?->cliente?->correo,
                ...$comprobantes->datos($comprobante),
            ],
        ]);
    }

    /**
     * @return array{tipo: int|null, desde: string|null, hasta: string|null, estado_sunat: string|null, q: string|null, page: int, perPage: int}
     */
    private function filtros(Request $request): array
    {
        $perPage = $request->integer('perPage', 10);

        return [
            'tipo' => $request->integer('tipo') ?: null,
            'desde' => $request->string('desde')->toString() ?: null,
            'hasta' => $request->string('hasta')->toString() ?: null,
            'estado_sunat' => $request->string('estado_sunat')->toString() ?: null,
            'q' => trim((string) $request->string('q')) ?: null,
            'page' => max(1, $request->integer('page', 1)),
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(object $row): array
    {
        $nombre = trim((string) $row->nombres) !== ''
            ? trim("{$row->nombres} {$row->apellido_paterno} {$row->apellido_materno}")
            : ($row->cliente_razon_social ?: $row->cliente_correo);

        return [
            'id_comprobante' => $row->id_comprobante,
            'serie_numero' => "{$row->serie}-{$row->numero}",
            'tipo' => $row->tipo,
            'id_tipo_comprobante' => $row->id_tipo_comprobante,
            'fecha_emision' => $row->fecha_emision,
            'cliente' => $nombre,
            'documento' => $row->num_documento,
            'total' => (float) $row->total,
            'estado_sunat' => $row->estado_sunat,
            'correo_enviado_en' => $row->correo_enviado_en,
        ];
    }
}
