<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'fk_persona', 'fk_user', 'correo',
    ];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'fk_persona', 'id_persona');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_user', 'id');
    }
}
