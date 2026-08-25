<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CodigoVerificacion extends Model
{
    protected $table = 'codigos_verificacion';

    protected $primaryKey = 'email';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'email', 'codigo', 'intentos', 'expira_en',
    ];

    protected $casts = [
        'expira_en' => 'datetime',
    ];
}
