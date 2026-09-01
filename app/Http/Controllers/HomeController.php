<?php

namespace App\Http\Controllers;

use App\Services\HomeService;
use App\Support\CatalogoCache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(HomeService $home): Response
    {
        // El home reconsultaba y rehidrataba ~36 productos con relaciones +
        // ~140 marcas en cada visita. Se cachea el payload ya transformado;
        // se invalida al editar productos/marcas (ver CatalogoCache::flush()).
        $datos = CatalogoCache::remember('home', fn () => [
            'productosDestacados' => $home->productosDestacados(),
            'productosEnOferta' => $home->productosEnOferta(),
            'marcasDestacadas' => $home->marcasDestacadas(),
        ]);

        return Inertia::render('welcome', $datos);
    }
}
