<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reclamo extends Model
{
    protected $table = 'reclamos';

    protected $primaryKey = 'id_reclamo';

    protected $fillable = [
        'tipo_documento', 'num_documento', 'nombres', 'apellido_paterno', 'apellido_materno',
        'email', 'tipo_respuesta', 'direccion', 'distrito', 'telefono',
        'tienda_compra', 'monto_reclamado', 'tipo_bien', 'descripcion_bien',
        'tipo_atencion', 'detalle', 'pedido',
        'es_menor_edad', 'apoderado_tipo_documento', 'apoderado_num_documento',
        'apoderado_nombres', 'apoderado_apellidos',
        'ip_address',
        'estado', 'nota_admin', 'atendido_en',
    ];

    protected $casts = [
        'es_menor_edad' => 'boolean',
        'monto_reclamado' => 'decimal:2',
        'atendido_en' => 'datetime',
    ];
}
