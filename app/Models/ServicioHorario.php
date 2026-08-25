<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioHorario extends Model
{
    protected $table = 'servicio_horarios';
    protected $primaryKey = 'id_servicio_horario';
    public $timestamps = false;

    protected $fillable = ['fk_servicio', 'dia_semana', 'hora_inicio', 'hora_fin'];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'fk_servicio', 'id_servicio');
    }
}
