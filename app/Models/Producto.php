<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $primaryKey = 'id_producto';

    protected $fillable = [
        'sku', 'nombre', 'descripcion', 'fk_marca', 'fk_unidad_medida',
        'fk_id_subcategorias', 'precio', 'stock', 'imagen_principal', 'fk_estado',
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

    public function scopeActivos($query)
    {
        return $query->where('fk_estado', 1); // 1 = 'Activo' en estados_producto
    }
}