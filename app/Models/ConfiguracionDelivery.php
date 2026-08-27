<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Configuración de "delivery gratis". La lógica de si aplica o no a un pedido
 * concreto vive en App\Services\DeliveryService, no aquí.
 */
class ConfiguracionDelivery extends Model
{
    protected $table = 'configuracion_delivery';

    protected $primaryKey = 'id_configuracion_delivery';

    protected $fillable = ['activo', 'monto_minimo', 'fecha_inicio', 'fecha_fin', 'descripcion'];

    protected $casts = [
        'activo' => 'boolean',
        'monto_minimo' => 'decimal:2',
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
    ];

    public function distritos(): HasMany
    {
        return $this->hasMany(
            ConfiguracionDeliveryDistrito::class,
            'fk_configuracion_delivery',
            'id_configuracion_delivery'
        );
    }
}
