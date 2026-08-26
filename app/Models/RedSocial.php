<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RedSocial extends Model
{
    protected $table = 'redes_sociales';
    protected $primaryKey = 'id_red_social';
    public $timestamps = false;

    protected $fillable = ['nombre'];
}
