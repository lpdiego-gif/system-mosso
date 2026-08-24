<?php

use App\Http\Controllers\Admin\AnimalController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\ProductoController;
use App\Http\Controllers\Admin\SubCategoriaController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

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
//
require __DIR__.'/settings.php';
