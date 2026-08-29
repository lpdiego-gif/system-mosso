<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Primeros 3 módulos a controlar por fases, todos apagados por defecto
 * (`activo=false`) hasta que se pida habilitarlos. Idempotente: solo
 * inserta las `clave` que falten.
 */
return new class extends Migration
{
    public function up(): void
    {
        $funciones = [
            [
                'clave' => 'puntos_cupones',
                'nombre' => 'Puntos y cupones',
                'descripcion' => 'Sistema de fidelización: acumulación de puntos y cupones de descuento',
            ],
            [
                'clave' => 'mascotas',
                'nombre' => 'Mis mascotas',
                'descripcion' => 'Registro de mascotas del cliente y beneficios asociados',
            ],
            [
                'clave' => 'servicios',
                'nombre' => 'Servicios (veterinaria/peluquería)',
                'descripcion' => 'Catálogo y páginas públicas de servicios',
            ],
        ];

        foreach ($funciones as $funcion) {
            $existe = DB::table('funciones')->where('clave', $funcion['clave'])->exists();

            if (! $existe) {
                DB::table('funciones')->insert(array_merge($funcion, [
                    'activo' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('funciones')->whereIn('clave', [
            'puntos_cupones', 'mascotas', 'servicios',
        ])->delete();
    }
};
