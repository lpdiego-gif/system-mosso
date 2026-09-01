<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reclamo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panel del Libro de Reclamaciones (Ley N° 29571): lista/gestiona lo que
 * los visitantes registran desde /libro-de-reclamaciones (formulario
 * público, sin login — ver ReclamoController raíz).
 */
class ReclamoController extends Controller
{
    private const ORDENABLES = ['fecha', 'estado'];

    private const POR_PAGINA = [10, 25, 50, 100];

    private const ESTADOS = ['pendiente', 'en_proceso', 'resuelto'];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $query = Reclamo::query()
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('id_reclamo', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereRaw(
                            "CONCAT_WS(' ', nombres, apellido_paterno, apellido_materno) LIKE ?",
                            ["%{$search}%"],
                        );
                });
            })
            ->when($filtros['estado'], fn ($q) => $q->where('estado', $filtros['estado']))
            ->when($filtros['tipo'], fn ($q) => $q->where('tipo_atencion', $filtros['tipo']));

        $sort = $filtros['sort'] === 'estado' ? 'estado' : 'created_at';
        $query->orderBy($sort, $filtros['dir'])->orderByDesc('id_reclamo');

        $reclamos = $query
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Reclamo $r) => [
                'id_reclamo' => $r->id_reclamo,
                'nombre' => trim("{$r->nombres} {$r->apellido_paterno} {$r->apellido_materno}"),
                'email' => $r->email,
                'tipo_atencion' => $r->tipo_atencion,
                'tipo_bien' => $r->tipo_bien,
                'estado' => $r->estado,
                'creado_en' => $r->created_at?->toISOString(),
            ]);

        return Inertia::render('Admin/Reclamos/Index', [
            'reclamos' => $reclamos,
            'filtros' => $filtros,
            'stats' => [
                'total' => Reclamo::count(),
                'pendientes' => Reclamo::where('estado', 'pendiente')->count(),
                'reclamos' => Reclamo::where('tipo_atencion', 'reclamo')->count(),
                'quejas' => Reclamo::where('tipo_atencion', 'queja')->count(),
            ],
            'opciones' => [
                'estados' => self::ESTADOS,
                'porPagina' => self::POR_PAGINA,
            ],
        ]);
    }

    public function show(Reclamo $reclamo): Response
    {
        return Inertia::render('Admin/Reclamos/Show', [
            'reclamo' => $reclamo,
            'opciones' => [
                'estados' => self::ESTADOS,
            ],
        ]);
    }

    public function actualizarEstado(Request $request, Reclamo $reclamo): RedirectResponse
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(self::ESTADOS)],
            'nota_admin' => ['nullable', 'string', 'max:2000'],
        ]);

        $reclamo->update([
            ...$data,
            'atendido_en' => $data['estado'] === 'resuelto' ? now() : $reclamo->atendido_en,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Reclamo actualizado.']);

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
            'tipo' => in_array($tipo, ['reclamo', 'queja'], true) ? $tipo : null,
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'fecha',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'desc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }
}
