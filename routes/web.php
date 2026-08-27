<?php

use App\Http\Controllers\Admin\AnimalController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\ProductoController;
use App\Http\Controllers\Admin\ServicioController as AdminServicioController;
use App\Http\Controllers\Admin\SubCategoriaController;
use App\Http\Controllers\Admin\TipoServicioController;
use App\Http\Controllers\BusquedaController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\CatalogoController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ClienteRegistroController;
use App\Http\Controllers\CuentaController;
use App\Http\Controllers\FavoritosController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MarcaCatalogoController;
use App\Http\Controllers\MiCuentaController;
use App\Http\Controllers\MiCuentaDetallesController;
use App\Http\Controllers\MiCuentaDireccionController;
use App\Http\Controllers\OfertasController;
use App\Http\Controllers\ReclamoController;
use App\Http\Controllers\ServicioController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/buscar', BusquedaController::class)->name('buscar');
Route::get('/favoritos', FavoritosController::class)->name('favoritos');
Route::get('/ofertas', OfertasController::class)->name('ofertas');
Route::get('/marcas/{marca}', MarcaCatalogoController::class)->whereNumber('marca')->name('marcas.show');

/*
|--------------------------------------------------------------------------
| Servicios (público): listado, listado por tipo y detalle.
|--------------------------------------------------------------------------
| /servicios y /servicios/{tipo} son los mismos hrefs que ya genera
| MenuService::columnasServicios(); /servicio/{slug} (singular) es el
| detalle, mismo patrón que /catalogo/... (listado) vs /producto/{id}
| (detalle) que ya usa CatalogoController.
*/

Route::get('/servicios', [ServicioController::class, 'index'])->name('servicios.index');
Route::get('/servicios/{tipo}', [ServicioController::class, 'porTipo'])->whereNumber('tipo')->name('servicios.tipo');
Route::get('/servicio/{slug}', [ServicioController::class, 'show'])->name('servicio.show');

/*
|--------------------------------------------------------------------------
| Carrito de compras (público: invitado + cliente autenticado)
|--------------------------------------------------------------------------
*/

Route::get('/carrito', [CarritoController::class, 'index'])->name('carrito.index');
Route::post('/carrito/items', [CarritoController::class, 'store'])->name('carrito.store');
Route::patch('/carrito/items/{detalle}', [CarritoController::class, 'update'])->whereNumber('detalle')->name('carrito.update');
Route::delete('/carrito/items/{detalle}', [CarritoController::class, 'destroy'])->whereNumber('detalle')->name('carrito.destroy');

/*
|--------------------------------------------------------------------------
| Checkout / Proceder al pago (solo cliente autenticado)
|--------------------------------------------------------------------------
| El invitado que intente entrar es redirigido a /cuenta (login del
| storefront) y, tras autenticarse, vuelve al checkout (URL intended).
*/

Route::middleware(['auth', 'cliente'])->prefix('checkout')->name('checkout.')->group(function () {
    Route::get('/', [CheckoutController::class, 'show'])->name('show');
    Route::get('/envio/{distrito}', [CheckoutController::class, 'envio'])->whereNumber('distrito')->name('envio');
    Route::post('/iniciar', [CheckoutController::class, 'iniciar'])->name('iniciar');
    Route::post('/{pedido}/orden', [CheckoutController::class, 'orden'])->whereNumber('pedido')->name('orden');
    Route::post('/{pedido}/pagar', [CheckoutController::class, 'pagar'])->whereNumber('pedido')->name('pagar');
    Route::get('/confirmacion/{pedido}', [CheckoutController::class, 'confirmacion'])->whereNumber('pedido')->name('confirmacion');
});

/*
|--------------------------------------------------------------------------
| Catálogo público (subcategoría, categoría, animal)
|--------------------------------------------------------------------------
*/

Route::get('/catalogo/subcategoria/{subcategoria}', [CatalogoController::class, 'porSubcategoria'])
    ->whereNumber('subcategoria')
    ->name('catalogo.subcategoria');

Route::get('/catalogo/categoria/{categoria}', [CatalogoController::class, 'porCategoria'])
    ->whereNumber('categoria')
    ->name('catalogo.categoria');

Route::get('/catalogo/animal/{animal}', [CatalogoController::class, 'porAnimal'])
    ->whereNumber('animal')
    ->name('catalogo.animal');

/*
|--------------------------------------------------------------------------
| Libro de Reclamaciones (público, sin auth)
|--------------------------------------------------------------------------
*/

