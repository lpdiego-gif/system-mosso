<?php

namespace App\Models;

use App\Services\FuncionService;
use App\Services\MenuCuentaService;
use App\Services\MenuService;
use Illuminate\Database\Eloquent\Model;

class Funcion extends Model
{
    protected $table = 'funciones';

    protected $primaryKey = 'id_funcion';

    protected $fillable = ['clave', 'nombre', 'descripcion', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected static function booted(): void
    {
        // El listado de feature flags se cachea (ver FuncionService, se
        // consulta en cada request); cualquier cambio desde /admin/funciones
        // debe reflejarse de inmediato. El mega menú y el menú de "Mi cuenta"
        // también dependen de estos flags (servicios/mascotas/puntos_cupones
        // como interruptor maestro), así que se limpian junto con él.
        static::saved(fn () => self::limpiarCaches());
        static::deleted(fn () => self::limpiarCaches());
    }

    private static function limpiarCaches(): void
    {
        FuncionService::limpiarCache();
        MenuService::limpiarCache();
        MenuCuentaService::limpiarCache();
    }
}
