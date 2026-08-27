<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoDetalle extends Model
{
    protected $table = 'pedido_detalle';

    protected $primaryKey = 'id_pedido_detalle';

    public $timestamps = false;

    protected $fillable = [
        'fk_pedido', 'fk_producto', 'cantidad',
        'precio_unitario', 'descuento_unitario', 'subtotal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'descuento_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'fk_pedido', 'id_pedido');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'fk_producto', 'id_producto');
    }
}
