# MEMORIA_PROYECTO.md — Mapa de contexto de "system_mosso"

> **Propósito de este documento:** es el mapa de referencia del proyecto para trabajo futuro con IA/asistentes de código. Antes de implementar cualquier funcionalidad compleja nueva, léelo para no romper la lógica, convenciones o el esquema de datos ya existentes. Generado por análisis exhaustivo del código y de la base de datos real (`mosso`) el 2026-08-25.
>
> Este documento describe el estado **real** del código en este momento, incluyendo huecos y deuda técnica — no es aspiracional.

---

## 1. Qué es el proyecto

**Mosso** es un sistema para una tienda/veterinaria de mascotas ("Todo para tu engreído"): catálogo de productos (alimentos, accesorios, higiene para perros/gatos/exóticos), marcas, servicios (peluquería, veterinaria, etc.), y un panel administrativo interno para gestionar productos, trabajadores y zonas de reparto (distritos). La base de datos ya modela también carrito de compras, pedidos, comprobantes de pago y clientes, pero **esas partes del negocio (e-commerce transaccional) todavía no tienen código en la aplicación** — ver sección 4.

## 2. Arquitectura general y stack tecnológico

Aplicación monolítica **Laravel + Inertia.js + React**, sin API REST separada ni SPA independiente: cada "página" es un componente React renderizado del lado del servidor vía Inertia (no hay JSON API pública, salvo unos pocos endpoints internos usados por `axios` para tablas paginadas).

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | PHP | ^8.3 |
| Framework | Laravel | ^13.17 |
| Puente SPA | Inertia.js (`inertiajs/inertia-laravel`) | ^3.0 |
| Autenticación | Laravel Fortify (registro, reset password, verificación email, **2FA**, **passkeys/WebAuthn**) | ^1.37 |
| Frontend | React | ^19.2 |
| Lenguaje frontend | TypeScript | ^5.7 |
| Bundler | Vite | ^8.0 (+ `laravel-vite-plugin`, `@laravel/vite-plugin-wayfinder` para generar rutas/acciones tipadas) |
| Estilos | Tailwind CSS | ^4.0 (`@tailwindcss/vite`) |
| Componentes UI | Radix UI + shadcn-style (`resources/js/components/ui/*`) | — |
| Iconos | lucide-react | — |
| Rutas tipadas en JS | `ziggy-js` + Wayfinder (genera helpers de rutas/acciones) | — |
| Base de datos | MariaDB 10.4 (`DB_DATABASE=system_mosso`) — vía Docker (`docker compose`); antes XAMPP local | — |
| Entorno de ejecución | Docker: `Dockerfile` multi-stage (codegen → frontend → runtime) + `docker-compose.yml` (servicios `app` en `:8000` y `db`) | — |
| Gestor de paquetes JS | **npm** (`package-lock.json`) — el Docker y el dev local usan npm; se estandarizó el 2026-08-27 (antes había `pnpm-lock.yaml` en paralelo) | — |
| Análisis estático | PHPStan/Larastan (`phpstan.neon`), ESLint, Prettier, Laravel Pint | — |
| Tests | PHPUnit (`tests/Feature`, `tests/Unit`) | ^12.5 |

Puntos importantes de arquitectura:

- **El esquema de base de datos histórico NO se gestiona con migraciones de Laravel.** Las migraciones cubren el starter kit (`users`, `cache`, `jobs`, `passkeys`, columnas 2FA) y, desde el 2026-08-25, la tabla `reclamos` (ver 4.9) — la primera tabla de negocio creada con una migración real de Laravel en vez de vía dump externo. El resto de tablas de negocio (`productos`, `trabajadores`, `pedidos`, etc.) ya existían en la base `mosso` antes de este proyecto Laravel y fueron creadas fuera de él (dump SQL externo, probablemente phpMyAdmin). **Antes de asumir que una tabla/columna existe o no, verifica contra la base real, no contra `database/migrations/`.** Para tablas de negocio **nuevas** a partir de ahora, usa migraciones de Laravel (`php artisan make:migration`) — es el patrón que se empezó a seguir con `reclamos` y evita que seguir creciendo el dump manual sea la única forma de versionar el esquema.
- **Convención de nombres en español y con prefijos `id_`/`fk_`** en casi todas las tablas de negocio (`id_producto`, `fk_marca`, etc.), a diferencia de las tablas propias de Laravel (`users.id`, en inglés y sin prefijo). Los modelos Eloquent declaran `protected $primaryKey` y `protected $table` explícitamente para adaptarse a esto.
- **Mezcla deliberada de Eloquent y Query Builder crudo (`DB::table(...)`).** Los controladores de escritura simple (Admin\AnimalController, CategoriaController, MarcaController, SubCategoriaController) usan modelos Eloquent. Los controladores con lógica más compleja (`ProductoController`, `TrabajadorController`, `DistritoController`) usan casi exclusivamente `DB::table()` con joins manuales, incluso cuando existe el modelo Eloquent equivalente. Sigue el patrón de cada controlador al modificarlo, no mezcles estilos dentro del mismo archivo.
- **Sin capa de "servicios" uniforme.** Solo existen dos: `HomeService` (arma los datos del home público) y `MenuService` (arma el mega menú). El resto de la lógica vive directamente en los controladores.
- La conexión entre el backend y el frontend por página es siempre vía `Inertia::render('ruta/del/componente', [...props])`, y el nombre debe coincidir exactamente con un archivo en `resources/js/pages/`.
- **Docker (desde 2026-08-27).** `Dockerfile` en 3 stages: (1) `codegen` (imagen `composer:2`) corre `php artisan wayfinder:generate --with-form` porque el plugin de Vite de Wayfinder necesita `php artisan`, que no existe en el stage Node; (2) `frontend` (`node:20-alpine`) copia esos helpers del stage anterior y hace `npm run build`; (3) `runtime` (`php:8.4-apache`) junta todo + `docker/entrypoint.sh` (espera la BD, `migrate --force`, `config:cache`, arranca Apache). `vite.config.ts` solo activa Wayfinder en `serve`. `.dockerignore` excluye `node_modules`/`vendor`/`resources/js/{actions,routes,wayfinder}`/`*.sql` (los symlinks de `node_modules/.bin` rompían la transferencia del contexto). `docker-compose.yml`: toda la config sale de `.env` (sin bloque `environment:`); el servicio `db` monta `./mosso.sql` en `/docker-entrypoint-initdb.d/` para auto-importar el esquema en un volumen nuevo (`docker compose down -v` para reimportar); el servicio `app` bind-montea `./storage/logs` para que el log sea visible desde el host — con `MAIL_MAILER=log` el **código de verificación de clientes se lee en `storage/logs/laravel.log`**.

## 3. Propósito de cada carpeta principal

