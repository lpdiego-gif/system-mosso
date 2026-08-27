<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Datos de la persona que recibirá el pedido cuando no es el cliente que compra.
 * La tabla conserva su nombre histórico ("recojo") aunque ahora también se usa
 * para envíos a domicilio. Relación 1:1 con el pedido (fk_pedido es UNIQUE).
 */
class PedidoRecojoTercero extends Model
{
    protected $table = 'pedido_recojo_terceros';

    protected $primaryKey = 'id_pedido_recojo_tercero';

    // La tabla solo tiene created_at.
    const UPDATED_AT = null;

    protected $fillable = [
        'fk_pedido', 'fk_tipo_documento', 'num_documento',
        'nombres', 'apellidos', 'telefono',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'fk_pedido', 'id_pedido');
    }
}
