<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PuntoCliente extends Model
{
    protected $table = 'puntos_cliente';

    protected $primaryKey = 'id_punto';

    public $timestamps = false;

    protected $fillable = [
        'fk_cliente', 'fk_pedido', 'tipo', 'monto', 'fecha', 'fecha_vencimiento', 'descripcion',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }
}
