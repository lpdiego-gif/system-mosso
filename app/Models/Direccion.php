<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Direccion extends Model
{
    protected $table = 'direcciones';

    protected $primaryKey = 'id_direccion';

    public $timestamps = false;

    protected $fillable = ['direccion', 'referencia', 'fk_distrito'];

    public function distrito(): BelongsTo
    {
        return $this->belongsTo(Distrito::class, 'fk_distrito', 'id_distrito');
    }
}