```
app/
  Actions/Fortify/        Personalización de registro y reset de password para Fortify.
  Concerns/                Traits de validación reutilizables (reglas de password/perfil).
  Console/Commands/        Comandos artisan personalizados (InstallFeaturesCommand, del starter kit).
  Http/Controllers/
    Admin/                 CRUD del catálogo de productos: Animal, Categoria, SubCategoria, Marca, Producto.
    Settings/              Perfil de usuario y seguridad (2FA, passkeys) — del starter kit.
    (raíz)                 HomeController (home público), BusquedaController (buscador),
                            TrabajadorController (CRUD empleados), DistritoController (CRUD zonas de envío),
                            DashboardController (KPIs y estadísticas reales del panel `/dashboard`).
  Http/Middleware/          HandleInertiaRequests (props compartidas globales), HandleAppearance (tema claro/oscuro),
                             EnsureEsCliente (alias `cliente`), EnsureEsTrabajador (alias `trabajador`),
                             EnsureCorreoVerificado (alias `correo.verificado`), RestringirGestionDosPasos
                             (grupo `web`, autolimitado a las rutas `two-factor.*`). Ver 4.10.
  Http/Requests/            FormRequests de validación (Settings/*, Trabajador/Store|UpdateTrabajadorRequest).
  Listeners/                CheckTrabajadorActivo: bloquea el login si el trabajador está inactivo (auto-descubierto
                             por Laravel al escuchar Illuminate\Auth\Events\Login, NO requiere registro manual).
  Models/                   Eloquent models — ver sección 4 y 5 para el mapeo completo a tablas.
  Providers/                AppServiceProvider (config global), FortifyServiceProvider (vistas/acciones de auth).
  Services/                 HomeService (home público), MenuService (mega menú dinámico).

routes/
  web.php                   TODAS las rutas de negocio: home, admin/*, trabajador/*, distrito/*.
  settings.php              Rutas de perfil/seguridad del usuario autenticado (incluida por web.php).
  console.php               Comandos artisan agendados.

database/
  migrations/                Solo tablas del starter kit (users, cache, jobs, passkeys, 2FA). NO reflejan el
                             esquema real de negocio (ver sección 4).
  factories/, seeders/       Solo UserFactory / DatabaseSeeder por defecto, sin seeders del dominio.

resources/js/
  app.tsx                    Entry point de Inertia (bootstrap de React).
  pages/                     Un componente por cada Inertia::render(...) del backend. Subcarpetas:
                                Admin/Productos/   Index (listado), Create (alta) — sin Edit/Delete todavía.
                                auth/              Pantallas de Fortify (login, registro, 2FA, passkeys...).
                                settings/          Perfil, seguridad, apariencia.
                                trabajador/         trabajadores.tsx (listado+filtros), trabajador-form.tsx
                                                    (alta/edición), distrito.tsx (CRUD zonas de envío).
                                welcome.tsx         Home público (storefront).
                                dashboard.tsx       Panel de Control admin, con datos reales de
                                                    DashboardController (ver sección 5).
  components/                 Componentes reutilizables. Los de dominio (Header, MegaMenu, MobileMenu,
                             HomeSections) están en la raíz de components/ con PascalCase; los genéricos
                             de UI (shadcn-style) viven en components/ui/ en kebab-case. Los componentes
                             propios de una sola página compleja se agrupan en una subcarpeta kebab-case con
                             el nombre de esa página (ej. `components/dashboard/` → stat-card.tsx,
                             sales-chart.tsx, donut-chart.tsx, usados solo por `pages/dashboard.tsx`).
  layouts/                   AppLayout (panel admin, con sidebar) vs StorefrontLayout (tienda pública, con
                             Header/MegaMenu, sin sidebar). No mezclar: cada página Inertia usa uno u otro.
  hooks/                      Hooks de dominio (use-dni-lookup, use-two-factor-auth) y de infraestructura
                             (use-mobile, use-appearance, use-flash-toast).
  types/                      Tipos TS espejo de lo que devuelven los controladores/servicios PHP. Cuando
                             cambies la forma de un prop en un controller/service, actualiza el .ts asociado
                             (producto.ts, trabajador.ts, menu.ts, navigation.ts, ui.ts, auth.ts, dashboard.ts).
                             `navigation.ts` (`NavItem`) soporta un campo opcional `items?: NavItem[]` para
                             submenús colapsables en el sidebar (`app-sidebar.tsx` + `nav-main.tsx`).
  lib/utils.ts                 Helper cn() (clsx + tailwind-merge), estándar de shadcn.

public/image/                 Assets estáticos servidos directo (logos, categorías, banners). Las imágenes
                             subidas por el admin (productos, marcas) van a storage/app/public vía Storage
                             (disco "public"), NO a esta carpeta.

storage/                      Logs, cache de framework, y storage/app/public (uploads) — estándar Laravel.
tests/                        Solo cobertura del starter kit (auth, perfil, seguridad, dashboard). CERO tests
                             de las features de negocio (productos, trabajadores, distrito, home).
```

## 4. Estructura de la base de datos (`mosso`, MySQL)

La base tiene **53 tablas** (52 preexistentes del dominio + `reclamos`, agregada el 2026-08-25). Se agrupan aquí por dominio funcional. Las marcadas **[sin código]** existen en la BD pero ningún modelo/controlador las usa todavía — son terreno fértil para features futuras, pero también significa que no hay ninguna validación de negocio ya resuelta para ellas.

> **Dump de referencia:** hay un export completo (estructura + datos + índices + `FOREIGN KEY`) en `mosso.sql` (raíz del repo; también existe uno más viejo en `base de datos/mosso.sql`). **Sin trackear en git** (`??`) — es la única fuente escrita del esquema completo fuera de la BD viva. Docker lo auto-importa (montado en `/docker-entrypoint-initdb.d/` del servicio `db`). Su tabla `migrations` incluye **todas** las migraciones ya aplicadas —incluidas las 5 del starter kit (`create_users_table`, etc.)— para que tras el import `php artisan migrate` no intente recrear tablas que el dump ya trae. Si cambias el esquema en la BD, regenera este dump (`mariadb-dump`) manteniendo esa tabla `migrations` consistente.

**Reglas de integridad relevantes (de los `FOREIGN KEY` del dump, no obvias por el código PHP):**
- `productos` → si se borra un producto, se borran en cascada sus `descuentos`, `producto_imagenes` y cualquier `carrito_detalle` que lo referencie. `pedido_detalle`, en cambio, **no** tiene acción de borrado (RESTRICT por defecto): un producto que ya fue vendido no se puede eliminar mientras exista el pedido. Ningún controlador implementa borrado de productos todavía, pero cualquier futuro `ProductoController::destroy()` debe tener esto en cuenta.
- `direcciones` → `distritos` es solo `ON UPDATE CASCADE`, sin acción de borrado: no se puede borrar un distrito con direcciones asociadas (coincide con la validación manual que ya hace `DistritoController::destroy()` contra `direcciones`).
- `categorias` → `animales` y `sub_categorias` → `categorias` son `NO ACTION` (bloquean el borrado si hay hijos), pero `menus` → `animales`/`tipo_animales` sí es `ON DELETE CASCADE` (borrar un animal borra silenciosamente los ítems de menú que lo usan).
- `trabajadores.fk_user` → `users.id` es `ON DELETE CASCADE` (confirma el comentario de `TrabajadorController::destroy()`); `clientes.fk_user` es `ON DELETE SET NULL`.
- `tipo_animales` hoy solo tiene 2 filas de datos: `Normal` (Perro, Gato) y `Exóticos` (Hámster, Aves, Peces, Conejo) — no es un catálogo por especie, es una agrupación gruesa en dos grupos.

### 4.1 Sistema / framework (gestionadas por Laravel)
`users`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `password_reset_tokens`, `passkeys`, `migrations`.

