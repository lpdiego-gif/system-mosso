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

    public function subcategoria()
    {
        return $this->belongsTo(SubCategoria::class, 'fk_id_subcategorias', 'id_subcategorias');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'fk_marca', 'id_marca');
    }

    public function unidadMedida()
    {
        return $this->belongsTo(UnidadMedida::class, 'fk_unidad_medida', 'id_unidad_medida');
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

    /**
     * Código de unidad de medida del Catálogo N°03 de SUNAT (UN/ECE Rec. 20),
     * para el futuro generador de XML de comprobantes — preparación de datos
     * únicamente, todavía no hay nada de facturación electrónica implementado.
     * 'NIU' (unidad genérica) es el fallback a nivel app cuando la unidad no
     * tiene `codigo_sunat` cargado o el producto no tiene unidad asignada.
     * Los SERVICIOS (no productos físicos) van con 'ZZ' — eso lo resuelve el
     * generador de XML por tipo de ítem, no esta tabla.
     */
    public function codigoUnidadSunat(): string
    {
        $unidad = $this->relationLoaded('unidadMedida')
            ? $this->getRelation('unidadMedida')
            : $this->unidadMedida()->first();

        return $unidad?->codigo_sunat ?? 'NIU';
    }

    public function scopeActivos($query)
    {
        return $query->where('fk_estado', 1); // 1 = 'Activo' en estados_producto
    }

    public static function urlImagen(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $encoded = implode('/', array_map('rawurlencode', explode('/', $path)));

        if (str_starts_with($path, 'productos/')) {
            return "/storage/{$encoded}";
        }

        return "/image/Productos/{$encoded}";
    }
}
