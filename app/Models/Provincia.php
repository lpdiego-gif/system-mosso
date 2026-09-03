<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
    protected $table = 'provincias';

    protected $primaryKey = 'id_provincia';

    public $timestamps = false;

    protected $fillable = ['nombre', 'ubigeo', 'fk_departamento'];

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class, 'fk_departamento', 'id_departamento');
    }

    public function distritos(): HasMany
    {
        return $this->hasMany(Distrito::class, 'fk_provincia', 'id_provincia');
    }
}