### 4.2 Personas y accesos
- `personas` (datos base: documento, nombres, apellidos, teléfono, nacimiento) — tabla central compartida por trabajadores y clientes. Modelo `App\Models\Persona` (desde 2026-08-25).
- `trabajadores` (`fk_persona`, `fk_user`, `fk_rol`, `fk_direccion`, `fecha_ingreso`, `activo`) — un trabajador es una persona + un `users` + un rol. Solo se crean desde el panel admin (`TrabajadorController`), nunca se autorregistran.
- `clientes` (`fk_persona` **nullable desde 2026-08-25**, `fk_user`, `correo`). Modelo `App\Models\Cliente`. `fk_persona` se hizo opcional a propósito: el autorregistro público (ver 4.10) solo pide correo y contraseña, así que el cliente nace sin persona ligada; sus datos (nombres, documento, teléfono) se completan después.
- `roles`, `permisos`, `rol_permisos` **[roles usado solo para trabajadores; permisos/rol_permisos sin código]** — hay tabla de permisos granulares pero ningún controlador la consulta; el control de acceso actual es solo `middleware('auth')` a nivel de ruta, no por permiso.
- `tipo_documento` (DNI=1, CE=2, Pasaporte=3) — estaba vacía; se sembró con esos 3 valores y en ese orden (migración `2026_08_25_060000_seed_tipo_documento`) porque `TrabajadorController::buscarDocumento()` ya asumía en un comentario que `id_tipo_documento = 1` era DNI, y el formulario de Detalles de mi cuenta (ver 4.10) necesitaba opciones reales para crear una `persona` válida.

### 4.3 Ubicación geográfica
`departamentos` → `provincias` (`fk_departamento`) → `distritos` (`fk_provincia`, `costo_envio`) → `direcciones` (`fk_distrito`). Jerarquía completa con CRUD ya construido para `distritos` (ver `DistritoController`); departamentos/provincias son de solo lectura (cargados como catálogo).
`cliente_direcciones` — libreta de direcciones del cliente (`/mi-cuenta/direcciones`, ver 4.10). Cada fila enlaza un `cliente` a una `direccion` con `alias` y `es_principal`; la `direccion` en sí es la misma tabla que ya usan trabajadores/servicios/empresa.

### 4.4 Catálogo de productos
Jerarquía: `animales` → `categorias` (`fk_id_animal`) → `sub_categorias` (`fk_id_categoria`) → `productos` (`fk_id_subcategorias`, nullable). **Importante:** `productos` NO tiene `fk_id_animal` directo; el animal se deriva subiendo la cadena subcategoría→categoría→animal (comentado explícitamente en `ProductoController`).
- `animales` también tiene `id_tipo_animal` → `tipo_animales` (para agrupar "exóticos": loro, hámster, etc., por tipo en vez de por especie individual).
- `marcas` (`nombre`, `logo`).
- `unidades_medida`, `estados_producto` (catálogos simples usados como FK en `productos`).
- `descuentos` (`fk_producto`, tipo `porcentaje`/`monto_fijo`, vigencia por fechas, `activo`) — un producto puede tener descuento vigente; la lógica de "descuento activo ahora" vive en `Producto::descuentoActivo()`.
- `producto_imagenes` (`fk_producto`, `url`, `orden`) **[sin código]** — la tabla soporta galería de imágenes por producto, pero hoy `productos.imagen_principal` es la única imagen usada en toda la app.

### 4.5 Menú / navegación
`menus` (`tipo_enlace` enum: `animal`/`tipo_animal`/`marca`/`tipo_servicio`/`url`, `fk_animal`, `fk_tipo_animal`, `orden`, `destacado`, `activo`) — filas 100% data-driven que arman el mega menú del header público. Editable solo por BD directa hoy (no hay UI admin para `menus`).

### 4.6 Carrito y pedidos **[carrito implementado; checkout/pedidos solo esquema]**
`carritos` (`fk_cliente` o `token_invitado` para invitados) → `carrito_detalle` (`fk_producto`, `cantidad`, `precio_unitario`).
`pedidos` (`fk_cliente`, `fk_direccion_envio`, `fk_tipo_entrega`, `fk_forma_pago`, `fk_estado_pedido`, subtotal/descuento/igv/total) → `pedido_detalle`. `pedido_recojo_terceros` (datos de quien recoge un pedido si no es el cliente). Catálogos de apoyo: `estados_pedido`, `forma_pagos`, `tipo_entregas`.
Sigue sin existir checkout/creación de pedidos, pero `DashboardController` ya hace `SELECT` de solo lectura sobre `pedidos`/`pedido_detalle` (ventas por día, pedidos recientes, productos más vendidos) — cualquier futura implementación de checkout debe mantener el significado de estas columnas (`total`, `fecha_pedido`, etc.) para no romper esas estadísticas.

**Carrito implementado (primera etapa — 2026-08-25):**
- `App\Models\Carrito` (`$primaryKey = 'id_carrito'`, `$fillable = ['fk_cliente','token_invitado']`, `detalles()` HasMany, `cliente()` BelongsTo).
- `App\Models\CarritoDetalle` (`$primaryKey = 'id_carrito_detalle'`, `const UPDATED_AT = null` — tabla sin columna updated_at, `$fillable = ['fk_carrito','fk_producto','cantidad','precio_unitario']`).
- `App\Services\CarritoService`: token invitado guardado en **sesión Laravel** (`$request->session()->put/get('cart_token')`), NO en cookie (cookies cifradas de XAMPP causaban problemas). `resolverCarrito()` y `encontrarCarrito()` siguen la misma lógica: usuario auth con registro `clientes` → usa `fk_cliente`; cualquier otro caso (invitado o auth sin clientes) → token de sesión. `contarItems()` es seguro para middleware (nunca crea carrito). `agregarProducto()` suma cantidad si el producto ya existe. `obtenerItems()` eager-load `producto.marca`.
- `App\Http\Controllers\CarritoController`: `index` (GET /carrito), `store` (POST /carrito/items), `update` (PATCH /carrito/items/{detalle}), `destroy` (DELETE /carrito/items/{detalle}). Protege con `abort_if($detalle->fk_carrito !== $carrito->id_carrito, 403)`.
- `HandleInertiaRequests::share()` agrega prop compartido `carrito.cantidad` (lazy closure, usa `CarritoService::contarItems()`).
- `resources/js/pages/carrito/index.tsx`: página pública (StorefrontLayout) con lista de ítems, controles +/−, botón eliminar y resumen de pedido. Usa `router.patch` y `router.delete`.
- `resources/js/types/global.d.ts`: `carrito: { cantidad: number }` agregado a `sharedPageProps`.

### 4.7 Facturación **[sin código]**
`comprobantes` (boleta/factura, `fk_pedido`, `fk_tipo_comprobante`, `fk_empresa`, serie/número) — `tipo_comprobante`, `empresa` (datos de la empresa emisora, RUC, dirección), `empresa_redes` + `redes_sociales` (redes sociales de la empresa).

### 4.8 Servicios (peluquería, veterinaria, etc.) **[sin código]**
`servicios` (`fk_tipo_servicio`, nombre del negocio/servicio, responsable, dirección) con tablas satélite: `servicio_beneficios`, `servicio_horarios` (por día de semana), `servicio_imagenes`, `servicio_redes`. Catálogo: `tipos_servicio`. El menú (`menus`, tipo `tipo_servicio`) ya tiene un ítem "Servicios" apuntando a `/servicios`, pero esa ruta/página **no existe todavía**.

### 4.9 Reclamos (Libro de Reclamaciones INDECOPI)
`reclamos` — tabla nueva (migración `2026_08_25_003439_create_reclamos_table`, modelo `App\Models\Reclamo`), autocontenida (no depende de `personas`/`tipo_documento` para no acoplar un formulario legal público a las tablas de RR.HH.). Guarda tipo/número de documento, nombres, contacto y dirección de quien reclama; tienda de compra, monto, tipo de bien; tipo de atención (`reclamo`/`queja`), detalle y solución pedida; y, si `es_menor_edad` es true, los datos del apoderado. `id_reclamo` es el correlativo que se muestra al usuario como número de su reclamo. No tiene UI de administración todavía (solo se registra vía el formulario público, no hay pantalla para que un admin las liste/gestione).

