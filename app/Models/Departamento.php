<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    protected $table = 'departamentos';

    protected $primaryKey = 'id_departamento';

    public $timestamps = false;

    protected $fillable = ['nombre', 'ubigeo'];

    public function provincias(): HasMany
    {
        return $this->hasMany(Provincia::class, 'fk_departamento', 'id_departamento');
    }
}
