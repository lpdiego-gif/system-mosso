<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CuentaBancaria extends Model
{
    protected $table = 'cuentas_bancarias';

    protected $primaryKey = 'id_cuenta_bancaria';

    protected $fillable = [
        'fk_empresa', 'banco', 'moneda', 'tipo_cuenta',
        'numero_cuenta', 'cci', 'titular', 'activo', 'orden',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'fk_empresa', 'id_empresa');
    }

    public function scopeActivas($query)
    {
        return $query->where('activo', true)->orderBy('orden');
    }
}