### 4.10 Login diferenciado y registro de clientes con código de verificación
`codigos_verificacion` — tabla nueva (migración `2026_08_25_040001_create_codigos_verificacion_table`, modelo `App\Models\CodigoVerificacion`), una fila por email (igual que `password_reset_tokens`), con `codigo` (6 dígitos), `intentos` y `expira_en` (15 min). Reenviar código = `updateOrInsert` sobre la misma fila.

**Cómo funciona el login único trabajador/cliente:** `/cuenta` (público, `CuentaController` → componente `resources/js/pages/cuenta.tsx`) es la **única pantalla de acceso** de toda la app. `/login` y `/register` de Fortify **redirigen a `/cuenta`** (`FortifyServiceProvider::configureViews()` devuelve `redirect()->route('cuenta')` en vez de renderizar `auth/login`/`auth/register`; esas dos páginas React quedan como código muerto). Las rutas **POST** de Fortify siguen vivas: el formulario de `cuenta.tsx` envía a `login.store`. `CuentaController::show()` recibe los mismos props que antes tenía `auth/login.tsx` (`canResetPassword`, `status`). El sub-formulario de login de `cuenta.tsx` incluye: enlace "¿Olvidaste tu contraseña?" (`password.request`), botón "Entrar con passkey" (`usePasskeyVerify`, estilo storefront), banner de `status` y toggle mostrar/ocultar contraseña.

Lo que "diferencia según la base de datos" es `App\Services\CuentaService::tipoDe()` (consulta `trabajadores`/`clientes` por `fk_user`, igual que ya hacía `CheckTrabajadorActivo`) combinado con `App\Http\Responses\LoginResponse` — implementación propia de `Laravel\Fortify\Contracts\LoginResponse`, bindeada en `FortifyServiceProvider::register()` — que decide el redirect tras cualquier login exitoso: trabajador → `/dashboard`, cliente (o cualquier otro `users` sin relación) → `/mi-cuenta`. `CuentaService::redirectPara()` antepone un caso: si el correo del usuario **no está verificado**, devuelve `route('cuenta')` (donde `show()` renderiza el paso del código en vez de redirigir). El login con passkey tiene su propio `App\Http\Responses\PasskeyLoginResponse` (bindeado junto a los otros) que replica ese mismo criterio — el paquete `laravel/passkeys` por defecto mandaba a `/`. Si había una URL "intended", se respeta primero. `CuentaController::show()` aplica la lógica a la inversa: si ya hay sesión **verificada**, redirige antes de renderizar.

La ruta `/mi-cuenta` está protegida por los middleware `cliente` (`App\Http\Middleware\EnsureEsCliente`, rebota trabajadores a `/dashboard`) **y `correo.verificado`** (`App\Http\Middleware\EnsureCorreoVerificado`, alias en `bootstrap/app.php`): un cliente que se registró pero nunca confirmó el código vuelve a `/cuenta`. No se usa el middleware `verified` de Laravel a propósito — ese redirige a la verificación por enlace de Fortify, y aquí la verificación es por código.

**Guard de trabajador.** `App\Http\Middleware\EnsureEsTrabajador` (alias `trabajador`, espejo de `EnsureEsCliente`) manda a `/mi-cuenta` a cualquier `users` sin fila en `trabajadores`. Aplicado a `/dashboard` (`['auth', 'verified', 'trabajador']` en `routes/web.php`). Los CRUD admin (`/admin/*`, `/trabajador`, `/distrito`, `/empresa`) **todavía solo tienen `['auth']`** — pendiente de sumarles `trabajador`.

**2FA solo para trabajadores.** La verificación en dos pasos (Fortify) es solo para las cuentas con acceso al panel. `Settings\SecurityController::edit()` calcula `$esTrabajador` (`CuentaService::tipoDe`) y solo entonces pasa `canManageTwoFactor` / `twoFactorEnabled` (para un cliente la sección de 2FA no se renderiza). Como refuerzo del lado servidor, `App\Http\Middleware\RestringirGestionDosPasos` va en el **grupo `web`** (`bootstrap/app.php`) y se autolimita por nombre a las rutas `two-factor.*` de Fortify, respondiendo 403 a quien no sea trabajador — se hace así porque Fortify registra esas rutas por su cuenta y añadirles middleware con `Route::getByName()->middleware()` **no persiste de forma fiable**. Las **passkeys**, en cambio, están disponibles para clientes y trabajadores.

**Logout:** igual de unificado, y también explícito — `App\Http\Responses\LogoutResponse` (bindeada junto a `LoginResponse` en `FortifyServiceProvider::register()`) redirige siempre a `route('home')` (el storefront público), sea trabajador o cliente quien cierre sesión. El botón "Cerrar sesión" es el mismo en todos lados (sidebar admin, `MiCuentaShell`): `<Link href={logout()} as="button">` contra la ruta `logout` de Fortify que ya existía; no hace falta un endpoint propio.

**Registro (solo clientes, dos pasos)** — `ClienteRegistroController`, rutas públicas bajo `/cuenta/registro*`. El registro genérico de Fortify **no se usa** (su vista redirige a `/cuenta`); no crea fila en `clientes` ni usa el código.
1. `store` — valida `name` (opcional, `nullable|string|max:255`), correo (único en `users`) y contraseña; crea `users` (con `email_verified_at = null`) + `clientes` (`fk_persona = null`), genera el código de 6 dígitos y lo envía (`App\Mail\CodigoVerificacionMail`, vista `resources/views/emails/codigo-verificacion.blade.php`). El **nombre es provisional**: `FormularioRegistro` en `cuenta.tsx` lo deriva del correo (`juan.perez@x.com` → `Juan Perez`, `nombreDesdeCorreo()`) y lo muestra como **texto pequeño bajo el input de correo** (no es un campo editable), y lo envía en un `<input type="hidden" name="name">`. Si va vacío, `store` cae a la parte local del correo. Se sobrescribe con el nombre real en "Detalles de la cuenta".
2. `verificar` — valida correo+código contra `codigos_verificacion`; si es válido, marca `email_verified_at`, borra el código, hace `Auth::login()` y reutiliza el mismo `LoginResponse` de arriba para redirigir. Tras **5 intentos fallidos** (`codigos_verificacion.intentos`, `MAX_INTENTOS`) el código se invalida y se manda uno nuevo — corta la fuerza bruta sobre los 6 dígitos.
`reenviar` repite el paso 1 sin crear una cuenta nueva. `PasoCodigo` en `cuenta.tsx` tiene un **cooldown de 60 s** en el botón "Reenviar" (`COOLDOWN_REENVIO`), que arranca al llegar tras un registro/reenvío.

**UI de `cuenta.tsx` (rediseño 2026-08-27).** Una sola tarjeta centrada y responsive (`max-w-md`, `text-base` en inputs para no hacer zoom en iOS), con un segmentado **Iniciar sesión / Crear cuenta** arriba; títulos y descripciones centrados. El **paso del código es parte del registro**: `FormularioRegistro` lo dispara con `onSuccess` del `<Form>` (estado local `pasoCodigo` en el componente `Cuenta`, con el correo que ya tenía en state — no depende del flash `registroPendiente`). Verificado → `LoginResponse` → entra directo a `/mi-cuenta`. El formulario de login no muestra nada del código; solo lo ve un cliente autenticado sin verificar (`emailPendiente` del controlador), con opción de "Cerrar sesión".

Las 3 rutas `/cuenta/registro*` llevan **rate limit** (`throttle:6,1` / `throttle:10,1` / `throttle:4,1`). Los tests las desactivan con `withoutMiddleware(ThrottleRequests::class)` (`ClienteRegistroTest`).

