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

//
require __DIR__.'/settings.php';
