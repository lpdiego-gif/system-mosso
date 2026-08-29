<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Persona;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Administración de clientes del Portal Web. Un cliente siempre tiene un
 * correo y (cuando lo crea el admin) una `persona` con sus datos; la cuenta
 * de acceso —fila en `users`— es opcional: el cliente de mostrador no
 * inicia sesión, y el que se autorregistra en la tienda ya la trae.
 */
class ClienteController extends Controller
{
    /** Columnas por las que se permite ordenar el listado. */
    private const ORDENABLES = ['nombre', 'correo', 'pedidos', 'creado'];

    /** Opciones de "items por página" ofrecidas en la UI. */
    private const POR_PAGINA = [10, 25, 50, 100];

    /** Segmentos rápidos del listado. */
    private const SEGMENTOS = ['todos', 'personas', 'empresas', 'con_cuenta', 'sin_cuenta'];

    /** @var array<int, string> */
    private array $tiposDocumento = [];

    public function index(Request $request): Response
    {
        $filtros = $this->filtros($request);

        $this->tiposDocumento = DB::table('tipo_documento')->pluck('nombre', 'id_tipo_documento')->all();

        $query = Cliente::query()
            ->with(['persona'])
            ->withCount(['mascotas', 'pedidos'])
            ->withSum('pedidos', 'total')
            ->when($filtros['search'], function ($query, string $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('clientes.correo', 'like', "%{$search}%")
                        ->orWhere('clientes.ruc', 'like', "%{$search}%")
                        ->orWhere('clientes.razon_social', 'like', "%{$search}%")
                        ->orWhereHas('persona', function ($persona) use ($search) {
                            $persona->where('nombres', 'like', "%{$search}%")
                                ->orWhere('apellido_paterno', 'like', "%{$search}%")
                                ->orWhere('apellido_materno', 'like', "%{$search}%")
                                ->orWhere('num_documento', 'like', "%{$search}%")
                                ->orWhereRaw(
                                    "CONCAT_WS(' ', nombres, apellido_paterno, apellido_materno) LIKE ?",
                                    ["%{$search}%"],
                                );
                        });
                });
            })
            ->when($filtros['segmento'] === 'personas', fn ($q) => $q->whereNull('clientes.ruc'))
            ->when($filtros['segmento'] === 'empresas', fn ($q) => $q->whereNotNull('clientes.ruc'))
            ->when($filtros['segmento'] === 'con_cuenta', fn ($q) => $q->whereNotNull('clientes.fk_user'))
            ->when($filtros['segmento'] === 'sin_cuenta', fn ($q) => $q->whereNull('clientes.fk_user'));

        $this->ordenar($query, $filtros['sort'], $filtros['dir']);

        $clientes = $query
            ->paginate($filtros['perPage'])
            ->withQueryString()
            ->through(fn (Cliente $cliente) => $this->transformar($cliente));

        return Inertia::render('Admin/Clientes/Index', [
            'clientes' => $clientes,
            'filtros' => $filtros,
            'stats' => [
                'total' => Cliente::count(),
                'con_cuenta' => Cliente::whereNotNull('fk_user')->count(),
                'empresas' => Cliente::whereNotNull('ruc')->count(),
                'nuevos_mes' => Cliente::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
            'opciones' => [
                'porPagina' => self::POR_PAGINA,
                'segmentos' => self::SEGMENTOS,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Clientes/Create', [
            'tiposDocumento' => $this->tiposDocumentoOpciones(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validar($request);

        if ($request->boolean('crear_cuenta')) {
            $request->validate([
                'correo' => [Rule::unique('users', 'email')],
            ], [], ['correo' => 'correo']);
        }

        try {
            DB::transaction(function () use ($request, $data) {
                $persona = Persona::create($this->datosPersona($data));

                $fkUser = null;

                if ($request->boolean('crear_cuenta')) {
                    $fkUser = $this->crearCuenta($data)->id;
                }

                Cliente::create([
                    'fk_persona' => $persona->id_persona,
                    'fk_user' => $fkUser,
                    'correo' => $data['correo'],
                    'razon_social' => $request->boolean('es_empresa') ? $data['razon_social'] : null,
                    'ruc' => $request->boolean('es_empresa') ? $data['ruc'] : null,
                ]);
            });
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => 'No se pudo registrar el cliente. Intenta nuevamente.'])->withInput();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente registrado correctamente.']);

        return redirect()->route('admin.clientes.index');
    }

    public function show(Cliente $cliente): Response
    {
        $cliente->load(['persona', 'user', 'mascotas.animal', 'direcciones.direccion']);

        $pedidos = $cliente->pedidos()
            ->with('estadoPedido:id_estado_pedido,nombre')
            ->orderByDesc('fecha_pedido')
            ->limit(8)
            ->get();

        $persona = $cliente->persona;
        $nombre = $this->nombreVisible($cliente);

        return Inertia::render('Admin/Clientes/Show', [
            'cliente' => [
                'id_cliente' => $cliente->id_cliente,
                'nombre' => $nombre,
                'iniciales' => $this->iniciales($nombre),
                'correo' => $cliente->correo,
                'telefono' => $persona?->telefono,
                'num_documento' => $persona?->num_documento,
                'tipo_documento' => $persona
                    ? DB::table('tipo_documento')->where('id_tipo_documento', $persona->fk_tipo_documento)->value('nombre')
                    : null,
                'fecha_nacimiento' => $persona?->fecha_nacimiento
                    ? $persona->fecha_nacimiento->toDateString()
                    : null,
                'razon_social' => $cliente->razon_social,
                'ruc' => $cliente->ruc,
                'es_empresa' => filled($cliente->ruc),
                'cuenta_email' => $cliente->user?->email,
                'cuenta_verificada' => (bool) $cliente->user?->email_verified_at,
                'sin_persona' => $persona === null,
                'creado_en' => $cliente->created_at?->toISOString(),
            ],
            'metricas' => [
                'pedidos' => $cliente->pedidos()->count(),
                'total_gastado' => (float) $cliente->pedidos()->sum('total'),
                'mascotas' => $cliente->mascotas()->count(),
                'puntos' => (int) $cliente->puntos()->sum('monto'),
                'direcciones' => $cliente->direcciones()->count(),
            ],
            'mascotas' => $cliente->mascotas->map(fn ($m) => [
                'id_mascota' => $m->id_mascota,
                'nombre' => $m->nombre,
                'animal' => $m->animal?->nombre,
                'fecha_nacimiento' => $m->fecha_nacimiento
                    ? $m->fecha_nacimiento->toDateString()
                    : null,
            ])->values(),
            'direcciones' => $cliente->direcciones->map(fn ($d) => [
                'id_cliente_direccion' => $d->id_cliente_direccion,
                'alias' => $d->alias,
                'es_principal' => $d->es_principal,
                'direccion' => $d->direccion?->direccion,
                'referencia' => $d->direccion?->referencia,
            ])->values(),
            'pedidos' => $pedidos->map(fn ($p) => [
                'id_pedido' => $p->id_pedido,
                'estado' => $p->estadoPedido?->nombre,
                'total' => (float) $p->total,
                'fecha' => $p->fecha_pedido?->toISOString(),
            ])->values(),
        ]);
    }

    public function edit(Cliente $cliente): Response
    {
        $cliente->load(['persona', 'user']);

        $persona = $cliente->persona;

        return Inertia::render('Admin/Clientes/Edit', [
            'tiposDocumento' => $this->tiposDocumentoOpciones(),
            'cliente' => [
                'id_cliente' => $cliente->id_cliente,
                'nombres' => $persona?->nombres ?? '',
                'apellido_paterno' => $persona?->apellido_paterno ?? '',
                'apellido_materno' => $persona?->apellido_materno ?? '',
                'fk_tipo_documento' => $persona ? (string) $persona->fk_tipo_documento : '',
                'num_documento' => $persona?->num_documento ?? '',
                'telefono' => $persona?->telefono ?? '',
                'fecha_nacimiento' => $persona?->fecha_nacimiento
                    ? $persona->fecha_nacimiento->toDateString()
                    : '',
                'correo' => $cliente->correo,
                'es_empresa' => filled($cliente->ruc),
                'razon_social' => $cliente->razon_social ?? '',
                'ruc' => $cliente->ruc ?? '',
                'tiene_cuenta' => filled($cliente->fk_user),
                'cuenta_email' => $cliente->user?->email,
            ],
        ]);
    }

    public function update(Request $request, Cliente $cliente): RedirectResponse
    {
        $data = $this->validar($request, $cliente);

        if ($cliente->fk_user) {
            $request->validate([
                'correo' => [Rule::unique('users', 'email')->ignore($cliente->fk_user)],
            ], [], ['correo' => 'correo']);
        } elseif ($request->boolean('crear_cuenta')) {
            $request->validate([
                'correo' => [Rule::unique('users', 'email')],
            ], [], ['correo' => 'correo']);
        }

        try {
            DB::transaction(function () use ($request, $data, $cliente) {
                $personaData = $this->datosPersona($data);

                if ($cliente->fk_persona) {
                    $cliente->persona->update($personaData);
                } else {
                    $cliente->fk_persona = Persona::create($personaData)->id_persona;
                }

                $cliente->correo = $data['correo'];
                $cliente->razon_social = $request->boolean('es_empresa') ? $data['razon_social'] : null;
                $cliente->ruc = $request->boolean('es_empresa') ? $data['ruc'] : null;

                if (! $cliente->fk_user && $request->boolean('crear_cuenta')) {
                    $cliente->fk_user = $this->crearCuenta($data)->id;
                } elseif ($cliente->fk_user) {
                    $cambios = [];

                    if ($cliente->user->email !== $data['correo']) {
                        $cambios['email'] = $data['correo'];
                    }

                    if (! empty($data['nueva_password'])) {
                        $cambios['password'] = $data['nueva_password'];
                    }

                    if ($cambios !== []) {
                        $cliente->user->update($cambios);
                    }
                }

                $cliente->save();
            });
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => 'No se pudo actualizar el cliente. Intenta nuevamente.'])->withInput();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente actualizado correctamente.']);

        return redirect()->route('admin.clientes.index');
    }

    public function destroy(Cliente $cliente): RedirectResponse
    {
        if ($cliente->pedidos()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el cliente tiene pedidos registrados.',
            ]);

            return back();
        }

        try {
            DB::transaction(function () use ($cliente) {
                $fkPersona = $cliente->fk_persona;
                $fkUser = $cliente->fk_user;

                // ON DELETE CASCADE en la BD limpia mascotas, direcciones y puntos.
                $cliente->delete();

                if ($fkPersona) {
                    Persona::where('id_persona', $fkPersona)->delete();
                }

                if ($fkUser) {
                    User::where('id', $fkUser)->delete();
                }
            });
        } catch (Throwable $e) {
            report($e);

            Inertia::flash('toast', ['type' => 'error', 'message' => 'No se pudo eliminar el cliente.']);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente eliminado correctamente.']);

        return redirect()->route('admin.clientes.index');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * @return array{search: string|null, segmento: string, sort: string, dir: string, perPage: int}
     */
    private function filtros(Request $request): array
    {
        $sort = (string) $request->string('sort');
        $dir = strtolower((string) $request->string('dir'));
        $perPage = $request->integer('perPage', 10);
        $segmento = (string) $request->string('segmento');
        $search = trim((string) $request->string('search'));

        return [
            'search' => $search !== '' ? $search : null,
            'segmento' => in_array($segmento, self::SEGMENTOS, true) ? $segmento : 'todos',
            'sort' => in_array($sort, self::ORDENABLES, true) ? $sort : 'creado',
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : 'desc',
            'perPage' => in_array($perPage, self::POR_PAGINA, true) ? $perPage : 10,
        ];
    }

    private function ordenar($query, string $sort, string $dir): void
    {
        match ($sort) {
            'correo' => $query->orderBy('clientes.correo', $dir),
            'pedidos' => $query->orderBy('pedidos_count', $dir),
            'nombre' => $query->orderBy(
                Persona::select('nombres')->whereColumn('personas.id_persona', 'clientes.fk_persona'),
                $dir,
            ),
            default => $query->orderBy('clientes.created_at', $dir),
        };

        $query->orderBy('clientes.id_cliente', 'desc');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformar(Cliente $cliente): array
    {
        $persona = $cliente->persona;
        $nombre = $this->nombreVisible($cliente);

        return [
            'id_cliente' => $cliente->id_cliente,
            'nombre' => $nombre,
            'iniciales' => $this->iniciales($nombre),
            'num_documento' => $persona?->num_documento,
            'tipo_documento' => $persona ? ($this->tiposDocumento[$persona->fk_tipo_documento] ?? null) : null,
            'correo' => $cliente->correo,
            'telefono' => $persona?->telefono,
            'razon_social' => $cliente->razon_social,
            'ruc' => $cliente->ruc,
            'es_empresa' => filled($cliente->ruc),
            'tiene_cuenta' => filled($cliente->fk_user),
            'mascotas_count' => (int) $cliente->mascotas_count,
            'pedidos_count' => (int) $cliente->pedidos_count,
            'total_gastado' => (float) ($cliente->pedidos_sum_total ?? 0),
            'creado_en' => $cliente->created_at?->toISOString(),
            'sin_persona' => $persona === null,
        ];
    }

    private function nombreVisible(Cliente $cliente): string
    {
        $persona = $cliente->persona;

        if ($persona) {
            return trim("{$persona->nombres} {$persona->apellido_paterno} {$persona->apellido_materno}");
        }

        return $cliente->razon_social ?: (string) strtok($cliente->correo, '@');
    }

    private function iniciales(string $nombre): string
    {
        $palabras = preg_split('/\s+/', trim($nombre)) ?: [];
        $palabras = array_values(array_filter($palabras));

        if ($palabras === []) {
            return '—';
        }

        $primera = mb_substr($palabras[0], 0, 1);
        $segunda = isset($palabras[1]) ? mb_substr($palabras[1], 0, 1) : '';

        return mb_strtoupper($primera.$segunda);
    }

    /**
     * @return list<array{id_tipo_documento: int, nombre: string}>
     */
    private function tiposDocumentoOpciones(): array
    {
        return DB::table('tipo_documento')
            ->orderBy('id_tipo_documento')
            ->get(['id_tipo_documento', 'nombre'])
            ->map(fn ($t) => ['id_tipo_documento' => (int) $t->id_tipo_documento, 'nombre' => $t->nombre])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function validar(Request $request, ?Cliente $cliente = null): array
    {
        $idPersona = $cliente?->fk_persona;
        $idCliente = $cliente?->id_cliente;
        $editaConCuenta = $cliente?->fk_user !== null;

        return $request->validate([
            'nombres' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'fk_tipo_documento' => ['required', 'integer', Rule::exists('tipo_documento', 'id_tipo_documento')],
            'num_documento' => [
                'required', 'string', 'max:20', 'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('personas', 'num_documento')->ignore($idPersona, 'id_persona'),
            ],
            'telefono' => ['required', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'fecha_nacimiento' => ['nullable', 'date', 'before:today'],

            'correo' => [
                'required', 'email', 'max:150',
                Rule::unique('clientes', 'correo')->ignore($idCliente, 'id_cliente'),
            ],

            'es_empresa' => ['boolean'],
            'razon_social' => ['nullable', 'required_if:es_empresa,true', 'string', 'max:150'],
            'ruc' => [
                'nullable', 'required_if:es_empresa,true', 'string', 'size:11', 'regex:/^[0-9]+$/',
                Rule::unique('clientes', 'ruc')->ignore($idCliente, 'id_cliente'),
            ],

            'crear_cuenta' => ['boolean'],
            'password' => [
                Rule::requiredIf(fn () => ! $editaConCuenta && $request->boolean('crear_cuenta')),
                'nullable', 'string', 'confirmed', Password::default(),
            ],
            'nueva_password' => ['nullable', 'string', 'confirmed', Password::default()],
        ], [
            'ruc.size' => 'El RUC debe tener 11 dígitos.',
            'razon_social.required_if' => 'La razón social es obligatoria para una empresa.',
            'ruc.required_if' => 'El RUC es obligatorio para una empresa.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function datosPersona(array $data): array
    {
        return [
            'fk_tipo_documento' => $data['fk_tipo_documento'],
            'num_documento' => $data['num_documento'],
            'nombres' => $data['nombres'],
            'apellido_paterno' => $data['apellido_paterno'],
            'apellido_materno' => ($data['apellido_materno'] ?? '') ?: null,
            'telefono' => $data['telefono'],
            'fecha_nacimiento' => ($data['fecha_nacimiento'] ?? '') ?: null,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function crearCuenta(array $data): User
    {
        $user = User::create([
            'name' => trim("{$data['nombres']} {$data['apellido_paterno']}"),
            'email' => $data['correo'],
            'password' => $data['password'],
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }
}