Los **trabajadores** nacen verificados: `TrabajadorController::store()` inserta `users` con `email_verified_at = now()`, así que nunca pasan por código ni por enlace.

**"Acceso y seguridad" del cliente** (`/mi-cuenta/seguridad`, `MiCuentaSeguridadController` → `resources/js/pages/mi-cuenta-seguridad.tsx`, ítem nuevo en `MiCuentaShell`): equivalente storefront de `Settings\SecurityController` pero **sin 2FA**. Cambiar contraseña (reutiliza la ruta `user-password.update` de Fortify) y administrar passkeys (`usePasskeyRegister` + rutas `passkey.*`), con el estilo de la tienda.

**Envío de correo — Resend.** En local `MAIL_MAILER=log` (los códigos quedan en `storage/logs/laravel.log`). En **producción** se usa **Resend**: `MAIL_MAILER=resend` + `RESEND_API_KEY=re_...` (dominio verificado en resend.com; `MAIL_FROM_ADDRESS` de ese dominio, o `onboarding@resend.dev` hacia tu propio correo para pruebas). El transporte `resend` lo trae Laravel; el SDK `resend/resend-php` está en `composer.json` (`^1.11`). `config/mail.php` y `config/services.php` ya tenían las entradas. No hay que tocar código: `CodigoVerificacionMail` es un `Mailable` estándar, agnóstico del transporte. **Los correos se envían de forma síncrona** (`Mail::to()->send()` en `ClienteRegistroController`), no encolados — no hay worker de colas en el Docker actual; el cooldown de 60 s del botón "Reenviar" en `cuenta.tsx` mitiga el costo. Resend no depende de `APP_ENV`: funciona donde lo configures.
- Comando de prueba: **`php artisan mosso:test-mail [correo] [--mailer=resend]`** (`app/Console/Commands/TestMailCommand.php`) — envía el `CodigoVerificacionMail` con un código ficticio para verificar la config sin registrar una cuenta.
- Pruebas: `tests/Feature/Mail/ResendMailerTest.php`, `tests/Feature/Console/TestMailCommandTest.php`.

**Gotcha de MariaDB a recordar:** en la migración de `codigos_verificacion` se usó `$table->dateTime(...)` en vez de `$table->timestamp(...)` a propósito. MariaDB/MySQL en modo legacy le asigna automáticamente `DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()` a la **primera columna `TIMESTAMP`** de una tabla si no se especifica lo contrario — eso pisaba silenciosamente `expira_en` en cada `UPDATE` (incluso uno tan inocente como `->increment('intentos')`), invalidando el código antes de tiempo. Para timestamps que la aplicación controla explícitamente (expiraciones, códigos, etc.), usa `dateTime()`, no `timestamp()`.

## 5. Estado actual del desarrollo

