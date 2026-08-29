<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuCuenta extends Model
{
    protected $table = 'menu_cuenta';

    protected $primaryKey = 'id_menu_cuenta';

    protected $fillable = [
        'tipo', 'clave', 'nombre', 'descripcion', 'icono', 'url', 'orden', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];
}
