<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionDeliveryDistrito extends Model
{
    protected $table = 'configuracion_delivery_distritos';

    protected $primaryKey = 'id_configuracion_delivery_distrito';

    public $timestamps = false;

    protected $fillable = ['fk_configuracion_delivery', 'fk_distrito'];

    public function configuracion(): BelongsTo
    {
        return $this->belongsTo(
            ConfiguracionDelivery::class,
            'fk_configuracion_delivery',
            'id_configuracion_delivery'
        );
    }
}
