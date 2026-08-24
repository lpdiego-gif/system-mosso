<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubCategoria extends Model
{
    protected $table = 'sub_categorias';

    protected $primaryKey = 'id_subcategorias';

    public $timestamps = false;

    protected $fillable = [
        'nom_sub_categoria',
        'fk_id_categoria',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(
            Categoria::class,
            'fk_id_categoria',
            'id_categoria'
        );
    }

    public function productos(): HasMany
    {
        return $this->hasMany(
            Producto::class,
            'fk_id_subcategorias',
            'id_subcategorias'
        );
    }
}
