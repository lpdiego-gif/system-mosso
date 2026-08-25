<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioRed extends Model
{
    protected $table = 'servicio_redes';
    protected $primaryKey = 'id_servicio_red';
    public $timestamps = false;

    protected $fillable = ['fk_servicio', 'fk_red', 'link'];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'fk_servicio', 'id_servicio');
    }

    public function red()
    {
        return $this->belongsTo(RedSocial::class, 'fk_red', 'id_red_social');
    }
}
