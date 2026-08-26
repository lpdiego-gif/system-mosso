<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use App\Models\TipoServicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ServicioController extends Controller
{
    private const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    public function index(): Response
    {
        $servicios = Servicio::with(['tipoServicio', 'imagenes'])
            ->orderByDesc('id_servicio')
            ->get()
            ->map(fn (Servicio $s) => [
                'id_servicio' => $s->id_servicio,
                'nombre_negocio' => $s->nombre_negocio,
                'nombre_servicio' => $s->nombre_servicio,
                'tipo_servicio' => $s->tipoServicio->nombre,
                'activo' => $s->activo,
                'imagen' => optional($s->imagenes->first())->imagen
                    ? Storage::url($s->imagenes->first()->imagen)
                    : null,
            ]);

        return Inertia::render('Admin/Servicios/Index', [
            'servicios' => $servicios,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Servicios/Create', $this->datosFormulario());
    }

    public function edit(Servicio $servicio): Response
    {
        $servicio->load(['direccion', 'horarios', 'imagenes', 'beneficios', 'redes']);

        [$fkDepartamento, $fkProvincia] = $this->cadenaUbicacion($servicio->direccion?->fk_distrito);

        return Inertia::render('Admin/Servicios/Edit', [
            ...$this->datosFormulario(),
            'servicio' => [
                'id_servicio' => $servicio->id_servicio,
                'fk_tipo_servicio' => $servicio->fk_tipo_servicio,
                'nombre_negocio' => $servicio->nombre_negocio,
                'nombre_servicio' => $servicio->nombre_servicio,
                'responsable' => $servicio->responsable,
                'foto_responsable' => $servicio->foto_responsable ? Storage::url($servicio->foto_responsable) : null,
                'descripcion' => $servicio->descripcion,
                'telefono_contacto' => $servicio->telefono_contacto,
                'correo_contacto' => $servicio->correo_contacto,
                'activo' => $servicio->activo,
                'direccion' => $servicio->direccion?->direccion,
                'referencia' => $servicio->direccion?->referencia,
                'fk_departamento' => $fkDepartamento,
                'fk_provincia' => $fkProvincia,
                'fk_distrito' => $servicio->direccion?->fk_distrito,
                'horarios' => $servicio->horarios->map(fn ($h) => [
                    'dia_semana' => $h->dia_semana,
                    'hora_inicio' => substr($h->hora_inicio, 0, 5),
                    'hora_fin' => substr($h->hora_fin, 0, 5),
                ])->values(),
                'beneficios' => $servicio->beneficios->map(fn ($b) => [
                    'icono' => $b->icono,
                    'titulo' => $b->titulo,
                    'descripcion' => $b->descripcion,
                ])->values(),
                'redes' => $servicio->redes->map(fn ($r) => [
                    'fk_red' => $r->fk_red,
                    'link' => $r->link,
                ])->values(),
                'imagenes' => $servicio->imagenes->map(fn ($img) => [
                    'id_servicio_imagen' => $img->id_servicio_imagen,
                    'url' => Storage::url($img->imagen),
                    'orden' => $img->orden,
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validado($request);

        try {
            $servicio = DB::transaction(function () use ($request, $data) {
                $fkDireccion = $this->guardarDireccion($data);

                $fotoResponsable = $request->hasFile('foto_responsable')
                    ? $request->file('foto_responsable')->store('servicios/responsables', 'public')
                    : null;

                $servicio = Servicio::create([
                    'fk_tipo_servicio' => $data['fk_tipo_servicio'],
                    'nombre_negocio' => $data['nombre_negocio'],
                    'nombre_servicio' => $data['nombre_servicio'],
                    'responsable' => $data['responsable'] ?? null,
                    'foto_responsable' => $fotoResponsable,
                    'descripcion' => $data['descripcion'] ?? null,
                    'telefono_contacto' => $data['telefono_contacto'] ?? null,
                    'correo_contacto' => $data['correo_contacto'] ?? null,
                    'fk_direccion' => $fkDireccion,
                    'activo' => $data['activo'] ?? true,
                ]);

                $this->sincronizarHorarios($servicio, $data['horarios'] ?? []);
                $this->sincronizarBeneficios($servicio, $data['beneficios'] ?? []);
                $this->sincronizarRedes($servicio, $data['redes'] ?? []);
                $this->sincronizarImagenes($servicio, $request, [], []);

                return $servicio;
            });
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => 'No se pudo registrar el servicio. Intenta nuevamente.'])->withInput();
        }

        return redirect()->route('admin.servicios.index')->with('success', 'Servicio registrado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $data = $this->validado($request);

        $imagenesEliminar = array_map('intval', $data['imagenes_eliminar'] ?? []);

        try {
            DB::transaction(function () use ($request, $data, $servicio, $imagenesEliminar) {
                $fkDireccion = $this->guardarDireccion($data, $servicio->fk_direccion);

                $fotoResponsable = $servicio->foto_responsable;

                if ($request->boolean('eliminar_foto_responsable') && $fotoResponsable) {
                    Storage::disk('public')->delete($fotoResponsable);
                    $fotoResponsable = null;
                }

                if ($request->hasFile('foto_responsable')) {
                    if ($fotoResponsable) {
                        Storage::disk('public')->delete($fotoResponsable);
                    }
                    $fotoResponsable = $request->file('foto_responsable')->store('servicios/responsables', 'public');
                }

                $servicio->update([
                    'fk_tipo_servicio' => $data['fk_tipo_servicio'],
                    'nombre_negocio' => $data['nombre_negocio'],
                    'nombre_servicio' => $data['nombre_servicio'],
                    'responsable' => $data['responsable'] ?? null,
                    'foto_responsable' => $fotoResponsable,
                    'descripcion' => $data['descripcion'] ?? null,
                    'telefono_contacto' => $data['telefono_contacto'] ?? null,
                    'correo_contacto' => $data['correo_contacto'] ?? null,
                    'fk_direccion' => $fkDireccion,
                    'activo' => $data['activo'] ?? true,
                ]);

                $this->sincronizarHorarios($servicio, $data['horarios'] ?? []);
                $this->sincronizarBeneficios($servicio, $data['beneficios'] ?? []);
                $this->sincronizarRedes($servicio, $data['redes'] ?? []);
                $this->sincronizarImagenes($servicio, $request, $imagenesEliminar, $data['imagenes_existentes_orden'] ?? []);
            });
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => 'No se pudo actualizar el servicio. Intenta nuevamente.'])->withInput();
        }

        return redirect()->route('admin.servicios.index')->with('success', 'Servicio actualizado correctamente.');
    }

    public function destroy(Servicio $servicio)
    {
        try {
            DB::transaction(function () use ($servicio) {
                $servicio->load('imagenes');

                $archivos = $servicio->imagenes->pluck('imagen')->all();
                if ($servicio->foto_responsable) {
                    $archivos[] = $servicio->foto_responsable;
                }

                // ON DELETE CASCADE en la BD limpia horarios/imagenes/beneficios/redes.
                $servicio->delete();

                foreach ($archivos as $archivo) {
                    Storage::disk('public')->delete($archivo);
                }
            });
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors(['general' => 'No se pudo eliminar el servicio. Intenta nuevamente.']);
        }

        return redirect()->route('admin.servicios.index')->with('success', 'Servicio eliminado correctamente.');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function datosFormulario(): array
    {
        return [
            'tiposServicio' => TipoServicio::orderBy('nombre')->get(['id_tipo_servicio', 'nombre']),
            'redesSociales' => DB::table('redes_sociales')->orderBy('nombre')->get(['id_red_social', 'nombre']),
            'departamentos' => DB::table('departamentos')->select('id_departamento', 'nombre')->orderBy('nombre')->get(),
            'diasSemana' => self::DIAS_SEMANA,
        ];
    }

    private function cadenaUbicacion(?int $fkDistrito): array
    {
        if (! $fkDistrito) {
            return [null, null];
        }

        $fila = DB::table('distritos as d')
            ->join('provincias as p', 'p.id_provincia', '=', 'd.fk_provincia')
            ->where('d.id_distrito', $fkDistrito)
            ->select('p.id_provincia', 'p.fk_departamento')
            ->first();

        return $fila ? [$fila->fk_departamento, $fila->id_provincia] : [null, null];
    }

    private function validado(Request $request): array
    {
        // Los admins suelen escribir enlaces sin esquema (ej. "facebook.com/negocio").
        // Se antepone https:// antes de validar para no rechazar algo tan común en silencio.
        $redes = $request->input('redes', []);
        foreach ($redes as $i => $red) {
            $link = trim((string) ($red['link'] ?? ''));
            if ($link !== '' && ! preg_match('#^https?://#i', $link)) {
                $redes[$i]['link'] = "https://$link";
            }
        }
        $request->merge(['redes' => $redes]);

        return $request->validate([
            'fk_tipo_servicio' => ['required', 'integer', Rule::exists('tipos_servicio', 'id_tipo_servicio')],
            'nombre_negocio' => ['required', 'string', 'max:150'],
            'nombre_servicio' => ['required', 'string', 'max:150'],
            'responsable' => ['nullable', 'string', 'max:150'],
            'foto_responsable' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'eliminar_foto_responsable' => ['nullable', 'boolean'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'telefono_contacto' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'correo_contacto' => ['nullable', 'email', 'max:150'],
            'direccion' => ['nullable', 'required_with:fk_distrito', 'string', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'fk_distrito' => ['nullable', 'required_with:direccion', 'integer', Rule::exists('distritos', 'id_distrito')],
            'activo' => ['nullable', 'boolean'],

            'horarios' => ['nullable', 'array'],
            'horarios.*.dia_semana' => ['required', 'string', Rule::in(self::DIAS_SEMANA)],
            'horarios.*.hora_inicio' => ['required', 'date_format:H:i'],
            'horarios.*.hora_fin' => ['required', 'date_format:H:i', 'after:horarios.*.hora_inicio'],

            'beneficios' => ['nullable', 'array'],
            'beneficios.*.icono' => ['nullable', 'string', 'max:45'],
            'beneficios.*.titulo' => ['required', 'string', 'max:100'],
            'beneficios.*.descripcion' => ['nullable', 'string', 'max:255'],

            'redes' => ['nullable', 'array'],
            'redes.*.fk_red' => ['required', 'integer', Rule::exists('redes_sociales', 'id_red_social')],
            'redes.*.link' => ['required', 'string', 'max:255', 'url'],

            'imagenes_nuevas' => ['nullable', 'array'],
            'imagenes_nuevas.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'imagenes_eliminar' => ['nullable', 'array'],
            'imagenes_eliminar.*' => ['integer'],
            'imagenes_existentes_orden' => ['nullable', 'array'],
            'imagenes_existentes_orden.*' => ['integer'],
        ], [
            'horarios.*.hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio.',
            'redes.*.link.url' => 'El enlace debe ser una URL válida.',
        ]);
    }

    /**
     * Crea/actualiza/limpia la dirección del servicio. Si no se envía
     * dirección + distrito, el servicio queda sin dirección (fk_direccion
     * null), igual que hace TrabajadorController con sus trabajadores.
     */
    private function guardarDireccion(array $data, ?int $idDireccionActual = null): ?int
    {
        if (empty($data['direccion']) || empty($data['fk_distrito'])) {
            return null;
        }

        if ($idDireccionActual) {
            DB::table('direcciones')->where('id_direccion', $idDireccionActual)->update([
                'direccion' => $data['direccion'],
                'referencia' => $data['referencia'] ?? null,
                'fk_distrito' => $data['fk_distrito'],
            ]);

            return $idDireccionActual;
        }

        return DB::table('direcciones')->insertGetId([
            'direccion' => $data['direccion'],
            'referencia' => $data['referencia'] ?? null,
            'fk_distrito' => $data['fk_distrito'],
        ]);
    }

    private function sincronizarHorarios(Servicio $servicio, array $horarios): void
    {
        $servicio->horarios()->delete();

        if (empty($horarios)) {
            return;
        }

        $servicio->horarios()->createMany(array_map(fn ($h) => [
            'dia_semana' => $h['dia_semana'],
            'hora_inicio' => $h['hora_inicio'],
            'hora_fin' => $h['hora_fin'],
        ], $horarios));
    }

    private function sincronizarBeneficios(Servicio $servicio, array $beneficios): void
    {
        $servicio->beneficios()->delete();

        if (empty($beneficios)) {
            return;
        }

        $servicio->beneficios()->createMany(array_map(fn ($b) => [
            'icono' => $b['icono'] ?? null,
            'titulo' => $b['titulo'],
            'descripcion' => $b['descripcion'] ?? null,
        ], $beneficios));
    }

    private function sincronizarRedes(Servicio $servicio, array $redes): void
    {
        $servicio->redes()->delete();

        if (empty($redes)) {
            return;
        }

        $servicio->redes()->createMany(array_map(fn ($r) => [
            'fk_red' => $r['fk_red'],
            'link' => $r['link'],
        ], $redes));
    }

    /**
     * Elimina las imágenes marcadas, reordena las que quedan y agrega las
     * nuevas subidas, respetando el orden en que llegaron desde el formulario.
     */
    private function sincronizarImagenes(Servicio $servicio, Request $request, array $idsEliminar, array $ordenExistentesIds): void
    {
        if (! empty($idsEliminar)) {
            $aEliminar = $servicio->imagenes()->whereIn('id_servicio_imagen', $idsEliminar)->get();

            foreach ($aEliminar as $img) {
                Storage::disk('public')->delete($img->imagen);
                $img->delete();
            }
        }

        $orden = 1;

        if (! empty($ordenExistentesIds)) {
            foreach ($ordenExistentesIds as $idExistente) {
                $actualizado = $servicio->imagenes()->where('id_servicio_imagen', (int) $idExistente)->update(['orden' => $orden]);
                if ($actualizado) {
                    $orden++;
                }
            }
        } else {
            foreach ($servicio->imagenes()->orderBy('orden')->get() as $img) {
                $img->update(['orden' => $orden]);
                $orden++;
            }
        }

        foreach ($request->file('imagenes_nuevas', []) as $archivo) {
            $ruta = $archivo->store('servicios/imagenes', 'public');

            $servicio->imagenes()->create([
                'imagen' => $ruta,
                'orden' => $orden,
            ]);

            $orden++;
        }
    }
}
