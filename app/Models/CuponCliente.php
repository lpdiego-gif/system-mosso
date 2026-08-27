<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CuponCliente extends Model
{
    protected $table = 'cupones';

    protected $primaryKey = 'id_cupon';

    public $timestamps = false;

    protected $fillable = [
        'codigo', 'fk_cliente', 'fk_mascota', 'origen', 'tipo', 'valor',
        'fecha_emision', 'fecha_vencimiento', 'usado',
    ];

    protected $casts = [
        'usado' => 'boolean',
        'valor' => 'float',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }
}
