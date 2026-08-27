<?php

namespace App\Http\Requests\Checkout;

use App\Models\Cliente;
use App\Services\CheckoutService;
use App\Services\CuentaService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class IniciarCheckoutRequest extends FormRequest
{
    private ?Cliente $cliente = null;

    private bool $datosCompletos = false;

    private bool $requiereDireccion = false;

    public function authorize(): bool
    {
        $clienteId = app(CuentaService::class)->clienteIdDe($this->user());

        if ($clienteId === null) {
            return false;
        }

        $this->cliente = Cliente::find($clienteId);
        $this->datosCompletos = $this->cliente
            ? app(CheckoutService::class)->datosCompletos($this->cliente)
            : false;

        $this->requiereDireccion = (bool) DB::table('tipo_entregas')
            ->where('id_tipo_entrega', $this->input('fk_tipo_entrega'))
            ->value('requiere_direccion');

        return true;
    }

    public function cliente(): Cliente
    {
        return $this->cliente;
    }

    /**
     * Los <select> del frontend envían strings; se normalizan a enteros y los
     * campos vacíos a null antes de validar, para que las reglas `integer` /
     * `exists` no fallen por el tipo y para no guardar cadenas vacías.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];

        foreach (['fk_tipo_documento', 'fk_tipo_entrega', 'fk_distrito', 'id_direccion', 'receptor_fk_tipo_documento'] as $campo) {
            if ($this->has($campo)) {
                $merge[$campo] = $this->filled($campo) && is_numeric($this->input($campo))
                    ? (int) $this->input($campo)
                    : null;
            }
        }

        foreach (['razon_social', 'ruc', 'num_documento', 'nombres', 'apellido_paterno', 'apellido_materno', 'telefono', 'direccion', 'referencia', 'alias', 'receptor_nombres', 'receptor_apellidos', 'receptor_num_documento', 'receptor_telefono'] as $campo) {
            if ($this->has($campo)) {
                $valor = is_string($this->input($campo)) ? trim($this->input($campo)) : $this->input($campo);
                $merge[$campo] = $valor === '' ? null : $valor;
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $esFactura = $this->input('comprobante') === 'factura';
        $dirNueva = $this->requiereDireccion && $this->input('direccion_modo') === 'nueva';
        $dirGuardada = $this->requiereDireccion && $this->input('direccion_modo') === 'guardada';
        $otraPersona = $this->input('receptor') === 'otra';
        $pideComprador = ! $this->datosCompletos;
        $clienteId = $this->cliente?->id_cliente;

        return [
            'comprobante' => ['required', Rule::in(['boleta', 'factura'])],
            'razon_social' => [Rule::requiredIf($esFactura), 'nullable', 'string', 'max:150'],
            'ruc' => [Rule::requiredIf($esFactura), 'nullable', 'string', 'regex:/^\d{11}$/'],

            // Datos del comprador: obligatorios sólo si el cliente aún no los tiene.
            'fk_tipo_documento' => [Rule::requiredIf($pideComprador), 'nullable', 'integer', Rule::exists('tipo_documento', 'id_tipo_documento')],
            'num_documento' => [Rule::requiredIf($pideComprador), 'nullable', 'string', 'max:20'],
            'nombres' => [Rule::requiredIf($pideComprador), 'nullable', 'string', 'max:100'],
            'apellido_paterno' => [Rule::requiredIf($pideComprador), 'nullable', 'string', 'max:100'],
            'apellido_materno' => ['nullable', 'string', 'max:100'],
            'telefono' => [Rule::requiredIf($pideComprador), 'nullable', 'string', 'max:20'],

            'fk_tipo_entrega' => ['required', 'integer', Rule::exists('tipo_entregas', 'id_tipo_entrega')],

            'direccion_modo' => [Rule::requiredIf($this->requiereDireccion), 'nullable', Rule::in(['guardada', 'nueva'])],

            // La dirección guardada debe pertenecer al cliente autenticado.
            'id_direccion' => [
                Rule::requiredIf($dirGuardada),
                'nullable',
                'integer',
                Rule::exists('cliente_direcciones', 'fk_direccion')
                    ->where('fk_cliente', $clienteId),
            ],

            'fk_distrito' => [Rule::requiredIf($dirNueva), 'nullable', 'integer', Rule::exists('distritos', 'id_distrito')],
            'direccion' => [Rule::requiredIf($dirNueva), 'nullable', 'string', 'max:150'],
            'referencia' => ['nullable', 'string', 'max:150'],
            'alias' => ['nullable', 'string', 'max:50'],

            'receptor' => ['required', Rule::in(['yo', 'otra'])],
            'receptor_nombres' => [Rule::requiredIf($otraPersona), 'nullable', 'string', 'max:100'],
            'receptor_apellidos' => [Rule::requiredIf($otraPersona), 'nullable', 'string', 'max:100'],
            'receptor_fk_tipo_documento' => [Rule::requiredIf($otraPersona), 'nullable', 'integer', Rule::exists('tipo_documento', 'id_tipo_documento')],
            'receptor_num_documento' => [Rule::requiredIf($otraPersona), 'nullable', 'string', 'max:20'],
            'receptor_telefono' => [Rule::requiredIf($otraPersona), 'nullable', 'string', 'max:20'],
        ];
    }

    public function attributes(): array
    {
        return [
            'fk_tipo_documento' => 'tipo de documento',
            'num_documento' => 'número de documento',
            'apellido_paterno' => 'apellido paterno',
            'apellido_materno' => 'apellido materno',
            'fk_tipo_entrega' => 'método de entrega',
            'direccion_modo' => 'dirección',
            'id_direccion' => 'dirección guardada',
            'fk_distrito' => 'distrito',
            'razon_social' => 'razón social',
            'receptor_nombres' => 'nombres de quien recibe',
            'receptor_apellidos' => 'apellidos de quien recibe',
            'receptor_fk_tipo_documento' => 'tipo de documento de quien recibe',
            'receptor_num_documento' => 'documento de quien recibe',
            'receptor_telefono' => 'teléfono de quien recibe',
        ];
    }

    public function messages(): array
    {
        return [
            'ruc.regex' => 'El RUC debe tener 11 dígitos numéricos.',
            'ruc.required' => 'El RUC es obligatorio para emitir una factura.',
            'razon_social.required' => 'La razón social es obligatoria para emitir una factura.',
            'fk_tipo_entrega.required' => 'Selecciona un método de entrega.',
            'direccion_modo.required' => 'Elige una dirección guardada o agrega una nueva.',
            'id_direccion.exists' => 'La dirección seleccionada no es válida.',
            'fk_distrito.required' => 'Debes seleccionar un distrito.',
            'direccion.required' => 'Ingresa la dirección de envío.',
            'receptor_nombres.required' => 'Ingresa el nombre de quien recibirá el pedido.',
            'receptor_num_documento.required' => 'Ingresa el documento de quien recibirá el pedido.',
            'receptor_telefono.required' => 'Ingresa el teléfono de quien recibirá el pedido.',
        ];
    }
}
