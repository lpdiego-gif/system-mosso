<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Persona extends Model
{
    protected $table = 'personas';

    protected $primaryKey = 'id_persona';

    protected $fillable = [
        'fk_tipo_documento', 'num_documento', 'nombres',
        'apellido_paterno', 'apellido_materno', 'telefono', 'fecha_nacimiento',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
    ];
}
