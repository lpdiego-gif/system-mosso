<?php

namespace App\Http\Requests\Empresa;

use App\Rules\RucValido;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpdateEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La ruta ya está detrás de `permiso:empresa.editar`.
        return true;
    }

    public function prepareForValidation(): void
    {
        $website = $this->filled('website') ? trim(strip_tags((string) $this->input('website'))) : null;

        // Si el usuario escribió "mosso.pe" sin esquema, se asume https://.
        if ($website !== null && $website !== '' && ! Str::startsWith($website, ['http://', 'https://'])) {
            $website = 'https://'.$website;
        }

        $this->merge([
            'ruc' => preg_replace('/\D/', '', (string) $this->input('ruc')),
            'razon_social' => trim(strip_tags((string) $this->input('razon_social'))),
            'nombre_comercial' => trim(strip_tags((string) $this->input('nombre_comercial'))),
            'correo' => strtolower(trim((string) $this->input('correo'))),
            'telefono' => trim(strip_tags((string) $this->input('telefono'))),
            'celular' => $this->filled('celular')
                ? trim(strip_tags((string) $this->input('celular')))
                : null,
            'website' => $website,
            'direccion' => trim(strip_tags((string) $this->input('direccion'))),
            'referencia' => $this->filled('referencia')
                ? trim(strip_tags((string) $this->input('referencia')))
                : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'ruc' => ['required', 'string', new RucValido],
            'razon_social' => ['required', 'string', 'min:3', 'max:150'],
            'nombre_comercial' => ['required', 'string', 'min:2', 'max:150'],
            'correo' => ['required', 'string', 'email:rfc', 'max:150'],
            'telefono' => ['required', 'string', 'max:20', 'regex:/^[0-9+\s()-]{6,20}$/'],
            'celular' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s()-]{6,20}$/'],
            'website' => ['nullable', 'string', 'max:150', 'url:http,https'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=64,min_height=64'],
            'eliminar_logo' => ['nullable', 'boolean'],

            'direccion' => ['required', 'string', 'min:5', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'fk_distrito' => ['required', 'integer', 'exists:distritos,id_distrito'],
        ];
    }

    public function messages(): array
    {
        return [
            'telefono.regex' => 'Ingresa un número de teléfono válido (solo dígitos, espacios, +, - o paréntesis).',
            'celular.regex' => 'Ingresa un número de celular válido.',
            'website.url' => 'El sitio web debe ser una URL válida, por ejemplo https://mosso.pe.',
            'logo.dimensions' => 'El logo debe medir al menos 64×64 píxeles.',
            'fk_distrito.required' => 'Selecciona el distrito de la empresa.',
            'fk_distrito.exists' => 'El distrito seleccionado no es válido.',
            'razon_social.min' => 'La razón social es demasiado corta.',
            'direccion.min' => 'La dirección es demasiado corta.',
        ];
    }

    public function attributes(): array
    {
        return [
            'ruc' => 'RUC',
            'razon_social' => 'razón social',
            'nombre_comercial' => 'nombre comercial',
            'correo' => 'correo electrónico',
            'fk_distrito' => 'distrito',
        ];
    }
}
