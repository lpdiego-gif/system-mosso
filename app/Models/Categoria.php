<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $primaryKey = 'id_categoria';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'fk_id_animal',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(
            Animal::class,
            'fk_id_animal',
            'id_animal'
        );
    }

    public function subcategorias(): HasMany
    {
        return $this->hasMany(
            SubCategoria::class,
            'fk_id_categoria',
            'id_categoria'
        );
    }
}
