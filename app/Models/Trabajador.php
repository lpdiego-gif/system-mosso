<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trabajador extends Model
{
    protected $table = 'trabajadores';

    protected $primaryKey = 'id_trabajador';

    protected $fillable = ['fk_persona', 'fk_user', 'fk_rol', 'fk_direccion', 'fecha_ingreso', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_user');
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'fk_rol');
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'fk_persona');
    }
}
