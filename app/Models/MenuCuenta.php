<?php

namespace App\Models;

use App\Services\MenuCuentaService;
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

    protected static function booted(): void
    {
        // El menú de "Mi cuenta" se cachea (ver MenuCuentaService); cualquier
        // cambio desde /admin/menu-cuenta debe reflejarse de inmediato.
        static::saved(fn () => MenuCuentaService::limpiarCache());
        static::deleted(fn () => MenuCuentaService::limpiarCache());
    }
}
