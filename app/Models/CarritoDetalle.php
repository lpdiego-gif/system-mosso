<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarritoDetalle extends Model
{
    protected $table = 'carrito_detalle';

    protected $primaryKey = 'id_carrito_detalle';

    // La tabla solo tiene created_at, no updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'fk_carrito',
        'fk_producto',
        'cantidad',
        'precio_unitario',
    ];

    public function carrito(): BelongsTo
    {
        return $this->belongsTo(Carrito::class, 'fk_carrito', 'id_carrito');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'fk_producto', 'id_producto');
    }
}
