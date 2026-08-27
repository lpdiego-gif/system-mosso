<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $primaryKey = 'id_pedido';

    protected $fillable = [
        'fk_cliente', 'fk_direccion_envio', 'fk_tipo_entrega', 'fk_forma_pago',
        'fk_estado_pedido', 'subtotal', 'descuento_total', 'igv', 'total', 'fecha_pedido',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'descuento_total' => 'decimal:2',
        'igv' => 'decimal:2',
        'total' => 'decimal:2',
        'fecha_pedido' => 'datetime',
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(PedidoDetalle::class, 'fk_pedido', 'id_pedido');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }

    public function tipoEntrega(): BelongsTo
    {
        return $this->belongsTo(TipoEntrega::class, 'fk_tipo_entrega', 'id_tipo_entrega');
    }

    public function estadoPedido(): BelongsTo
    {
        return $this->belongsTo(EstadoPedido::class, 'fk_estado_pedido', 'id_estado_pedido');
    }

    public function formaPago(): BelongsTo
    {
        return $this->belongsTo(FormaPago::class, 'fk_forma_pago', 'id_forma_pago');
    }

    public function direccionEnvio(): BelongsTo
    {
        return $this->belongsTo(Direccion::class, 'fk_direccion_envio', 'id_direccion');
    }

    public function pago(): HasOne
    {
        return $this->hasOne(Pago::class, 'fk_pedido', 'id_pedido');
    }

    public function comprobante(): HasOne
    {
        return $this->hasOne(Comprobante::class, 'fk_pedido', 'id_pedido');
    }

    public function recojoTercero(): HasOne
    {
        return $this->hasOne(PedidoRecojoTercero::class, 'fk_pedido', 'id_pedido');
    }
}