### ✅ Completo y funcional
- **Catálogo público por subcategoría/categoría/animal** (`/catalogo/subcategoria/{id}`, `/catalogo/categoria/{id}`, `/catalogo/animal/{id}`): `CatalogoController` con 3 métodos + método privado `formato()` usando `Storage::url()`. Página `resources/js/pages/catalogo/index.tsx` con `StorefrontLayout`, breadcrumbs dinámicos, grid de productos, favoritos y "Agregar al carrito". Las URLs las genera `MenuService` y coinciden con las rutas definidas. Agregado al `case null` en `app.tsx` (prefijo `catalogo/`).
- **Buscador** (`GET /buscar?q=`, `BusquedaController`): ruta pública, `resources/js/pages/buscar.tsx` con `StorefrontLayout`. Grid de productos con favoritos y "Agregar al carrito". Header usa `router.get('/buscar', { q: query.trim() })` al hacer submit. Sin formulario de búsqueda secundario en la página (se eliminó — solo el del Header).
- **Favoritos** (`/favoritos`, `FavoritosController`): almacenamiento en `localStorage` via hook `resources/js/hooks/use-favoritos.ts`. Sincronización entre componentes vía evento DOM custom `mosso:favoritos-updated`. Página `resources/js/pages/favoritos.tsx` con lista de favoritos guardados, botón "Quitar" y "Agregar al carrito". Badge rojo en Header con `total` del hook. Sin tabla de BD — decisión tomada porque no hay tabla `favoritos` y los clientes no siempre están autenticados.
- **Carrito de compras — primera etapa** (modelos, servicio, controlador, página): ver detalle en sección 4.6.
- **Autenticación completa** (Fortify): login, registro, verificación de email, reset de password, **2FA** y **passkeys/WebAuthn**. Incluye bloqueo de login para trabajadores inactivos (`CheckTrabajadorActivo`, auto-registrado por descubrimiento de eventos de Laravel).
- **Gestión de trabajadores** (`/trabajador`): listado con búsqueda/filtros/orden/paginación server-side vía endpoint JSON (`TrabajadorController::data`), alta y edición completas (reutiliza `personas` si el documento ya existe), activar/desactivar, eliminar (con protección para no auto-eliminarse/desactivarse). Incluye lookup de documento (`buscarDocumento`) con hook de debounce en frontend.
- **Gestión de distritos** (`/distrito`): CRUD completo con validación de nombre único por provincia (con `lockForUpdate` para evitar condiciones de carrera) y bloqueo de borrado si el distrito está en uso por `direcciones`.
- **Alta de productos** (`/admin/productos/create` → `store`): flujo con generación automática de SKU, distinción especial perro/gato (elige subcategoría) vs. exóticos (auto-crea categoría/subcategoría "General"), y "reabastecer" (si el SKU generado ya existe, suma stock en vez de duplicar producto).
- **Listado de productos** (`/admin/productos`): tabla de solo lectura con joins a marca/categoría/animal/unidad/estado.
- **Home público** (`/`): hero banner, barra de beneficios, carruseles de productos destacados/en oferta y marcas — datos armados por `HomeService`. Carrusel auto-scroll cada 3 s con pause-on-hover (`useEffect` + `setInterval` en `ProductoCarrusel`, `HomeSections.tsx`). Tarjetas con favoritos via `useFavoritos` y "Agregar al carrito" via `router.post`.
- **Mega menú dinámico** (header público): 100% data-driven desde la tabla `menus`, con submenús por animal, por tipo de animal (exóticos), marcas y tipos de servicio. Header es `sticky top-0 z-50` (fijo al hacer scroll). Incluye badge naranja de carrito (lee `usePage().props.carrito.cantidad`) y badge rojo de favoritos (lee `useFavoritos().total`). Buscador funcional: submit redirige a `GET /buscar?q=...`.
- **Panel de Control (`/dashboard`)**: reemplazado el placeholder del starter kit por un dashboard real, servido por `DashboardController` (100% `DB::table`, sin Eloquent, siguiendo el patrón de `TrabajadorController`/`DistritoController`). Muestra KPIs (ventas del mes/hoy, pedidos totales, clientes, equipo activo, productos activos, valor de inventario), gráfico de ventas de los últimos 14 días, catálogo por tipo de mascota, productos más vendidos, alerta de stock bajo, pedidos recientes, equipo por rol y descuentos activos — todo con estados vacíos explícitos (no hay seed de `pedidos`/`clientes`/`trabajadores` en la BD actual, así que la mayoría de tarjetas parten en 0 hasta que se cargue data real). Responsivo, con tema claro/oscuro/sistema y fondo degradado propio en modo oscuro (no negro puro). Componentes en `resources/js/components/dashboard/`, tipos en `types/dashboard.ts`.
- **Submenús en el sidebar admin**: `NavItem` (`types/navigation.ts`) soporta `items?: NavItem[]`; `nav-main.tsx` los renderiza como un `Collapsible` tipo acordeón (solo un submenú abierto a la vez, se cierra al navegar a un ítem plano, resalta el ítem/submenú activo). Ya usado por "Trabajadores" y "Departamento" en `app-sidebar.tsx`.
- **Footer del storefront** (`resources/js/components/Footer.tsx`, montado en `StorefrontLayout`): branding, columnas Tienda/Ayuda/Contacto/Medios de pago y barra inferior. Estático (igual que el resto del home), sin datos de BD. Varios de sus enlaces (Alimentos, Accesorios, Higiene, Delivery, Métodos de pago, Cambios y devoluciones, Preguntas frecuentes, Términos y condiciones, Política de privacidad) son placeholders `#` porque las páginas de catálogo/ayuda todavía no existen; los que sí tienen destino real son Perros/Gatos (`/catalogo/animal/1` y `/2`, mismo patrón ya usado por `MegaMenu`), Ofertas (`/ofertas`, mismo valor que ya trae `menus.url`) y Libro de reclamaciones.
- **Libro de Reclamaciones** (`/libro-de-reclamaciones`, público, sin auth): formulario completo según el Código de Protección y Defensa del Consumidor, con backend real (`ReclamoController` + modelo `Reclamo` + tabla `reclamos`, ver 4.9). Al enviar, valida, guarda el reclamo, muestra un toast de confirmación y un panel con el N° de reclamo asignado. Los datos legales de cabecera (RUC, dirección fiscal) están como placeholders `[Completar ...]` en `resources/js/pages/libro-de-reclamaciones.tsx` — reemplázalos cuando tengas los datos reales de MOSSO S.A.C.
- **Login unificado + registro de cliente** (`/cuenta`, enlazado desde el ícono de usuario del `Header`): **única pantalla de acceso** de toda la app — `/login` y `/register` de Fortify redirigen aquí (ver 4.10). Un solo login (envía a `login.store`) sirve para trabajador y cliente, con enlace a reset de contraseña, botón de passkey y toggle de contraseña. Autorregistro **solo para clientes**, en dos pasos: correo+contraseña → código de 6 dígitos (ver 4.10). El código es **obligatorio**: un cliente sin verificar no entra a `/mi-cuenta` (middleware `correo.verificado`), vuelve al paso del código. Si ya hay sesión verificada, `/cuenta` redirige de inmediato.
- **2FA restringida a trabajadores** (ver 4.10): `Settings\SecurityController` no expone la sección de 2FA a clientes; `RestringirGestionDosPasos` (grupo `web`, autolimitado a `two-factor.*`) responde 403 a nivel de ruta. Passkeys siguen disponibles para ambos.
- **`/dashboard` protegido con el alias `trabajador`** (`EnsureEsTrabajador`): un cliente autenticado que entre a `/dashboard` a mano rebota a `/mi-cuenta`. Los otros grupos admin todavía no (ver 4.10).
- **"Mi cuenta"** (solo cliente autenticado, middleware `cliente` = `EnsureEsCliente` + `correo.verificado` = `EnsureCorreoVerificado` en todas sus rutas): banner + menú lateral compartidos por `resources/js/components/MiCuentaShell.tsx` (Escritorio/Pedidos/Direcciones/Detalles de la cuenta/**Acceso y seguridad**/Cerrar sesión). Explícitamente se dejaron fuera "Mis cupones" y "Lista de deseos" (pedido del usuario). Pantallas:
  - **Escritorio** (`/mi-cuenta`, `MiCuentaController`): saludo + accesos rápidos.
  - **Direcciones** (`/mi-cuenta/direcciones`, `MiCuentaDireccionController`): libreta de direcciones real sobre `direcciones` + `cliente_direcciones` (antes "sin código", ver 4.2/4.3). Alta con departamento→provincia→distrito en cascada (catálogos completos cargados de una vez y filtrados en el cliente, sin ida y vuelta al servidor — factible porque son pocas filas), marcar como principal, eliminar (borra también la fila de `direcciones` si nadie más la referencia, mismo criterio de `DistritoController::destroy()`).
  - **Detalles de la cuenta** (`/mi-cuenta/detalles`, `MiCuentaDetallesController`): el cliente completa aquí los campos de `personas` (documento, nombres, apellidos, teléfono, nacimiento) que el registro rápido no pidió. Al guardar: si su documento ya existe en `personas` (p.ej. porque también es trabajador) lo reutiliza en vez de duplicarlo, actualiza `clientes.fk_persona` y refresca `users.name` (que hasta entonces tenía el nombre provisional del registro, ver 4.10).
  - **Acceso y seguridad** (`/mi-cuenta/seguridad`, `MiCuentaSeguridadController`): cambiar contraseña (ruta `user-password.update` de Fortify) y administrar passkeys (`usePasskeyRegister` + rutas `passkey.*`), con estilo storefront. Sin 2FA (solo trabajadores).
  - **Pedidos** (`/mi-cuenta/pedidos`) sigue sin construir — el ítem del menú y el link ya existen, apuntando a una ruta que todavía no existe.

### 🟡 Parcial / con huecos conocidos
- **Productos**: no hay edición ni borrado (ni rutas backend ni UI) — solo alta y listado. No hay UI para gestionar descuentos ni galería de imágenes (`producto_imagenes`) aunque el esquema ya las soporta.
- **Lookup RENIEC**: `TrabajadorController::buscarDocumento` importa `App\Services\ReniecService`, pero **ese archivo no existe**; la llamada real está comentada, así que hoy `buscarDocumento` siempre cae al flujo "nuevo" cuando no encuentra la persona en la BD local. El hook de frontend (`use-dni-lookup.ts`) ya está listo para consumir esta integración en cuanto se implemente.
- **Menú "Clientes"** en el sidebar admin (`app-sidebar.tsx`) apunta a `/client`, ruta que no existe en `routes/web.php` — enlace roto/placeholder.
- **Modelo `App\Models\Menu`**: el método de relación `tipoAnimal()` apunta a `App\Models\TipoAnimal`, que no existe como clase (la tabla real es `tipo_animales`, no usada por ningún modelo). Hoy no truena porque `MenuService` no usa esa relación (consulta `Animal::where('id_tipo_animal', ...)` directo), pero es una landmine si alguien la invoca o hace eager-load.
- **`resources/js/components/MarcaCarrusel.tsx`**: archivo vacío (0 bytes), no referenciado por nadie (el componente real vive en `HomeSections.tsx`). Parece un archivo huérfano de un commit anterior.
- **Tests de negocio**: `tests/Feature/DashboardTest.php` valida el `DashboardController` real; el resto de la suite (auth/perfil/seguridad) es del starter kit, actualizada al login unificado (`/login`→`/cuenta`, redirect a `/mi-cuenta`, 2FA solo trabajadores) y apoyada en el trait `Tests\Concerns\CreatesDomainTables` (ver sección 7). **41/41 en verde** tras arreglar las 3 migraciones del dump que rompían `migrate` en sqlite. Sigue sin haber tests para productos, trabajadores, distrito ni home; tampoco para `/cuenta`, registro por código ni `/mi-cuenta/*`.

