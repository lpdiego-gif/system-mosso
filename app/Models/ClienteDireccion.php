<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClienteDireccion extends Model
{
    protected $table = 'cliente_direcciones';

    protected $primaryKey = 'id_cliente_direccion';

    public $timestamps = false;

    protected $fillable = ['fk_cliente', 'fk_direccion', 'alias', 'es_principal'];

    protected $casts = ['es_principal' => 'boolean'];

    public function direccion(): BelongsTo
    {
        return $this->belongsTo(Direccion::class, 'fk_direccion', 'id_direccion');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }
}
