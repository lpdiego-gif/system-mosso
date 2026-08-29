<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Funcion extends Model
{
    protected $table = 'funciones';

    protected $primaryKey = 'id_funcion';

    protected $fillable = ['clave', 'nombre', 'descripcion', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
    ];
}
