<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * `EmpresaController` sigue usando `DB::table` para su CRUD (registro único,
 * upsert manual con transacción de dirección + logo). Este modelo existe solo
 * para lo que sí necesita Eloquent: la relación con `cuentas_bancarias` y
 * su uso como emisor en `ComprobanteService`.
 */
class Empresa extends Model
{
    protected $table = 'empresa';

    protected $primaryKey = 'id_empresa';

    public $timestamps = false;

    protected $fillable = [
        'ruc', 'razon_social', 'nombre_comercial', 'logo',
        'correo', 'telefono', 'celular', 'website', 'fk_direccion',
    ];

    public function direccion(): BelongsTo
    {
        return $this->belongsTo(Direccion::class, 'fk_direccion', 'id_direccion');
    }

    public function cuentasBancarias(): HasMany
    {
        return $this->hasMany(CuentaBancaria::class, 'fk_empresa', 'id_empresa');
    }
}