Route::get('/libro-de-reclamaciones', [ReclamoController::class, 'create'])->name('reclamos.create');
Route::post('/libro-de-reclamaciones', [ReclamoController::class, 'store'])->name('reclamos.store');

/*
|--------------------------------------------------------------------------
| Mi cuenta (público): login unificado trabajador/cliente + registro cliente
|--------------------------------------------------------------------------
| El login en sí usa las rutas de Fortify (/login, /logout) ya existentes;
| aquí solo vive la página "Mi cuenta" y el auto-registro de clientes.
*/

Route::get('/cuenta', [CuentaController::class, 'show'])->name('cuenta');
Route::post('/cuenta/registro', [ClienteRegistroController::class, 'store'])->name('cliente.registro.store');
Route::post('/cuenta/registro/verificar', [ClienteRegistroController::class, 'verificar'])->name('cliente.registro.verificar');
Route::post('/cuenta/registro/reenviar', [ClienteRegistroController::class, 'reenviar'])->name('cliente.registro.reenviar');

/*
|--------------------------------------------------------------------------
| Mi cuenta (cliente autenticado)
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\MiCuentaPedidosController;
use App\Http\Controllers\MiCuentaMascotaController;
use App\Http\Controllers\MiCuentaPuntosController;

Route::middleware(['auth', 'cliente'])->group(function () {
    Route::get('/mi-cuenta', [MiCuentaController::class, 'index'])->name('mi-cuenta');

    Route::get('/mi-cuenta/pedidos', [MiCuentaPedidosController::class, 'index'])->name('mi-cuenta.pedidos');

    Route::prefix('mi-cuenta/direcciones')->name('mi-cuenta.direcciones.')->group(function () {
        Route::get('/', [MiCuentaDireccionController::class, 'index'])->name('index');
        Route::post('/', [MiCuentaDireccionController::class, 'store'])->name('store');
        Route::patch('/{direccion}/principal', [MiCuentaDireccionController::class, 'marcarPrincipal'])
            ->whereNumber('direccion')->name('principal');
        Route::delete('/{direccion}', [MiCuentaDireccionController::class, 'destroy'])
            ->whereNumber('direccion')->name('destroy');
    });

    Route::get('/mi-cuenta/detalles', [MiCuentaDetallesController::class, 'index'])->name('mi-cuenta.detalles');
    Route::put('/mi-cuenta/detalles', [MiCuentaDetallesController::class, 'update'])->name('mi-cuenta.detalles.update');

    Route::prefix('mi-cuenta/mascotas')->name('mi-cuenta.mascotas.')->group(function () {
        Route::get('/', [MiCuentaMascotaController::class, 'index'])->name('index');
        Route::post('/', [MiCuentaMascotaController::class, 'store'])->name('store');
        Route::delete('/{mascota}', [MiCuentaMascotaController::class, 'destroy'])->whereNumber('mascota')->name('destroy');
    });

    Route::get('/mi-cuenta/puntos', [MiCuentaPuntosController::class, 'index'])->name('mi-cuenta.puntos');
});

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

    /*
    |--------------------------------------------------------------------------
    | Servicios (admin)
    |--------------------------------------------------------------------------
    */

    Route::get('/servicios', [AdminServicioController::class, 'index'])->name('servicios.index');
    Route::get('/servicios/create', [AdminServicioController::class, 'create'])->name('servicios.create');
    Route::post('/servicios', [AdminServicioController::class, 'store'])->name('servicios.store');
    Route::get('/servicios/{servicio}/edit', [AdminServicioController::class, 'edit'])->whereNumber('servicio')->name('servicios.edit');
    Route::post('/servicios/{servicio}', [AdminServicioController::class, 'update'])->whereNumber('servicio')->name('servicios.update');
    Route::delete('/servicios/{servicio}', [AdminServicioController::class, 'destroy'])->whereNumber('servicio')->name('servicios.destroy');

    Route::post('/tipos-servicio', [TipoServicioController::class, 'store'])->name('tipos-servicio.store');
});

use App\Http\Controllers\DashboardController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

});

use App\Http\Controllers\EmpresaController;

Route::middleware(['auth'])->prefix('empresa')->name('empresa.')->group(function () {
    Route::get('/', [EmpresaController::class, 'index'])->name('index');
    Route::get('/provincias/{departamento}', [EmpresaController::class, 'provincias'])->whereNumber('departamento')->name('provincias');
    Route::get('/distritos/{provincia}', [EmpresaController::class, 'distritos'])->whereNumber('provincia')->name('distritos');
    Route::post('/', [EmpresaController::class, 'guardar'])->name('guardar');
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
