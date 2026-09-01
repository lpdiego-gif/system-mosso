<?php

namespace App\Http\Controllers;

use App\Models\Reclamo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReclamoController extends Controller
{
    /**
     * Muestra el formulario público del Libro de Reclamaciones.
     */
    public function create(): Response
    {
        return Inertia::render('libro-de-reclamaciones');
    }

    /**
     * Registra un nuevo reclamo/queja (Ley N° 29571, D.S. N° 011-2011-PCM).
     */
    public function store(Request $request): RedirectResponse
    {
        $esMenorEdad = $request->boolean('es_menor_edad');

        $data = $request->validate([
            'tipo_documento' => ['required', Rule::in(['DNI', 'CE', 'Pasaporte'])],
            'num_documento' => ['required', 'string', 'max:20'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'tipo_respuesta' => ['required', Rule::in(['correo_electronico'])],
            'direccion' => ['required', 'string', 'max:150'],
            'distrito' => ['required', 'string', 'max:100'],
            'telefono' => ['required', 'string', 'max:20'],

            'tienda_compra' => ['required', Rule::in(['fisica', 'online'])],
            'monto_reclamado' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            // MOSSO solo vende productos: el formulario ya no ofrece "servicio" como opción.
            'tipo_bien' => ['required', Rule::in(['producto'])],
            'descripcion_bien' => ['required', 'string', 'max:2000'],

            'tipo_atencion' => ['required', Rule::in(['reclamo', 'queja'])],
            'detalle' => ['required', 'string', 'max:4000'],
            'pedido' => ['required', 'string', 'max:2000'],

            'es_menor_edad' => ['nullable', 'boolean'],
            'apoderado_tipo_documento' => [Rule::requiredIf($esMenorEdad), 'nullable', Rule::in(['DNI', 'CE', 'Pasaporte'])],
            'apoderado_num_documento' => [Rule::requiredIf($esMenorEdad), 'nullable', 'string', 'max:20'],
            'apoderado_nombres' => [Rule::requiredIf($esMenorEdad), 'nullable', 'string', 'max:150'],
            'apoderado_apellidos' => [Rule::requiredIf($esMenorEdad), 'nullable', 'string', 'max:150'],
        ]);

        $data['es_menor_edad'] = $esMenorEdad;

        if (! $esMenorEdad) {
            $data['apoderado_tipo_documento'] = null;
            $data['apoderado_num_documento'] = null;
            $data['apoderado_nombres'] = null;
            $data['apoderado_apellidos'] = null;
        }

        $data['ip_address'] = $request->ip();

        $reclamo = Reclamo::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Tu reclamo N° {$reclamo->id_reclamo} fue registrado correctamente.",
        ]);

        Inertia::flash('reclamoRegistrado', [
            'id' => $reclamo->id_reclamo,
            'fecha' => $reclamo->created_at?->format('d/m/Y'),
            'tipo' => $reclamo->tipo_atencion,
        ]);

        return redirect()->route('reclamos.create');
    }
}
