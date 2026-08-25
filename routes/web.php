<?php

use App\Http\Controllers\Admin\AnimalController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\ProductoController;
use App\Http\Controllers\Admin\SubCategoriaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BusquedaController;

use App\Http\Controllers\HomeController;

Route::get('/', HomeController::class)->name('home');

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

/*
    |--------------------------------------------------------------------------
    | BUSCADOR
    |--------------------------------------------------------------------------
    */

Route::get('/buscar', BusquedaController::class)->name('buscar');

    /*
    |--------------------------------------------------------------------------
    | Productos
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/productos',
        [ProductoController::class, 'index']
    )->name('productos.index');

    Route::get(
        '/productos/create',
        [ProductoController::class, 'create']
    )->name('productos.create');

    Route::post(
        '/productos',
        [ProductoController::class, 'store']
    )->name('productos.store');

    /*
    |--------------------------------------------------------------------------
    | Dependencias
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/productos/categorias/{animal}',
        [ProductoController::class, 'categorias']
    )->name('productos.categorias');

    Route::get(
        '/productos/subcategorias/{categoria}',
        [ProductoController::class, 'subcategorias']
    )->name('productos.subcategorias');

    /*
    |--------------------------------------------------------------------------
    | Catálogos rápidos
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/animales',
        [AnimalController::class, 'store']
    )->name('animales.store');

    Route::post(
        '/categorias',
        [CategoriaController::class, 'store']
    )->name('categorias.store');

    Route::post(
        '/subcategorias',
        [SubCategoriaController::class, 'store']
    )->name('subcategorias.store');

    Route::post(
        '/marcas',
        [MarcaController::class, 'store']
    )->name('marcas.store');
});

use App\Http\Controllers\DashboardController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

});


use App\Http\Controllers\TrabajadorController;
Route::middleware(['auth'])->prefix('trabajador')->name('trabajador.')->group(function () {
    Route::get('/', [TrabajadorController::class, 'index'])->name('index');
    Route::get('/data', [TrabajadorController::class, 'data'])->name('data');
    Route::post('/buscar-documento', [TrabajadorController::class, 'buscarDocumento'])->name('buscar-documento');
    Route::get('/provincias/{departamento}', [TrabajadorController::class, 'provincias'])->whereNumber('departamento')->name('provincias');
    Route::get('/distritos/{provincia}', [TrabajadorController::class, 'distritos'])->whereNumber('provincia')->name('distritos');
    Route::post('/', [TrabajadorController::class, 'store'])->name('store');
    Route::get('/{trabajador}/edit', [TrabajadorController::class, 'edit'])->whereNumber('trabajador')->name('edit');
    Route::put('/{trabajador}', [TrabajadorController::class, 'update'])->whereNumber('trabajador')->name('update');
    Route::patch('/{trabajador}/estado', [TrabajadorController::class, 'toggleEstado'])->whereNumber('trabajador')->name('estado');
    Route::delete('/{trabajador}', [TrabajadorController::class, 'destroy'])->whereNumber('trabajador')->name('destroy');
});

use App\Http\Controllers\DistritoController;
Route::middleware(['auth'])->prefix('distrito')->name('distrito.')->group(function () {
    Route::get('/', [DistritoController::class, 'index'])->name('index');
    Route::get('/data', [DistritoController::class, 'data'])->name('data');
    Route::post('/', [DistritoController::class, 'store'])->name('store');
    Route::put('/{distrito}', [DistritoController::class, 'update'])->whereNumber('distrito')->name('update');
    Route::delete('/{distrito}', [DistritoController::class, 'destroy'])->whereNumber('distrito')->name('destroy');
});
//
require __DIR__.'/settings.php';