### 🔴 No implementado (solo existe el esquema de BD)
- **Checkout / pedidos** (`pedidos`, `pedido_detalle`, `pedido_recojo_terceros`, `estados_pedido`, `forma_pagos`, `tipo_entregas`) — cero código.
- **Comprobantes/facturación** (`comprobantes`, `tipo_comprobante`, `empresa`, `empresa_redes`, `redes_sociales`) — cero código.
- ~~Clientes del storefront~~ — implementado (registro con verificación por código, "Mi cuenta", Direcciones, Detalles de la cuenta; ver 4.10 y el bloque "Mi cuenta" más abajo). Sigue faltando el checkout que consuma esas direcciones.
- **Servicios** (peluquería/veterinaria: `servicios` y sus 4 tablas satélite) — el menú ya enlaza a `/servicios` pero no existe controlador ni página.
- **Roles y permisos granulares** (`permisos`, `rol_permisos`) — la tabla `roles` sí se usa (para trabajadores), pero no hay ningún control de acceso basado en `permisos`; toda la protección actual es `middleware('auth')` a nivel de ruta.

## 6. Flujo de datos principal

### 6.1 Petición típica (cualquier página)
```
Request → routes/web.php (o settings.php)
        → Middleware: HandleAppearance, HandleInertiaRequests, AddLinkHeadersForPreloadedAssets
        → HandleInertiaRequests::share() inyecta en TODAS las páginas:
              name, auth.user, sidebarOpen, menu (vía MenuService::build(), se ejecuta en cada request),
              carrito.cantidad (vía CarritoService::contarItems(), lazy closure, seguro para no-clientes)
        → Controller (Eloquent y/o DB::table)
        → Inertia::render('pages/algo', [...props])
        → resources/js/pages/algo.tsx recibe los props ya tipados (idealmente contra resources/js/types/*)
        → algo.tsx elige su layout: AppLayout (admin, con sidebar) o StorefrontLayout (público, con Header/MegaMenu)
```

### 6.2 Home público (`GET /`)
`HomeController` → `HomeService` (`productosDestacados`, `productosEnOferta`, `marcasDestacadas`, cada uno consulta `Producto`/`Marca` con Eloquent, aplica `Producto::scopeActivos()` y calcula precio con descuento vigente vía `Producto::descuentoActivo()`) → `Inertia::render('welcome', [...])` → `welcome.tsx` (usa `StorefrontLayout` + `HomeSections.tsx` para los carruseles, tipado por `types/producto.ts`).

### 6.3 Listados administrativos con filtros (patrón repetido en Trabajadores y Distritos)
1. Primera carga: `index()` renderiza la página Inertia con los catálogos necesarios para los `<select>` de filtro (roles, departamentos, etc.).
2. La tabla en sí NO se recarga vía Inertia: el componente React llama por `axios` a un endpoint JSON hermano (`GET /trabajador/data`, `GET /distrito/data`) que devuelve `{ data, meta }` con paginación/orden/búsqueda aplicados en SQL crudo (`DB::table` con joins). Esto evita recargar toda la página al tipear en el buscador o cambiar de página.
3. Alta/edición/borrado van por `POST`/`PUT`/`DELETE` JSON al mismo prefijo de rutas, con `FormRequest` (Trabajador) o validación inline (Distrito), y casi siempre dentro de `DB::transaction()` con `lockForUpdate()` cuando hay riesgo de condición de carrera (nombres únicos, no duplicar personas).

### 6.4 Alta de producto (el flujo más complejo del sistema)
`POST /admin/productos` → valida animal/marca/unidad/estado/subcategoría → si el animal es Perro o Gato exige y valida que la subcategoría pertenezca a ese animal; si es un animal exótico, auto-crea (o reutiliza) categoría "General" → subcategoría "General" bajo ese animal → genera SKU determinístico (`PREFIJO_ANIMAL-PREFIJO_MARCA-NOMBRE_NORMALIZADO`) → si el SKU ya existe, sólo suma stock al producto existente (no duplica); si no, inserta producto nuevo (con imagen subida a `storage/app/public/productos` si se envió) → redirige al listado con mensaje flash.

### 6.5 Catálogo público por subcategoría/categoría/animal
`GET /catalogo/subcategoria/{subcategoria}` → `CatalogoController::porSubcategoria()` → Eloquent `Producto::activos()->where('fk_id_subcategorias', $id)->with(['marca','descuentoActivo'])` → `formato()` (mismo shape que HomeService pero usando `Storage::url()`) → `Inertia::render('catalogo/index', [titulo, breadcrumbs, productos])` → `catalogo/index.tsx` (`StorefrontLayout`, breadcrumbs, grid, useFavoritos, add to cart). Mismo patrón para `porCategoria` y `porAnimal` (los dos últimos recorren la jerarquía para obtener todos los productos hijos).

### 6.6 Carrito de compras
`POST /carrito/items` → `CarritoController::store()` → `CarritoService::resolverCarrito()` (obtiene o crea carrito para el usuario/invitado) → `CarritoService::agregarProducto()` (inserta o suma cantidad en `carrito_detalle`) → redirect back con `preserveScroll`.
`GET /carrito` → `CarritoController::index()` → `CarritoService::encontrarCarrito()` + `CarritoService::obtenerItems()` → `Inertia::render('carrito/index', [items, total])`.
`PATCH /carrito/items/{detalle}` → valida ownership → actualiza `cantidad`; `DELETE` → borra fila.
El contador del Header se actualiza en cada Inertia response completa via el prop compartido `carrito.cantidad` inyectado por `HandleInertiaRequests`.

### 6.7 Búsqueda pública
`GET /buscar?q=texto` → `BusquedaController::__invoke()` → `Producto::activos()->with(['marca','descuentoActivo'])->where('nombre','like',"%{q}%")->limit(40)` → `formato()` con `Storage::url()` → `Inertia::render('buscar', [query, productos])` → `buscar.tsx` (StorefrontLayout, breadcrumbs, contador de resultados, grid con favoritos y add-to-cart).
El buscador del Header usa `router.get('/buscar', { q: query.trim() })` en el submit del formulario.

### 6.8 Favoritos (localStorage)
No hay request al servidor. `useFavoritos` lee/escribe `localStorage['mosso_favoritos']` (array de `ProductoCard[]`). Al hacer `toggle(producto)`, emite evento DOM `mosso:favoritos-updated` para sincronizar el badge del Header y cualquier otra instancia del hook montada al mismo tiempo. `FavoritosController::__invoke()` solo renderiza la página shell — los datos los lee `favoritos.tsx` desde el hook en el cliente.

### 6.9 Mega menú (se construye en cada request, no es una página aparte)
`MenuService::build()` lee `menus` (activo=true, ordenado) y por cada fila arma sus "columnas" de submenú según `tipo_enlace`: `animal` → categorías+subcategorías de ese animal; `tipo_animal` → lista simple de animales de ese tipo (exóticos); `marca` → todas las marcas; `tipo_servicio` → todos los tipos de servicio; `url` → enlace directo. El resultado tipado en frontend por `types/menu.ts` y consumido por `MegaMenu.tsx`/`MobileMenu.tsx` dentro de `Header.tsx`.

## 7. Convenciones a respetar en trabajo futuro

