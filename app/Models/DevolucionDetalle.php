<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevolucionDetalle extends Model
{
    protected $table = 'devolucion_detalle';

    protected $primaryKey = 'id_devolucion_detalle';

    public $timestamps = false;

    protected $fillable = ['fk_devolucion', 'fk_pedido_detalle', 'cantidad'];

    public function devolucion(): BelongsTo
    {
        return $this->belongsTo(Devolucion::class, 'fk_devolucion', 'id_devolucion');
    }

    public function pedidoDetalle(): BelongsTo
    {
        return $this->belongsTo(PedidoDetalle::class, 'fk_pedido_detalle', 'id_pedido_detalle');
    }
}
