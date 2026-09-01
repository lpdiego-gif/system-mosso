<?php

use App\Http\Controllers\Admin\AnimalController;
use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\ClienteController;
use App\Http\Controllers\Admin\DevolucionController as AdminDevolucionController;
use App\Http\Controllers\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Admin\ReclamoController as AdminReclamoController;
use App\Http\Controllers\DevolucionController;
use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\FuncionController;
use App\Http\Controllers\Admin\MenuCuentaController;
use App\Http\Controllers\Admin\ProductoController;
use App\Http\Controllers\Admin\RolController;
use App\Http\Controllers\Admin\ServicioController as AdminServicioController;
use App\Http\Controllers\Admin\SubCategoriaController;
use App\Http\Controllers\Admin\TipoServicioController;
use App\Http\Controllers\BusquedaController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\CatalogoController;
use App\Http\Controllers\CatalogoPublicoController;
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
Route::get('/marcas', [MarcaCatalogoController::class, 'index'])->name('marcas.index');
Route::get('/marcas/{marca}', [MarcaCatalogoController::class, 'show'])->whereNumber('marca')->name('marcas.show');

/*
|--------------------------------------------------------------------------
| Servicios (público): listado, listado por tipo y detalle.
|--------------------------------------------------------------------------
| /servicios y /servicios/{tipo} son los mismos hrefs que ya genera
| MenuService::columnasServicios(); /servicio/{slug} (singular) es el
| detalle, mismo patrón que /catalogo/... (listado) vs /producto/{id}
| (detalle) que ya usa CatalogoController.
*/

Route::middleware('feature:servicios,/')->group(function () {
    Route::get('/servicios', [ServicioController::class, 'index'])->name('servicios.index');
    Route::get('/servicios/{tipo}', [ServicioController::class, 'porTipo'])->whereNumber('tipo')->name('servicios.tipo');
    Route::get('/servicio/{slug}', [ServicioController::class, 'show'])->name('servicio.show');
});

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
| Catálogo público — página completa con filtros y descarga PDF
|--------------------------------------------------------------------------
*/

Route::get('/catalogo', [CatalogoPublicoController::class, 'index'])->name('catalogo.publico');
Route::get('/catalogo/pdf', [CatalogoPublicoController::class, 'pdf'])->name('catalogo.pdf');

/*
|--------------------------------------------------------------------------
| Catálogo público (subcategoría, categoría, animal)
|--------------------------------------------------------------------------
*/

Route::get('/catalogo/subcategoria/{subcategoria}', [CatalogoController::class, 'porSubcategoria'])
    ->whereNumber('subcategoria')
    ->middleware('menu.animal:subcategoria')
    ->name('catalogo.subcategoria');

Route::get('/catalogo/categoria/{categoria}', [CatalogoController::class, 'porCategoria'])
    ->whereNumber('categoria')
    ->middleware('menu.animal:categoria')
    ->name('catalogo.categoria');

Route::get('/catalogo/animal/{animal}', [CatalogoController::class, 'porAnimal'])
    ->whereNumber('animal')
    ->middleware('menu.animal:animal')
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

use App\Http\Controllers\MiCuentaMascotaController;
use App\Http\Controllers\MiCuentaPedidosController;
use App\Http\Controllers\MiCuentaPuntosController;

