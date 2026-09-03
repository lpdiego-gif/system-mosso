<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Árbol de zonas de envío para el checkout: SOLO la geografía con
 * `distritos.activo = 1` (departamento/provincia aparecen únicamente si
 * tienen al menos un distrito activo). Son pocas filas (~50-200 distritos
 * activos frente a ~1891 en el catálogo nacional), así que el árbol completo
 * es liviano y se cachea entero.
 *
 * Invalidación por contador de versión, mismo patrón que `CatalogoCache`.
 * `flush()` se llama desde `DistritoController` (que escribe con `DB::table`,
 * no dispara eventos de Eloquent) y desde los hooks `saved`/`deleted` del
 * modelo `Distrito` (por si algo lo edita vía Eloquent en el futuro).
 */
class ZonasEnvioService
{
    private const VERSION_KEY = 'zonas_envio:v';

    public const TTL = 300;

    public static function version(): int
    {
        return max(1, (int) Cache::get(self::VERSION_KEY, 1));
    }

    public static function flush(): void
    {
        if (Cache::increment(self::VERSION_KEY) === false) {
            Cache::forever(self::VERSION_KEY, self::version() + 1);
        }
    }

    /**
     * @return array<int, array{id_departamento: int, nombre: string, provincias: array<int, array{id_provincia: int, nombre: string, distritos: array<int, array{id_distrito: int, nombre: string, costo_envio: float}>}>}>
     */
    public static function arbol(): array
    {
        return Cache::remember(
            'zonas_envio:v'.self::version(),
            self::TTL,
            static function () {
                $filas = DB::table('distritos as d')
                    ->join('provincias as p', 'p.id_provincia', '=', 'd.fk_provincia')
                    ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
                    ->where('d.activo', true)
                    ->orderBy('dep.nombre')
                    ->orderBy('p.nombre')
                    ->orderBy('d.nombre')
                    ->select([
                        'dep.id_departamento', 'dep.nombre as departamento',
                        'p.id_provincia', 'p.nombre as provincia',
                        'd.id_distrito', 'd.nombre as distrito', 'd.costo_envio',
                    ])
                    ->get();

                $arbol = [];

                foreach ($filas as $fila) {
                    $arbol[$fila->id_departamento] ??= [
                        'id_departamento' => $fila->id_departamento,
                        'nombre' => $fila->departamento,
                        'provincias' => [],
                    ];

                    $arbol[$fila->id_departamento]['provincias'][$fila->id_provincia] ??= [
                        'id_provincia' => $fila->id_provincia,
                        'nombre' => $fila->provincia,
                        'distritos' => [],
                    ];

                    $arbol[$fila->id_departamento]['provincias'][$fila->id_provincia]['distritos'][] = [
                        'id_distrito' => $fila->id_distrito,
                        'nombre' => $fila->distrito,
                        'costo_envio' => (float) $fila->costo_envio,
                    ];
                }

                // array_values en cada nivel: las claves son id_departamento/id_provincia
                // (no secuenciales), y json_encode convertiría un array asociativo así
                // en un objeto JSON en vez de una lista. El round-trip json además
                // garantiza (gotcha de caché de Laravel 13, ver CatalogoCache) que sólo
                // se guarden arrays planos, nunca objetos.
                $plano = array_values(array_map(
                    static function (array $dep) {
                        $dep['provincias'] = array_values($dep['provincias']);

                        return $dep;
                    },
                    $arbol
                ));

                return json_decode(json_encode($plano, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);
            }
        );
    }
}
