<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnidadMedida extends Model
{
    protected $table = 'unidades_medida';

    protected $primaryKey = 'id_unidad_medida';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'abreviatura',
        'codigo_sunat',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(
            Producto::class,
            'fk_unidad_medida',
            'id_unidad_medida'
        );
    }
}
