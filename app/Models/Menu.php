<?php

namespace App\Models;

use App\Services\MenuService;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $primaryKey = 'id_menu';

    protected $fillable = [
        'nombre', 'tipo_enlace', 'fk_animal', 'fk_tipo_animal',
        'url', 'icono', 'orden', 'destacado', 'activo',
    ];

    protected $casts = [
        'destacado' => 'boolean',
        'activo' => 'boolean',
    ];

    protected static function booted(): void
    {
        // El mega menú se cachea (ver MenuService); cualquier cambio desde
        // /admin/menus debe reflejarse de inmediato.
        static::saved(fn () => MenuService::limpiarCache());
        static::deleted(fn () => MenuService::limpiarCache());
    }

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'fk_animal', 'id_animal');
    }

    public function tipoAnimal()
    {
        return $this->belongsTo(TipoAnimal::class, 'fk_tipo_animal', 'id_tipo_animal');
    }
}