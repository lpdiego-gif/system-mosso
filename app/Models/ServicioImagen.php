<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioImagen extends Model
{
    protected $table = 'servicio_imagenes';
    protected $primaryKey = 'id_servicio_imagen';
    public $timestamps = false;

    protected $fillable = ['fk_servicio', 'imagen', 'orden'];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'fk_servicio', 'id_servicio');
    }
}
