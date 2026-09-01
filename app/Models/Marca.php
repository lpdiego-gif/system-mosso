<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Marca extends Model
{
    protected $table = 'marcas';

    protected $primaryKey = 'id_marca';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(
            Producto::class,
            'fk_marca',
            'id_marca'
        );
    }

    /**
     * Nombres de archivo presentes en public/image/marcas, como set
     * (`['nike.png' => true, ...]`). Varias vistas (mega menú, /marcas, home)
     * validaban el logo con un `file_exists()` por marca — con ~140 marcas
     * eso son ~140 stat() y, montado el proyecto por bind mount en Docker
     * Windows, ~1 s solo en esos stat. Aquí se lee el directorio UNA vez y se
     * cachea. `logoValido()` reemplaza al `file_exists()` por marca.
     *
     * @return array<string, true>
     */
    public static function logosDisponibles(): array
    {
        return Cache::remember('marcas:logos-disponibles', 3600, function () {
            $dir = public_path('image/marcas');

            if (! is_dir($dir)) {
                return [];
            }

            return array_fill_keys(array_diff(scandir($dir) ?: [], ['.', '..']), true);
        });
    }

    public static function logoValido(?string $logo): bool
    {
        return $logo !== null && $logo !== '' && isset(self::logosDisponibles()[$logo]);
    }

    public static function olvidarLogos(): void
    {
        Cache::forget('marcas:logos-disponibles');
    }
}
