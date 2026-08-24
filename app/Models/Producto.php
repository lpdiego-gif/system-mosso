<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';

    protected $primaryKey = 'id_producto';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'sku',
        'nombre',
        'descripcion',
        'fk_marca',
        'fk_unidad_medida',
        'fk_id_subcategorias',
        'precio',
        'stock',
        'imagen_principal',
        'fk_estado',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'stock' => 'integer',
        'fk_marca' => 'integer',
        'fk_unidad_medida' => 'integer',
        'fk_id_subcategorias' => 'integer',
        'fk_estado' => 'integer',
    ];
}