- Nombres de tablas/columnas de negocio en **español**, con `id_<tabla_singular>` como PK y `fk_<referencia>` como FK. No mezclar con convención inglesa de Laravel salvo en tablas propias del framework.
- Cuando agregues un prop nuevo a un `Inertia::render()`, crea/actualiza el tipo TS correspondiente en `resources/js/types/` — varias páginas ya dependen de que el tipo exista (ver el bug de `types/producto.ts` corregido el 2026-08-24, que rompía todo el build por faltar el archivo).
- Antes de asumir que una tabla existe o tiene cierta columna, consúltala en la BD real (`information_schema` vía tinker, o phpMyAdmin) — no confíes en `database/migrations/`.
- Sigue el patrón de acceso a datos ya usado en el controlador que edites (Eloquent vs. `DB::table`) en vez de mezclar estilos.
- Los endpoints JSON "hermanos" de una página Inertia (ej. `/trabajador/data`, `/distrito/data`) existen para no recargar toda la SPA al filtrar/paginar tablas — replica ese patrón para nuevos listados administrativos en vez de usar Inertia para cada cambio de filtro.
- Los tests de `tests/Feature/*Test.php` corren contra sqlite en memoria (`phpunit.xml`), no contra la BD `mosso` real. Como las tablas de negocio no están en `database/migrations/` (sección 4), **cualquier test que golpee una ruta cuyo controlador use esas tablas necesita sus propias fixtures** vía `Schema::create()` en `setUp()` (ver `tests/Feature/DashboardTest.php` para el patrón específico del dashboard).
- Para el mínimo común que necesita **cualquier** render Inertia autenticado —`menus`, `empresa`/`direcciones`/`distritos` (props compartidos `menu` y `empresa` de `HandleInertiaRequests`), y `trabajadores`/`clientes` (todo login pasa por `CuentaService::tipoDe()`)— usa el trait `Tests\Concerns\CreatesDomainTables` (`$this->createDomainTables()` en `setUp()`, con guardas `Schema::hasTable`). Ya lo usan las pruebas de auth/settings del starter kit y `DashboardTest`. Sin él, cualquier test que visite una página con `assertOk()` truena con "no such table: menus" (o `empresa`).
- Las migraciones que tocan tablas del **dump externo** (`clientes`, `tipo_documento`, `redes_sociales`, etc.) deben ser no-ops fuera de MySQL: esas tablas no existen en el sqlite de los tests. Guarda con `if (DB::getDriverName() !== 'mysql') return;` o `if (! Schema::hasTable(...)) return;` — sin eso, `RefreshDatabase` revienta en `migrate` y **toda** la suite queda roja (así estuvo entre el 2026-08-25 y el 2026-08-27). Y nunca uses sintaxis solo-MySQL como `ALTER TABLE ... MODIFY` sin esa guarda.
- Evita funciones SQL específicas de MySQL/MariaDB (`CURDATE()`, `NOW()`, etc.) dentro de `selectRaw()`/`whereRaw()` si el código va a tener un test de feature: no existen en sqlite y el test fallará con "no such function". Usa en su lugar comparaciones con marcas de tiempo calculadas en PHP con `Carbon` y pasadas como binding (`->selectRaw('... WHEN fecha >= ? ...', [Carbon::today()])`) — funciona igual en MySQL y es portable. `DATE(columna)` sí es soportado por ambos motores.
- **Cualquier página nueva del storefront público** (no admin) debe agregarse al `case` que devuelve `null` en el resolver `layout` de `resources/js/app.tsx` (junto a `'welcome'` y `'libro-de-reclamaciones'`) y envolver su propio contenido en `<StorefrontLayout>` dentro del componente. Si se omite ese paso, Inertia usa el `default` del switch (`AppLayout`, el shell con sidebar del panel admin) para envolver la página pública por error.
- Componentes de dominio del storefront (`Header.tsx`, `Footer.tsx`, `MegaMenu.tsx`, `MobileMenu.tsx`, `HomeSections.tsx`) siguen un estilo deliberadamente distinto al panel admin: funciones simples + Tailwind puro + íconos SVG hechos a mano al final del archivo. **No** usan `lucide-react` ni los componentes de `components/ui/` (esos son del panel admin) — lucide-react tampoco trae íconos de marcas (Facebook/Instagram/TikTok no existen ahí), por eso esos van a mano.
- Para páginas públicas con un formulario real (POST con validación de Laravel), usa el componente `<Form>` de `@inertiajs/react` con el helper generado por Wayfinder (`@/actions/App/Http/Controllers/<Controller>`, se regenera solo al correr `vite build`/`vite dev`, está en `.gitignore`) — es el mismo patrón que ya usan las páginas de auth (`register.tsx`, etc.) y el que sigue `libro-de-reclamaciones.tsx`. Para notificaciones tipo toast tras un submit, usa `Inertia::flash('toast', ['type' => ..., 'message' => ...])` en el controlador (lo consume `useFlashToast`, montado globalmente en `app.tsx`) — **no** el patrón `->with('success', '...')` que usan `ProductoController`/`DistritoController`, que no está conectado a ningún toast y no se ve en pantalla.
- **Tokens de carrito para invitados: usa sesión, no cookies.** En XAMPP local, `Cookie::queue()` / `$request->cookie()` falla silenciosamente por el middleware `EncryptCookies` — el cookie cifrado no puede leerse de vuelta correctamente en desarrollo. Solución: `$request->session()->put('cart_token', $token)` / `$request->session()->get('cart_token')`. La sesión ya funciona (auth/CSRF dependen de ella).
- **`CarritoService::encontrarCarrito()` y `resolverCarrito()` deben tener la misma lógica de fallback.** Si un usuario autenticado no tiene registro en `clientes` (trabajadores, admins), ambos métodos deben caer al path del token de sesión — no asumir que auth siempre implica cliente. Si solo `resolverCarrito` tiene el fallback pero `encontrarCarrito` no, el contador del carrito siempre retorna 0 para esos usuarios.
- **Imágenes de producto: siempre `Storage::url($p->imagen_principal)`.** La columna almacena una ruta relativa al disco `public` (ej. `productos/foto.jpg`). `Storage::url()` la convierte a URL absoluta `/storage/productos/foto.jpg`. `HomeService` tiene un bug histórico usando `/image/productos/` como prefijo — no replicar ese patrón en código nuevo.
- **`CarritoDetalle` no tiene `updated_at`:** declarar `const UPDATED_AT = null;` en el modelo. Sin esto, Eloquent intenta escribir en una columna que no existe y falla en cada update de cantidad.
- **`app.tsx` layout resolver:** toda página nueva del storefront público (no admin) necesita su `case` en el bloque que retorna `null`. Actualmente cubre: `welcome`, `libro-de-reclamaciones`, `cuenta`, `mi-cuenta`, `mi-cuenta-direcciones`, `mi-cuenta-detalles`, `mi-cuenta-seguridad`, prefijo `catalogo/`, prefijo `carrito/`, prefijo `servicios/`, `buscar`, `favoritos`, `ofertas`. El `default` devuelve `AppLayout` (sidebar admin) — omitir el case hace que la página pública aparezca con la barra lateral negra del panel de control.
- **Favoritos en localStorage, no en BD.** No existe tabla `favoritos`. Si en el futuro se quiere persistir en servidor (para clientes autenticados), habrá que crear la tabla y migrar el hook para sincronizar con la API al iniciar sesión.
- **Gestor de paquetes = npm** (estandarizado el 2026-08-27). Se eliminaron `pnpm-lock.yaml`, `pnpm-workspace.yaml`, el `.npmrc` con `ignore-scripts=true` y el campo `packageManager` de `package.json`. El `Dockerfile` ya usaba `npm ci` + `npm run build`. `eslint-import-resolver-typescript` trae `unrs-resolver` (binario nativo vía postinstall) — por eso se quitó `ignore-scripts=true`; sin su build, `eslint` truena en `eslint-module-utils/resolve.js`.
- **`npm run lint:check` / `prettier --check` tienen deuda pre-existente** en muchos archivos del storefront (estilo de 2 espacios + reglas `@stylistic/*` que no se aplicaron mientras eslint estuvo roto). No es regresión; corregirlo es un diff masivo aparte. Los archivos nuevos sí deben pasar `npx eslint <archivo>` limpio. `resources/js/ziggy.js` y `resources/js/{actions,routes,wayfinder}` están en los `ignores` de `eslint.config.js` (son generados).
