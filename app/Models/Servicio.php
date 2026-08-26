<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    protected $table = 'servicios';
    protected $primaryKey = 'id_servicio';

    protected $fillable = [
        'fk_tipo_servicio',
        'nombre_negocio',
        'nombre_servicio',
        'responsable',
        'foto_responsable',
        'descripcion',
        'telefono_contacto',
        'correo_contacto',
        'fk_direccion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tipoServicio()
    {
        return $this->belongsTo(TipoServicio::class, 'fk_tipo_servicio', 'id_tipo_servicio');
    }

    public function direccion()
    {
        return $this->belongsTo(Direccion::class, 'fk_direccion', 'id_direccion');
    }

    public function horarios()
    {
        return $this->hasMany(ServicioHorario::class, 'fk_servicio', 'id_servicio');
    }

    public function imagenes()
    {
        return $this->hasMany(ServicioImagen::class, 'fk_servicio', 'id_servicio')->orderBy('orden');
    }

    public function beneficios()
    {
        return $this->hasMany(ServicioBeneficio::class, 'fk_servicio', 'id_servicio');
    }

    public function redes()
    {
        return $this->hasMany(ServicioRed::class, 'fk_servicio', 'id_servicio');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Slug amigable para la URL pública del detalle (/servicio/{slug}).
     * No existe columna `slug` en la tabla: se genera en runtime a partir del
     * nombre y se le agrega el id al final para poder resolverlo de vuelta
     * sin ambigüedad aunque dos servicios tengan nombres parecidos.
     */
    public function getSlugAttribute(): string
    {
        $base = \Illuminate\Support\Str::slug($this->nombre_negocio.' '.$this->nombre_servicio);

        return trim($base.'-'.$this->id_servicio, '-');
    }
}
