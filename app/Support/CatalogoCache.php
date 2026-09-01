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
     * El callback normalmente devuelve Collections (de `->map()`, `->get()`).
     * `config/cache.php` tiene `serializable_classes => false` (default de
     * Laravel 13, defensa contra gadget chains si se filtra el APP_KEY), así
     * que la caché NO deserializa objetos: una Collection cacheada vuelve como
     * `__PHP_Incomplete_Class` y el frontend revienta con "a.map is not a
     * function". El round-trip por JSON garantiza que solo se guarden arrays
     * planos; corre una vez por miss (~5 min).
     *
     * @return array<mixed>
     */
    public static function remember(string $key, Closure $callback): array
    {
        return Cache::remember(
            "catalogo:{$key}:v".self::version(),
            self::TTL,
            static fn () => json_decode(json_encode($callback(), JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR),
        );
    }
}
