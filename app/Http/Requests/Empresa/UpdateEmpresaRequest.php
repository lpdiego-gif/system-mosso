<?php

namespace App\Http\Requests\Empresa;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'ruc' => trim(strip_tags((string) $this->input('ruc'))),
            'razon_social' => trim(strip_tags((string) $this->input('razon_social'))),
            'nombre_comercial' => trim(strip_tags((string) $this->input('nombre_comercial'))),
            'correo' => strtolower(trim((string) $this->input('correo'))),
            'telefono' => trim(strip_tags((string) $this->input('telefono'))),
            'direccion' => trim(strip_tags((string) $this->input('direccion'))),
            'referencia' => $this->filled('referencia')
                ? trim(strip_tags((string) $this->input('referencia')))
                : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'ruc' => ['required', 'string', 'regex:/^\d{11}$/'],
            'razon_social' => ['required', 'string', 'max:150'],
            'nombre_comercial' => ['required', 'string', 'max:150'],
            'correo' => ['required', 'string', 'email', 'max:150'],
            'telefono' => ['required', 'string', 'max:20', 'regex:/^[0-9+\s-]{6,20}$/'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'eliminar_logo' => ['nullable', 'boolean'],

            'direccion' => ['required', 'string', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'fk_distrito' => ['required', 'integer', 'exists:distritos,id_distrito'],
        ];
    }

    public function messages(): array
    {
        return [
            'ruc.regex' => 'El RUC debe tener 11 dígitos numéricos.',
            'telefono.regex' => 'Ingresa un número de teléfono válido.',
            'fk_distrito.required' => 'Selecciona el distrito de la empresa.',
        ];
    }
}
