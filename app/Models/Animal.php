<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Animal extends Model
{
    protected $table = 'animales';

    protected $primaryKey = 'id_animal';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    public function categorias(): HasMany
    {
        return $this->hasMany(
            Categoria::class,
            'fk_id_animal',
            'id_animal'
        );
    }

    public function productos(): HasMany
    {
        return $this->hasMany(
            Producto::class,
            'fk_id_animal',
            'id_animal'
        );
    }
}
