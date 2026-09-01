<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Devolucion extends Model
{
    protected $table = 'devoluciones';

    protected $primaryKey = 'id_devolucion';

    protected $fillable = [
        'fk_cliente', 'fk_pedido', 'tipo', 'motivo', 'detalle',
        'telefono_contacto', 'email_contacto',
        'estado', 'nota_admin', 'atendido_en',
    ];

    protected $casts = [
        'atendido_en' => 'datetime',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'fk_pedido', 'id_pedido');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DevolucionDetalle::class, 'fk_devolucion', 'id_devolucion');
    }
}
