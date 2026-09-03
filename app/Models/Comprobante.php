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
        'serie', 'numero', 'fecha_emision', 'moneda',
        'op_gravadas', 'op_exoneradas', 'op_inafectas', 'descuento_global',
        'igv', 'total', 'total_letras', 'xml_path', 'hash', 'qr_data',
        'estado_sunat', 'observacion_sunat', 'correo_enviado_en',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'correo_enviado_en' => 'datetime',
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'fk_pedido', 'id_pedido');
    }

    public function tipoComprobante(): BelongsTo
    {
        return $this->belongsTo(TipoComprobante::class, 'fk_tipo_comprobante', 'id_tipo_comprobante');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'fk_empresa', 'id_empresa');
    }
}