Route::middleware(['auth', 'cliente'])->group(function () {
    Route::get('/mi-cuenta', [MiCuentaController::class, 'index'])->name('mi-cuenta');

    Route::middleware('menu.cuenta:pedidos')->group(function () {
        Route::get('/mi-cuenta/pedidos', [MiCuentaPedidosController::class, 'index'])->name('mi-cuenta.pedidos');
        Route::delete('/mi-cuenta/pedidos/{pedido}', [MiCuentaPedidosController::class, 'cancelar'])->whereNumber('pedido')->name('mi-cuenta.pedidos.cancelar');
    });

    Route::middleware('menu.cuenta:direcciones')->prefix('mi-cuenta/direcciones')->name('mi-cuenta.direcciones.')->group(function () {
        Route::get('/', [MiCuentaDireccionController::class, 'index'])->name('index');
        Route::post('/', [MiCuentaDireccionController::class, 'store'])->name('store');
        Route::patch('/{direccion}/principal', [MiCuentaDireccionController::class, 'marcarPrincipal'])
            ->whereNumber('direccion')->name('principal');
        Route::delete('/{direccion}', [MiCuentaDireccionController::class, 'destroy'])
            ->whereNumber('direccion')->name('destroy');
    });

    Route::middleware('menu.cuenta:detalles')->group(function () {
        Route::get('/mi-cuenta/detalles', [MiCuentaDetallesController::class, 'index'])->name('mi-cuenta.detalles');
        Route::put('/mi-cuenta/detalles', [MiCuentaDetallesController::class, 'update'])->name('mi-cuenta.detalles.update');
    });

    Route::middleware(['menu.cuenta:mascotas', 'feature:mascotas,/mi-cuenta'])->prefix('mi-cuenta/mascotas')->name('mi-cuenta.mascotas.')->group(function () {
        Route::get('/', [MiCuentaMascotaController::class, 'index'])->name('index');
        Route::post('/', [MiCuentaMascotaController::class, 'store'])->name('store');
        Route::delete('/{mascota}', [MiCuentaMascotaController::class, 'destroy'])->whereNumber('mascota')->name('destroy');
    });

    Route::middleware(['menu.cuenta:puntos_cupones', 'feature:puntos_cupones,/mi-cuenta'])->group(function () {
        Route::get('/mi-cuenta/puntos', [MiCuentaPuntosController::class, 'index'])->name('mi-cuenta.puntos');
    });
});

/*
|--------------------------------------------------------------------------
| Cambios y devoluciones (cliente autenticado)
|--------------------------------------------------------------------------
| Enlazada desde el footer del Portal Web. Si el visitante no tiene sesión,
| el middleware `auth` lo manda a /login y Laravel lo trae de vuelta aquí
| apenas inicia sesión (intended URL).
*/

