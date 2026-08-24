<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoProducto extends Model
{
    protected $table = 'estados_producto';

    protected $primaryKey = 'id_estado_producto';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(
            Producto::class,
            'fk_estado',
            'id_estado_producto'
        );
    }
}
