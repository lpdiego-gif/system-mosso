<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Caché de las páginas públicas de catálogo (home, /catalogo, /ofertas,
 * /catalogo/animal|categoria|subcategoria, /marcas). Todas listan productos
 * con el mismo `formato()` — reconsultar y rehidratar ~2000 modelos Eloquent
 * con sus relaciones en cada visita es el grueso del tiempo de esas páginas.
 *
 * Invalidación por contador de versión: `flush()` incrementa `catalogo:v` y
 * ese número entra en cada clave, así que las entradas viejas quedan
 * huérfanas y expiran solas por TTL sin tener que enumerarlas. Se llama desde
 * los puntos de escritura del admin (ProductoController, MarcaController). El
 * TTL corto es el respaldo para lo que no dispara flush (p. ej. un descuento
 * que entra en vigencia por fecha).
 */
class CatalogoCache
{
    private const VERSION_KEY = 'catalogo:v';

    /** Respaldo: si nada llama flush(), el catálogo público se refresca igual. */
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
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember("catalogo:{$key}:v".self::version(), self::TTL, $callback);
    }
}