Route::middleware(['auth', 'cliente'])->group(function () {
    Route::get('/cambios-y-devoluciones', [DevolucionController::class, 'create'])->name('devoluciones.create');
    Route::post('/cambios-y-devoluciones', [DevolucionController::class, 'store'])->name('devoluciones.store');
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

    Route::middleware('permiso:productos.ver')->group(function () {
        Route::get('/productos', [ProductoController::class, 'index'])->name('productos.index');
        Route::get('/productos/categorias/{animal}', [ProductoController::class, 'categorias'])
            ->whereNumber('animal')->name('productos.categorias');
        Route::get('/productos/subcategorias/{categoria}', [ProductoController::class, 'subcategorias'])
            ->whereNumber('categoria')->name('productos.subcategorias');
        Route::get('/productos/etapas/{animal}', [ProductoController::class, 'etapas'])
            ->whereNumber('animal')->name('productos.etapas');
        Route::get('/productos/{producto}', [ProductoController::class, 'show'])
            ->whereNumber('producto')->name('productos.show');
    });

    Route::middleware('permiso:productos.crear')->group(function () {
        Route::get('/productos/create', [ProductoController::class, 'create'])->name('productos.create');
        Route::post('/productos', [ProductoController::class, 'store'])->name('productos.store');
        Route::post('/productos/buscar-codigo', [ProductoController::class, 'buscarCodigo'])->name('productos.buscar-codigo');

        // Catálogos rápidos usados desde el formulario de creación de productos.
        Route::post('/animales', [AnimalController::class, 'store'])->name('animales.store');
        Route::post('/categorias', [CategoriaController::class, 'store'])->name('categorias.store');
        Route::post('/subcategorias', [SubCategoriaController::class, 'store'])->name('subcategorias.store');
        Route::post('/marcas', [MarcaController::class, 'store'])->name('marcas.store');
    });

    Route::middleware('permiso:productos.editar')->group(function () {
        Route::get('/productos/{producto}/edit', [ProductoController::class, 'edit'])
            ->whereNumber('producto')->name('productos.edit');
        Route::post('/productos/{producto}', [ProductoController::class, 'update'])
            ->whereNumber('producto')->name('productos.update');
        Route::patch('/productos/{producto}/estado', [ProductoController::class, 'toggleEstado'])
            ->whereNumber('producto')->name('productos.estado');
        Route::patch('/productos/{producto}/stock', [ProductoController::class, 'ajustarStock'])
            ->whereNumber('producto')->name('productos.stock');
    });

    Route::middleware('permiso:productos.eliminar')->group(function () {
        Route::delete('/productos/{producto}', [ProductoController::class, 'destroy'])
            ->whereNumber('producto')->name('productos.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Servicios (admin)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permiso:servicios.ver')->group(function () {
        Route::get('/servicios', [AdminServicioController::class, 'index'])->name('servicios.index');
    });

    Route::middleware('permiso:servicios.crear')->group(function () {
        Route::get('/servicios/create', [AdminServicioController::class, 'create'])->name('servicios.create');
        Route::post('/servicios', [AdminServicioController::class, 'store'])->name('servicios.store');
        Route::post('/tipos-servicio', [TipoServicioController::class, 'store'])->name('tipos-servicio.store');
    });

    Route::middleware('permiso:servicios.editar')->group(function () {
        Route::get('/servicios/{servicio}/edit', [AdminServicioController::class, 'edit'])->whereNumber('servicio')->name('servicios.edit');
        Route::post('/servicios/{servicio}', [AdminServicioController::class, 'update'])->whereNumber('servicio')->name('servicios.update');
    });

    Route::middleware('permiso:servicios.eliminar')->group(function () {
        Route::delete('/servicios/{servicio}', [AdminServicioController::class, 'destroy'])->whereNumber('servicio')->name('servicios.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Clientes (admin)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permiso:clientes.ver')->group(function () {
        Route::get('/clientes', [ClienteController::class, 'index'])->name('clientes.index');
        Route::get('/clientes/{cliente}', [ClienteController::class, 'show'])->whereNumber('cliente')->name('clientes.show');
    });

    Route::middleware('permiso:clientes.crear')->group(function () {
        Route::get('/clientes/create', [ClienteController::class, 'create'])->name('clientes.create');
        Route::post('/clientes', [ClienteController::class, 'store'])->name('clientes.store');
    });

    Route::middleware('permiso:clientes.editar')->group(function () {
        Route::get('/clientes/{cliente}/edit', [ClienteController::class, 'edit'])->whereNumber('cliente')->name('clientes.edit');
        Route::put('/clientes/{cliente}', [ClienteController::class, 'update'])->whereNumber('cliente')->name('clientes.update');
    });

    Route::middleware('permiso:clientes.eliminar')->group(function () {
        Route::delete('/clientes/{cliente}', [ClienteController::class, 'destroy'])->whereNumber('cliente')->name('clientes.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Pedidos (admin)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permiso:pedidos.ver')->group(function () {
        Route::get('/pedidos', [AdminPedidoController::class, 'index'])->name('pedidos.index');
        Route::get('/pedidos/{pedido}', [AdminPedidoController::class, 'show'])->whereNumber('pedido')->name('pedidos.show');
    });

    Route::middleware('permiso:pedidos.gestionar')->group(function () {
        Route::patch('/pedidos/{pedido}/estado', [AdminPedidoController::class, 'actualizarEstado'])->whereNumber('pedido')->name('pedidos.estado');
    });

    /*
    |--------------------------------------------------------------------------
    | Cambios y devoluciones (admin)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permiso:devoluciones.ver')->group(function () {
        Route::get('/devoluciones', [AdminDevolucionController::class, 'index'])->name('devoluciones.index');
        Route::get('/devoluciones/{devolucion}', [AdminDevolucionController::class, 'show'])->whereNumber('devolucion')->name('devoluciones.show');
    });

    Route::middleware('permiso:devoluciones.gestionar')->group(function () {
        Route::patch('/devoluciones/{devolucion}/estado', [AdminDevolucionController::class, 'actualizarEstado'])->whereNumber('devolucion')->name('devoluciones.estado');
    });

    /*
    |--------------------------------------------------------------------------
    | Libro de reclamaciones (admin)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permiso:reclamos.ver')->group(function () {
        Route::get('/reclamos', [AdminReclamoController::class, 'index'])->name('reclamos.index');
        Route::get('/reclamos/{reclamo}', [AdminReclamoController::class, 'show'])->whereNumber('reclamo')->name('reclamos.show');
    });

    Route::middleware('permiso:reclamos.gestionar')->group(function () {
        Route::patch('/reclamos/{reclamo}/estado', [AdminReclamoController::class, 'actualizarEstado'])->whereNumber('reclamo')->name('reclamos.estado');
    });

    /*
    |--------------------------------------------------------------------------
    | Menús (mega menú del Portal Web)
    |--------------------------------------------------------------------------
    */

    Route::middleware('super_admin')->group(function () {
        Route::get('/menus', [MenuController::class, 'index'])->name('menus.index');
        Route::post('/menus', [MenuController::class, 'store'])->name('menus.store');
        Route::put('/menus/{menu}', [MenuController::class, 'update'])->whereNumber('menu')->name('menus.update');
        Route::patch('/menus/{menu}/estado', [MenuController::class, 'toggleStatus'])->whereNumber('menu')->name('menus.toggle-status');
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->whereNumber('menu')->name('menus.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Menu de "Mi Cuenta" (panel del cliente)
    |--------------------------------------------------------------------------
    */

    Route::middleware('super_admin')->group(function () {
        Route::get('/menu-cuenta', [MenuCuentaController::class, 'index'])->name('menu-cuenta.index');
        Route::post('/menu-cuenta', [MenuCuentaController::class, 'store'])->name('menu-cuenta.store');
        Route::put('/menu-cuenta/{menuCuenta}', [MenuCuentaController::class, 'update'])->whereNumber('menuCuenta')->name('menu-cuenta.update');
        Route::patch('/menu-cuenta/{menuCuenta}/estado', [MenuCuentaController::class, 'toggleStatus'])->whereNumber('menuCuenta')->name('menu-cuenta.toggle-status');
        Route::delete('/menu-cuenta/{menuCuenta}', [MenuCuentaController::class, 'destroy'])->whereNumber('menuCuenta')->name('menu-cuenta.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Funciones (feature flags de la entrega por fases, admin o portal web)
    |--------------------------------------------------------------------------
    */

    Route::middleware('super_admin')->group(function () {
        Route::get('/funciones', [FuncionController::class, 'index'])->name('funciones.index');
        Route::post('/funciones', [FuncionController::class, 'store'])->name('funciones.store');
        Route::put('/funciones/{funcion}', [FuncionController::class, 'update'])->whereNumber('funcion')->name('funciones.update');
        Route::delete('/funciones/{funcion}', [FuncionController::class, 'destroy'])->whereNumber('funcion')->name('funciones.destroy');
        Route::patch('/funciones/{funcion}/estado', [FuncionController::class, 'toggleStatus'])->whereNumber('funcion')->name('funciones.toggle-status');
    });

    /*
    |--------------------------------------------------------------------------
    | Roles y permisos (Super Administrador: todos los roles. Administrador:
    | delegación con techo sobre su equipo — ver PermisoService)
    |--------------------------------------------------------------------------
    */

    Route::middleware('gestiona.roles')->group(function () {
        Route::get('/roles', [RolController::class, 'index'])->name('roles.index');
        Route::patch('/roles/{rol}/permisos', [RolController::class, 'syncPermisos'])->whereNumber('rol')->name('roles.permisos.sync');
        Route::patch('/roles/{rol}/permisos/{permiso}', [RolController::class, 'togglePermiso'])->whereNumber('rol')->whereNumber('permiso')->name('roles.permisos.toggle');
    });
});

use App\Http\Controllers\DashboardController;

// El fallback de "sin permiso" aquí es '/' (no '/dashboard'): redirigir a la
// propia ruta del dashboard cuando falta dashboard.ver crearía un bucle.
Route::middleware(['auth', 'verified', 'permiso:dashboard.ver,/'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

});

use App\Http\Controllers\EmpresaController;

Route::middleware(['auth'])->prefix('empresa')->name('empresa.')->group(function () {
    Route::middleware('permiso:empresa.ver')->group(function () {
        Route::get('/', [EmpresaController::class, 'index'])->name('index');
        Route::get('/provincias/{departamento}', [EmpresaController::class, 'provincias'])->whereNumber('departamento')->name('provincias');
        Route::get('/distritos/{provincia}', [EmpresaController::class, 'distritos'])->whereNumber('provincia')->name('distritos');
    });

    Route::middleware('permiso:empresa.editar')->group(function () {
        Route::post('/', [EmpresaController::class, 'guardar'])->name('guardar');
    });
});

use App\Http\Controllers\TrabajadorController;

Route::middleware(['auth'])->prefix('trabajador')->name('trabajador.')->group(function () {
    Route::middleware('permiso:trabajadores.ver')->group(function () {
        Route::get('/', [TrabajadorController::class, 'index'])->name('index');
        Route::get('/data', [TrabajadorController::class, 'data'])->name('data');
        Route::get('/provincias/{departamento}', [TrabajadorController::class, 'provincias'])->whereNumber('departamento')->name('provincias');
        Route::get('/distritos/{provincia}', [TrabajadorController::class, 'distritos'])->whereNumber('provincia')->name('distritos');
    });

    Route::middleware('permiso:trabajadores.crear')->group(function () {
        Route::post('/buscar-documento', [TrabajadorController::class, 'buscarDocumento'])->name('buscar-documento');
        Route::post('/', [TrabajadorController::class, 'store'])->name('store');
    });

    Route::middleware('permiso:trabajadores.editar')->group(function () {
        Route::get('/{trabajador}/edit', [TrabajadorController::class, 'edit'])->whereNumber('trabajador')->name('edit');
        Route::put('/{trabajador}', [TrabajadorController::class, 'update'])->whereNumber('trabajador')->name('update');
        Route::patch('/{trabajador}/estado', [TrabajadorController::class, 'toggleEstado'])->whereNumber('trabajador')->name('estado');
    });

    Route::middleware('permiso:trabajadores.eliminar')->group(function () {
        Route::delete('/{trabajador}', [TrabajadorController::class, 'destroy'])->whereNumber('trabajador')->name('destroy');
    });
});

use App\Http\Controllers\DistritoController;

Route::middleware(['auth'])->prefix('distrito')->name('distrito.')->group(function () {
    Route::middleware('permiso:distritos.ver')->group(function () {
        Route::get('/', [DistritoController::class, 'index'])->name('index');
        Route::get('/data', [DistritoController::class, 'data'])->name('data');
    });

    Route::middleware('permiso:distritos.crear')->group(function () {
        Route::post('/', [DistritoController::class, 'store'])->name('store');
    });

    Route::middleware('permiso:distritos.editar')->group(function () {
        Route::put('/{distrito}', [DistritoController::class, 'update'])->whereNumber('distrito')->name('update');
    });

    Route::middleware('permiso:distritos.eliminar')->group(function () {
        Route::delete('/{distrito}', [DistritoController::class, 'destroy'])->whereNumber('distrito')->name('destroy');
    });
});
//
require __DIR__.'/settings.php';
