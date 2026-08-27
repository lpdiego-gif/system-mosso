<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $primaryKey = 'id_producto';

    protected $fillable = [
        'sku', 'codigo_barras', 'nombre', 'descripcion', 'fk_marca', 'fk_unidad_medida',
        'fk_id_subcategorias', 'fk_etapa_vida', 'precio', 'stock', 'imagen_principal', 'fk_estado',
    ];

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'fk_marca', 'id_marca');
    }

    public function descuentoActivo()
    {
        return $this->hasOne(Descuento::class, 'fk_producto', 'id_producto')
            ->where('activo', true)
            ->where('fecha_inicio', '<=', now())
            ->where('fecha_fin', '>=', now())
            ->latest('id_descuento');
    }

    /**
     * Descuento unitario vigente (en soles) sobre el precio de lista. Misma
     * fórmula que usa OfertasController::formato() para la vitrina de ofertas.
     */
    public function descuentoUnitario(): float
    {
        $descuento = $this->relationLoaded('descuentoActivo')
            ? $this->getRelation('descuentoActivo')
            : $this->descuentoActivo()->first();

        if (! $descuento) {
            return 0.0;
        }

        $rebaja = $descuento->tipo === 'porcentaje'
            ? $this->precio * $descuento->valor / 100
            : (float) $descuento->valor;

        return round(min((float) $this->precio, max(0.0, $rebaja)), 2);
    }

    /**
     * Precio unitario final tras aplicar el descuento vigente.
     */
    public function precioFinal(): float
    {
        return round((float) $this->precio - $this->descuentoUnitario(), 2);
    }

    public function scopeActivos($query)
    {
        return $query->where('fk_estado', 1); // 1 = 'Activo' en estados_producto
    }
}
