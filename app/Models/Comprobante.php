<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comprobante extends Model
{
    protected $table = 'comprobantes';

    protected $primaryKey = 'id_comprobante';

    public $timestamps = false;

    protected $fillable = [
        'fk_pedido', 'fk_tipo_comprobante', 'fk_empresa',
        'serie', 'numero', 'fecha_emision',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'fk_pedido', 'id_pedido');
    }

    public function tipoComprobante(): BelongsTo
    {
        return $this->belongsTo(TipoComprobante::class, 'fk_tipo_comprobante', 'id_tipo_comprobante');
    }
}
