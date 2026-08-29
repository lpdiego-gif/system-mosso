<?php

namespace App\Http\Middleware;

use App\Models\Animal;
use App\Models\Categoria;
use App\Models\Menu;
use App\Models\SubCategoria;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloquea el catálogo público de un animal —y sus categorías/subcategorías—
 * si ese animal no tiene ningún ítem activo en el Menu Header (tabla
 * `menus`): ni como entrada propia (tipo_enlace='animal', ej. Perros/Gatos)
 * ni dentro de su grupo (tipo_enlace='tipo_animal', ej. Exóticos). Si no
 * está visible, redirige al inicio. Se aplica indicando de qué ruta viene
 * el parámetro (`menu.animal:animal`, `menu.animal:categoria`,
 * `menu.animal:subcategoria`).
 */
class EnsureMenuAnimalActivo
{
    public function handle(Request $request, Closure $next, string $tipoRuta): Response
    {
        $idAnimal = $this->resolverIdAnimal($request, $tipoRuta);

        if ($idAnimal === null || ! $this->animalVisible($idAnimal)) {
            return redirect('/');
        }

        return $next($request);
    }

    private function resolverIdAnimal(Request $request, string $tipoRuta): ?int
    {
        return match ($tipoRuta) {
            'animal' => $this->modeloDesde($request->route('animal'), Animal::class)?->id_animal,
            'categoria' => $this->modeloDesde($request->route('categoria'), Categoria::class)?->fk_id_animal,
            'subcategoria' => $this->modeloDesde($request->route('subcategoria'), SubCategoria::class)
                ?->categoria
                ?->fk_id_animal,
            default => null,
        };
    }

    /** @param class-string<Model> $clase */
    private function modeloDesde(mixed $valor, string $clase): ?Model
    {
        if ($valor instanceof $clase) {
            return $valor;
        }

        return $clase::find($valor);
    }

    private function animalVisible(int $idAnimal): bool
    {
        $activoDirecto = Menu::query()
            ->where('tipo_enlace', 'animal')
            ->where('fk_animal', $idAnimal)
            ->where('activo', true)
            ->exists();

        if ($activoDirecto) {
            return true;
        }

        $idTipoAnimal = Animal::whereKey($idAnimal)->value('id_tipo_animal');

        if (! $idTipoAnimal) {
            return false;
        }

        return Menu::query()
            ->where('tipo_enlace', 'tipo_animal')
            ->where('fk_tipo_animal', $idTipoAnimal)
            ->where('activo', true)
            ->exists();
    }
}
