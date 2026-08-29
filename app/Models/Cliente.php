<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'fk_persona', 'fk_user', 'correo', 'razon_social', 'ruc',
    ];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'fk_persona', 'id_persona');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_user', 'id');
    }

    public function mascotas(): HasMany
    {
        return $this->hasMany(Mascota::class, 'fk_cliente', 'id_cliente');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'fk_cliente', 'id_cliente');
    }

    public function direcciones(): HasMany
    {
        return $this->hasMany(ClienteDireccion::class, 'fk_cliente', 'id_cliente');
    }

    public function puntos(): HasMany
    {
        return $this->hasMany(PuntoCliente::class, 'fk_cliente', 'id_cliente');
    }
}
