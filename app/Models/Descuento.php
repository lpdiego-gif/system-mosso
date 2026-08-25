<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Descuento extends Model
{
    protected $primaryKey = 'id_descuento';
    public $timestamps = false;

    protected $fillable = [
        'fk_producto', 'tipo', 'valor', 'fecha_inicio', 'fecha_fin', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'fk_producto', 'id_producto');
    }
}