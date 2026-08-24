<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoServicio extends Model
{
    protected $table = 'tipos_servicio';
    protected $primaryKey = 'id_tipo_servicio';
    public $timestamps = false;

    protected $fillable = ['nombre'];
}