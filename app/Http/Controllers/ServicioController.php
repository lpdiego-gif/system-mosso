<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use App\Models\TipoServicio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ServicioController extends Controller
{
    public function index(): Response
    {
        return $this->renderListado(
            Servicio::activos()->with(['tipoServicio', 'imagenes'])->latest('created_at')->get(),
            'Servicios',
            null,
        );
    }

    public function porTipo(TipoServicio $tipo): Response
    {
        $servicios = Servicio::activos()
            ->with(['tipoServicio', 'imagenes'])
            ->where('fk_tipo_servicio', $tipo->id_tipo_servicio)
            ->latest('created_at')
            ->get();

        return $this->renderListado($servicios, $tipo->nombre, $tipo->nombre);
    }

    public function show(string $slug): Response
    {
        if (! preg_match('/(\d+)$/', $slug, $m)) {
            abort(HttpResponse::HTTP_NOT_FOUND);
        }

        $servicio = Servicio::activos()
            ->with(['tipoServicio', 'direccion', 'horarios', 'imagenes', 'beneficios', 'redes.red'])
            ->find((int) $m[1]);

        if (! $servicio) {
            abort(HttpResponse::HTTP_NOT_FOUND);
        }

        $distrito = $servicio->direccion
            ? DB::table('distritos')->where('id_distrito', $servicio->direccion->fk_distrito)->value('nombre')
            : null;

        $imagenes = $servicio->imagenes->map(fn ($img) => [
            'id' => $img->id_servicio_imagen,
            'url' => Storage::url($img->imagen),
            'orden' => $img->orden,
        ])->values();

        $horarios = $servicio->horarios
            ->sortBy(fn ($h) => $this->ordenDia($h->dia_semana))
            ->map(fn ($h) => [
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $this->horaAmigable($h->hora_inicio),
                'hora_fin' => $this->horaAmigable($h->hora_fin),
            ])->values();

        return Inertia::render('servicios/show', [
            'breadcrumbs' => [
                ['label' => 'Servicios', 'href' => '/servicios'],
                ['label' => $servicio->tipoServicio->nombre.' - '.$servicio->nombre_servicio, 'href' => null],
            ],
            'servicio' => [
                'id' => $servicio->id_servicio,
                'tipo' => $servicio->tipoServicio->nombre,
                'nombre_negocio' => $servicio->nombre_negocio,
                'nombre_servicio' => $servicio->nombre_servicio,
                'descripcion' => $servicio->descripcion,
                'responsable' => $servicio->responsable,
                'foto_responsable' => $servicio->foto_responsable ? Storage::url($servicio->foto_responsable) : null,
                'telefono_contacto' => $servicio->telefono_contacto,
                'correo_contacto' => $servicio->correo_contacto,
                'whatsapp_href' => $this->whatsappHref($servicio->telefono_contacto, $servicio->nombre_servicio),
                'direccion' => $servicio->direccion?->direccion,
                'distrito' => $distrito,
                'imagenes' => $imagenes,
                'horarios' => $horarios,
                'beneficios' => $servicio->beneficios->map(fn ($b) => [
                    'icono' => $b->icono,
                    'titulo' => $b->titulo,
                    'descripcion' => $b->descripcion,
                ])->values(),
                'redes' => $servicio->redes->map(fn ($r) => [
                    'red' => $r->red?->nombre,
                    'link' => $r->link,
                ])->filter(fn ($r) => $r['red'] !== null)->values(),
            ],
        ]);
    }

    private function renderListado($servicios, string $titulo, ?string $tipoActivo): Response
    {
        return Inertia::render('servicios/index', [
            'titulo' => $titulo,
            'tipos' => TipoServicio::orderBy('nombre')->get(['id_tipo_servicio', 'nombre']),
            'tipoActivo' => $tipoActivo,
            'servicios' => $servicios->map(fn (Servicio $s) => [
                'id' => $s->id_servicio,
                'tipo' => $s->tipoServicio->nombre,
                'nombre_negocio' => $s->nombre_negocio,
                'nombre_servicio' => $s->nombre_servicio,
                'descripcion' => $s->descripcion,
                'imagen' => optional($s->imagenes->first())->imagen
                    ? Storage::url($s->imagenes->first()->imagen)
                    : null,
                'href' => '/servicio/'.$s->slug,
            ])->values(),
        ]);
    }

    private function ordenDia(string $dia): int
    {
        $orden = ['Lunes' => 1, 'Martes' => 2, 'Miércoles' => 3, 'Miercoles' => 3, 'Jueves' => 4, 'Viernes' => 5, 'Sábado' => 6, 'Sabado' => 6, 'Domingo' => 7];

        return $orden[$dia] ?? 8;
    }

    private function horaAmigable(?string $hora): ?string
    {
        if (! $hora) {
            return null;
        }

        return \Illuminate\Support\Carbon::createFromFormat('H:i:s', $hora)->format('g:i a');
    }

    private function whatsappHref(?string $telefono, string $nombreServicio): ?string
    {
        if (! $telefono) {
            return null;
        }

        $digitos = preg_replace('/\D+/', '', $telefono);

        if ($digitos === '' || $digitos === null) {
            return null;
        }

        // Los teléfonos se registran en formato local (9 dígitos, Perú); anteponemos 51.
        if (strlen($digitos) === 9) {
            $digitos = '51'.$digitos;
        }

        $mensaje = rawurlencode("Hola, quisiera separar una cita para: {$nombreServicio}");

        return "https://wa.me/{$digitos}?text={$mensaje}";
    }
}
