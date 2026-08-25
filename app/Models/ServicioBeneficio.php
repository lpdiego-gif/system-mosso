<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioBeneficio extends Model
{
    protected $table = 'servicio_beneficios';
    protected $primaryKey = 'id_servicio_beneficio';
    public $timestamps = false;

    protected $fillable = ['fk_servicio', 'icono', 'titulo', 'descripcion'];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'fk_servicio', 'id_servicio');
    }
}
