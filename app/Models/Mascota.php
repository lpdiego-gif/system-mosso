<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mascota extends Model
{
    protected $table = 'mascotas';

    protected $primaryKey = 'id_mascota';

    protected $fillable = [
        'fk_cliente', 'nombre', 'fk_animal', 'fecha_nacimiento',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'fk_cliente', 'id_cliente');
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'fk_animal', 'id_animal');
    }
}
