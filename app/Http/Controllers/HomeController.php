<?php

namespace App\Http\Controllers;

use App\Services\HomeService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(HomeService $home): Response
    {
        return Inertia::render('welcome', [
            'productosDestacados' => $home->productosDestacados(),
            'productosEnOferta' => $home->productosEnOferta(),
            'marcasDestacadas' => $home->marcasDestacadas(),
        ]);
    }
}