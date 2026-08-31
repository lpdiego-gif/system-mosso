<?php

namespace App\Http\Requests\Trabajador;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateTrabajadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('permiso', 'trabajadores.editar');
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'num_documento' => trim(strip_tags((string) $this->input('num_documento'))),
            'nombres' => trim(strip_tags((string) $this->input('nombres'))),
            'apellido_paterno' => trim(strip_tags((string) $this->input('apellido_paterno'))),
            'apellido_materno' => $this->filled('apellido_materno')
                ? trim(strip_tags((string) $this->input('apellido_materno')))
                : null,
            'telefono' => trim(strip_tags((string) $this->input('telefono'))),
            'email' => strtolower(trim((string) $this->input('email'))),
            'direccion' => $this->filled('direccion')
                ? trim(strip_tags((string) $this->input('direccion')))
                : null,
            'referencia' => $this->filled('referencia')
                ? trim(strip_tags((string) $this->input('referencia')))
                : null,
        ]);
    }

    public function rules(): array
    {
        // El id de ruta es la autoridad; nunca se confía en un id enviado por el cliente.
        $trabajador = DB::table('trabajadores')->where('id_trabajador', $this->route('trabajador'))->first();
        $userId = $trabajador->fk_user ?? null;

        return [
            'fk_tipo_documento' => ['required', 'integer', 'exists:tipo_documento,id_tipo_documento'],
            'num_documento' => ['required', 'string', 'min:8', 'max:20', 'regex:/^[A-Za-z0-9]+$/'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellido_paterno' => ['required', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'telefono' => ['required', 'string', 'max:20', 'regex:/^[0-9+\s-]{6,20}$/'],
            'fecha_nacimiento' => ['nullable', 'date', 'before:-18 years'],

            'direccion' => ['nullable', 'required_with:fk_distrito', 'string', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'fk_distrito' => ['nullable', 'required_with:direccion', 'integer', 'exists:distritos,id_distrito'],

            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'confirmed', Password::min(8)->mixedCase()->numbers()],

            'fk_rol' => ['required', 'integer', 'exists:roles,id_rol'],
            'fecha_ingreso' => ['required', 'date', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'num_documento.regex' => 'El número de documento solo puede contener letras y números.',
            'telefono.regex' => 'Ingresa un número de teléfono válido.',
            'fecha_nacimiento.before' => 'El trabajador debe ser mayor de edad.',
            'email.unique' => 'Ya existe una cuenta registrada con este correo.',
            'fecha_ingreso.before_or_equal' => 'La fecha de ingreso no puede ser futura.',
        ];
    }
}