<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoComprobante extends Model
{
    protected $table = 'tipo_comprobante';

    protected $primaryKey = 'id_tipo_comprobante';

    public $timestamps = false;

    protected $fillable = ['nombre'];
}
