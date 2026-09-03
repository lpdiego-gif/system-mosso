<?php

namespace App\Models;

use App\Services\ZonasEnvioService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Catálogo NACIONAL de distritos del Perú (~1891 filas, sembradas por
 * `UbigeoSeeder` desde `database/data/ubigeo.json`). No es un CRUD libre: los
 * distritos no se crean ni se borran desde la app, solo se activan/editan
 * como zona de reparto (ver DistritoController). `activo = 1` es lo único
 * que los hace seleccionables como envío en el checkout.
 */
class Distrito extends Model
{
    protected $table = 'distritos';

    protected $primaryKey = 'id_distrito';

    public $timestamps = false;

    protected $fillable = ['nombre', 'ubigeo', 'costo_envio', 'fk_provincia', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
        'costo_envio' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::saved(fn () => ZonasEnvioService::flush());
        static::deleted(fn () => ZonasEnvioService::flush());
    }

    public function provincia(): BelongsTo
    {
        return $this->belongsTo(Provincia::class, 'fk_provincia', 'id_provincia');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
