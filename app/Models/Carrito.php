<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrito extends Model
{
    protected $table = 'carritos';

    protected $primaryKey = 'id_carrito';

    protected $fillable = [
        'fk_cliente',
        'token_invitado',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(CarritoDetalle::class, 'fk_carrito', 'id_carrito');
    }
}
