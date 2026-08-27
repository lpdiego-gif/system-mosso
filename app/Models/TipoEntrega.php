<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoEntrega extends Model
{
    protected $table = 'tipo_entregas';

    protected $primaryKey = 'id_tipo_entrega';

    public $timestamps = false;

    protected $fillable = ['nombre', 'requiere_direccion'];

    protected $casts = ['requiere_direccion' => 'boolean'];
}
