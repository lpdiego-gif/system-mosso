<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Siembra las 5 secciones reales de "Mi Cuenta" con el orden y textos que ya
 * se muestran hoy en el dashboard. Idempotente: solo inserta las `clave` que
 * falten, nunca pisa lo que el admin ya haya editado.
 */
return new class extends Migration
{
    public function up(): void
    {
        $secciones = [
            [
                'clave' => 'pedidos',
                'nombre' => 'Mis pedidos',
                'descripcion' => 'Historial y estado de compras',
                'icono' => 'ClipboardList',
                'orden' => 10,
            ],
            [
                'clave' => 'direcciones',
                'nombre' => 'Direcciones',
                'descripcion' => 'Envíos y facturación',
                'icono' => 'MapPin',
                'orden' => 20,
            ],
            [
                'clave' => 'mascotas',
                'nombre' => 'Mis mascotas',
                'descripcion' => 'Perfiles y beneficios',
                'icono' => 'PawPrint',
                'orden' => 30,
            ],
            [
                'clave' => 'puntos_cupones',
                'nombre' => 'Puntos y cupones',
                'descripcion' => 'Saldo y descuentos',
                'icono' => 'Star',
                'orden' => 40,
            ],
            [
                'clave' => 'detalles',
                'nombre' => 'Detalles de la cuenta',
                'descripcion' => 'Datos personales y contraseña',
                'icono' => 'UserCircle',
                'orden' => 50,
            ],
        ];

        foreach ($secciones as $seccion) {
            $existe = DB::table('menu_cuenta')->where('clave', $seccion['clave'])->exists();

            if (! $existe) {
                DB::table('menu_cuenta')->insert(array_merge($seccion, [
                    'tipo' => 'seccion_interna',
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('menu_cuenta')->whereIn('clave', [
            'pedidos', 'direcciones', 'mascotas', 'puntos_cupones', 'detalles',
        ])->delete();
    }
};
