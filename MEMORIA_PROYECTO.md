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
| Base de datos | MySQL (`DB_DATABASE=mosso`, vía XAMPP) | — |
| Gestor de paquetes JS | pnpm (`packageManager` fijado en package.json) | 11.22 |
| Análisis estático | PHPStan/Larastan (`phpstan.neon`), ESLint, Prettier, Laravel Pint | — |
| Tests | PHPUnit (`tests/Feature`, `tests/Unit`) | ^12.5 |

Puntos importantes de arquitectura:

- **El esquema de base de datos NO se gestiona con migraciones de Laravel.** Solo existen migraciones para las tablas del starter kit (`users`, `cache`, `jobs`, `passkeys`, columnas 2FA). Las ~50 tablas de negocio (`productos`, `trabajadores`, `pedidos`, etc.) ya existen en la base `mosso` pero fueron creadas fuera de Laravel (dump SQL externo, probablemente phpMyAdmin). **Antes de asumir que una tabla/columna existe o no, verifica contra la base real, no contra `database/migrations/`.**
- **Convención de nombres en español y con prefijos `id_`/`fk_`** en casi todas las tablas de negocio (`id_producto`, `fk_marca`, etc.), a diferencia de las tablas propias de Laravel (`users.id`, en inglés y sin prefijo). Los modelos Eloquent declaran `protected $primaryKey` y `protected $table` explícitamente para adaptarse a esto.
- **Mezcla deliberada de Eloquent y Query Builder crudo (`DB::table(...)`).** Los controladores de escritura simple (Admin\AnimalController, CategoriaController, MarcaController, SubCategoriaController) usan modelos Eloquent. Los controladores con lógica más compleja (`ProductoController`, `TrabajadorController`, `DistritoController`) usan casi exclusivamente `DB::table()` con joins manuales, incluso cuando existe el modelo Eloquent equivalente. Sigue el patrón de cada controlador al modificarlo, no mezcles estilos dentro del mismo archivo.
- **Sin capa de "servicios" uniforme.** Solo existen dos: `HomeService` (arma los datos del home público) y `MenuService` (arma el mega menú). El resto de la lógica vive directamente en los controladores.
- La conexión entre el backend y el frontend por página es siempre vía `Inertia::render('ruta/del/componente', [...props])`, y el nombre debe coincidir exactamente con un archivo en `resources/js/pages/`.

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
                            TrabajadorController (CRUD empleados), DistritoController (CRUD zonas de envío).
  Http/Middleware/          HandleInertiaRequests (props compartidas globales), HandleAppearance (tema claro/oscuro).
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
  components/                 Componentes reutilizables. Los de dominio (Header, MegaMenu, MobileMenu,
                             HomeSections) están en la raíz de components/ con PascalCase; los genéricos
                             de UI (shadcn-style) viven en components/ui/ en kebab-case.
  layouts/                   AppLayout (panel admin, con sidebar) vs StorefrontLayout (tienda pública, con
                             Header/MegaMenu, sin sidebar). No mezclar: cada página Inertia usa uno u otro.
  hooks/                      Hooks de dominio (use-dni-lookup, use-two-factor-auth) y de infraestructura
                             (use-mobile, use-appearance, use-flash-toast).
  types/                      Tipos TS espejo de lo que devuelven los controladores/servicios PHP. Cuando
                             cambies la forma de un prop en un controller/service, actualiza el .ts asociado
                             (producto.ts, trabajador.ts, menu.ts, navigation.ts, ui.ts, auth.ts).
  lib/utils.ts                 Helper cn() (clsx + tailwind-merge), estándar de shadcn.

public/image/                 Assets estáticos servidos directo (logos, categorías, banners). Las imágenes
                             subidas por el admin (productos, marcas) van a storage/app/public vía Storage
                             (disco "public"), NO a esta carpeta.

storage/                      Logs, cache de framework, y storage/app/public (uploads) — estándar Laravel.
tests/                        Solo cobertura del starter kit (auth, perfil, seguridad, dashboard). CERO tests
                             de las features de negocio (productos, trabajadores, distrito, home).
```

## 4. Estructura de la base de datos (`mosso`, MySQL)

La base tiene **55 tablas**. Se agrupan aquí por dominio funcional. Las marcadas **[sin código]** existen en la BD pero ningún modelo/controlador las usa todavía — son terreno fértil para features futuras, pero también significa que no hay ninguna validación de negocio ya resuelta para ellas.

> **Dump de referencia:** existe un export completo (estructura + datos + índices + `FOREIGN KEY` con sus `ON DELETE`/`ON UPDATE`) en `base de datos/mosso.sql` (phpMyAdmin, MariaDB 10.4). **Ese archivo está sin trackear en git** (`git status` lo marca como `??`) — si haces cambios de esquema en la BD, regenera este dump y avisa al usuario si conviene versionarlo, porque hoy es la única fuente escrita del esquema completo fuera de la BD viva. Úsalo también para levantar un entorno nuevo desde cero (`mysql -u root mosso < "base de datos/mosso.sql"`).

**Reglas de integridad relevantes (de los `FOREIGN KEY` del dump, no obvias por el código PHP):**
- `productos` → si se borra un producto, se borran en cascada sus `descuentos`, `producto_imagenes` y cualquier `carrito_detalle` que lo referencie. `pedido_detalle`, en cambio, **no** tiene acción de borrado (RESTRICT por defecto): un producto que ya fue vendido no se puede eliminar mientras exista el pedido. Ningún controlador implementa borrado de productos todavía, pero cualquier futuro `ProductoController::destroy()` debe tener esto en cuenta.
- `direcciones` → `distritos` es solo `ON UPDATE CASCADE`, sin acción de borrado: no se puede borrar un distrito con direcciones asociadas (coincide con la validación manual que ya hace `DistritoController::destroy()` contra `direcciones`).
- `categorias` → `animales` y `sub_categorias` → `categorias` son `NO ACTION` (bloquean el borrado si hay hijos), pero `menus` → `animales`/`tipo_animales` sí es `ON DELETE CASCADE` (borrar un animal borra silenciosamente los ítems de menú que lo usan).
- `trabajadores.fk_user` → `users.id` es `ON DELETE CASCADE` (confirma el comentario de `TrabajadorController::destroy()`); `clientes.fk_user` es `ON DELETE SET NULL`.
- `tipo_animales` hoy solo tiene 2 filas de datos: `Normal` (Perro, Gato) y `Exóticos` (Hámster, Aves, Peces, Conejo) — no es un catálogo por especie, es una agrupación gruesa en dos grupos.

### 4.1 Sistema / framework (gestionadas por Laravel)
`users`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `password_reset_tokens`, `passkeys`, `migrations`.

### 4.2 Personas y accesos
- `personas` (datos base: documento, nombres, apellidos, teléfono, nacimiento) — tabla central compartida por trabajadores y clientes.
- `trabajadores` (`fk_persona`, `fk_user`, `fk_rol`, `fk_direccion`, `fecha_ingreso`, `activo`) — un trabajador es una persona + un `users` + un rol.
- `clientes` (`fk_persona`, `fk_user` nullable, `correo`) **[sin código]** — clientes del storefront, aún no implementado.
- `roles`, `permisos`, `rol_permisos` **[roles usado solo para trabajadores; permisos/rol_permisos sin código]** — hay tabla de permisos granulares pero ningún controlador la consulta; el control de acceso actual es solo `middleware('auth')` a nivel de ruta, no por permiso.
- `tipo_documento` (DNI, CE, RUC, etc.) — usado por personas/trabajadores.

### 4.3 Ubicación geográfica
`departamentos` → `provincias` (`fk_departamento`) → `distritos` (`fk_provincia`, `costo_envio`) → `direcciones` (`fk_distrito`). Jerarquía completa con CRUD ya construido para `distritos` (ver `DistritoController`); departamentos/provincias son de solo lectura (cargados como catálogo).
`cliente_direcciones` **[sin código]** — direcciones guardadas por cliente (para checkout futuro).

### 4.4 Catálogo de productos
Jerarquía: `animales` → `categorias` (`fk_id_animal`) → `sub_categorias` (`fk_id_categoria`) → `productos` (`fk_id_subcategorias`, nullable). **Importante:** `productos` NO tiene `fk_id_animal` directo; el animal se deriva subiendo la cadena subcategoría→categoría→animal (comentado explícitamente en `ProductoController`).
- `animales` también tiene `id_tipo_animal` → `tipo_animales` (para agrupar "exóticos": loro, hámster, etc., por tipo en vez de por especie individual).
- `marcas` (`nombre`, `logo`).
- `unidades_medida`, `estados_producto` (catálogos simples usados como FK en `productos`).
- `descuentos` (`fk_producto`, tipo `porcentaje`/`monto_fijo`, vigencia por fechas, `activo`) — un producto puede tener descuento vigente; la lógica de "descuento activo ahora" vive en `Producto::descuentoActivo()`.
- `producto_imagenes` (`fk_producto`, `url`, `orden`) **[sin código]** — la tabla soporta galería de imágenes por producto, pero hoy `productos.imagen_principal` es la única imagen usada en toda la app.

### 4.5 Menú / navegación
`menus` (`tipo_enlace` enum: `animal`/`tipo_animal`/`marca`/`tipo_servicio`/`url`, `fk_animal`, `fk_tipo_animal`, `orden`, `destacado`, `activo`) — filas 100% data-driven que arman el mega menú del header público. Editable solo por BD directa hoy (no hay UI admin para `menus`).

### 4.6 Carrito y pedidos **[sin código — solo esquema]**
`carritos` (`fk_cliente` o `token_invitado` para invitados) → `carrito_detalle` (`fk_producto`, `cantidad`, `precio_unitario`).
`pedidos` (`fk_cliente`, `fk_direccion_envio`, `fk_tipo_entrega`, `fk_forma_pago`, `fk_estado_pedido`, subtotal/descuento/igv/total) → `pedido_detalle`. `pedido_recojo_terceros` (datos de quien recoge un pedido si no es el cliente). Catálogos de apoyo: `estados_pedido`, `forma_pagos`, `tipo_entregas`.

### 4.7 Facturación **[sin código]**
`comprobantes` (boleta/factura, `fk_pedido`, `fk_tipo_comprobante`, `fk_empresa`, serie/número) — `tipo_comprobante`, `empresa` (datos de la empresa emisora, RUC, dirección), `empresa_redes` + `redes_sociales` (redes sociales de la empresa).

### 4.8 Servicios (peluquería, veterinaria, etc.) **[sin código]**
`servicios` (`fk_tipo_servicio`, nombre del negocio/servicio, responsable, dirección) con tablas satélite: `servicio_beneficios`, `servicio_horarios` (por día de semana), `servicio_imagenes`, `servicio_redes`. Catálogo: `tipos_servicio`. El menú (`menus`, tipo `tipo_servicio`) ya tiene un ítem "Servicios" apuntando a `/servicios`, pero esa ruta/página **no existe todavía**.

## 5. Estado actual del desarrollo

### ✅ Completo y funcional
- **Autenticación completa** (Fortify): login, registro, verificación de email, reset de password, **2FA** y **passkeys/WebAuthn**. Incluye bloqueo de login para trabajadores inactivos (`CheckTrabajadorActivo`, auto-registrado por descubrimiento de eventos de Laravel).
- **Gestión de trabajadores** (`/trabajador`): listado con búsqueda/filtros/orden/paginación server-side vía endpoint JSON (`TrabajadorController::data`), alta y edición completas (reutiliza `personas` si el documento ya existe), activar/desactivar, eliminar (con protección para no auto-eliminarse/desactivarse). Incluye lookup de documento (`buscarDocumento`) con hook de debounce en frontend.
- **Gestión de distritos** (`/distrito`): CRUD completo con validación de nombre único por provincia (con `lockForUpdate` para evitar condiciones de carrera) y bloqueo de borrado si el distrito está en uso por `direcciones`.
- **Alta de productos** (`/admin/productos/create` → `store`): flujo con generación automática de SKU, distinción especial perro/gato (elige subcategoría) vs. exóticos (auto-crea categoría/subcategoría "General"), y "reabastecer" (si el SKU generado ya existe, suma stock en vez de duplicar producto).
- **Listado de productos** (`/admin/productos`): tabla de solo lectura con joins a marca/categoría/animal/unidad/estado.
- **Home público** (`/`): hero banner, barra de beneficios, carruseles de productos destacados/en oferta y marcas — datos armados por `HomeService`.
- **Mega menú dinámico** (header público): 100% data-driven desde la tabla `menus`, con submenús por animal, por tipo de animal (exóticos), marcas y tipos de servicio.

### 🟡 Parcial / con huecos conocidos
- **Productos**: no hay edición ni borrado (ni rutas backend ni UI) — solo alta y listado. No hay UI para gestionar descuentos ni galería de imágenes (`producto_imagenes`) aunque el esquema ya las soporta.
- **Buscador** (`/admin/buscar`, `BusquedaController`): el controlador existe y consulta productos, pero **la página Inertia `resources/js/pages/buscar.tsx` no existe** — la ruta actualmente rompe en tiempo de ejecución (Inertia no puede resolver el componente).
- **Lookup RENIEC**: `TrabajadorController::buscarDocumento` importa `App\Services\ReniecService`, pero **ese archivo no existe**; la llamada real está comentada, así que hoy `buscarDocumento` siempre cae al flujo "nuevo" cuando no encuentra la persona en la BD local. El hook de frontend (`use-dni-lookup.ts`) ya está listo para consumir esta integración en cuanto se implemente.
- **Menú "Clientes"** en el sidebar admin (`app-sidebar.tsx`) apunta a `/client`, ruta que no existe en `routes/web.php` — enlace roto/placeholder.
- **Modelo `App\Models\Menu`**: el método de relación `tipoAnimal()` apunta a `App\Models\TipoAnimal`, que no existe como clase (la tabla real es `tipo_animales`, no usada por ningún modelo). Hoy no truena porque `MenuService` no usa esa relación (consulta `Animal::where('id_tipo_animal', ...)` directo), pero es una landmine si alguien la invoca o hace eager-load.
- **`resources/js/components/MarcaCarrusel.tsx`**: archivo vacío (0 bytes), no referenciado por nadie (el componente real vive en `HomeSections.tsx`). Parece un archivo huérfano de un commit anterior.

### 🔴 No implementado (solo existe el esquema de BD)
- **Carrito de compras** (tablas `carritos`, `carrito_detalle`) — cero código.
- **Checkout / pedidos** (`pedidos`, `pedido_detalle`, `pedido_recojo_terceros`, `estados_pedido`, `forma_pagos`, `tipo_entregas`) — cero código.
- **Comprobantes/facturación** (`comprobantes`, `tipo_comprobante`, `empresa`, `empresa_redes`, `redes_sociales`) — cero código.
- **Clientes** del storefront (`clientes`, `cliente_direcciones`) — cero código (el registro de Fortify crea un `users`, pero nada lo vincula a `clientes`/`personas`).
- **Servicios** (peluquería/veterinaria: `servicios` y sus 4 tablas satélite) — el menú ya enlaza a `/servicios` pero no existe controlador ni página.
- **Roles y permisos granulares** (`permisos`, `rol_permisos`) — la tabla `roles` sí se usa (para trabajadores), pero no hay ningún control de acceso basado en `permisos`; toda la protección actual es `middleware('auth')` a nivel de ruta.
- **Panel `/dashboard`**: existe la ruta y la página, pero es el placeholder de ejemplo del starter kit (bloques `PlaceholderPattern` sin datos reales).
- **Tests de negocio**: no hay ningún test para productos, trabajadores, distrito ni home — toda la suite de tests es del starter kit (auth/perfil/seguridad).

## 6. Flujo de datos principal

### 6.1 Petición típica (cualquier página)
```
Request → routes/web.php (o settings.php)
        → Middleware: HandleAppearance, HandleInertiaRequests, AddLinkHeadersForPreloadedAssets
        → HandleInertiaRequests::share() inyecta en TODAS las páginas:
              name, auth.user, sidebarOpen, menu (vía MenuService::build(), se ejecuta en cada request)
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

### 6.5 Mega menú (se construye en cada request, no es una página aparte)
`MenuService::build()` lee `menus` (activo=true, ordenado) y por cada fila arma sus "columnas" de submenú según `tipo_enlace`: `animal` → categorías+subcategorías de ese animal; `tipo_animal` → lista simple de animales de ese tipo (exóticos); `marca` → todas las marcas; `tipo_servicio` → todos los tipos de servicio; `url` → enlace directo. El resultado tipado en frontend por `types/menu.ts` y consumido por `MegaMenu.tsx`/`MobileMenu.tsx` dentro de `Header.tsx`.

## 7. Convenciones a respetar en trabajo futuro

- Nombres de tablas/columnas de negocio en **español**, con `id_<tabla_singular>` como PK y `fk_<referencia>` como FK. No mezclar con convención inglesa de Laravel salvo en tablas propias del framework.
- Cuando agregues un prop nuevo a un `Inertia::render()`, crea/actualiza el tipo TS correspondiente en `resources/js/types/` — varias páginas ya dependen de que el tipo exista (ver el bug de `types/producto.ts` corregido el 2026-08-24, que rompía todo el build por faltar el archivo).
- Antes de asumir que una tabla existe o tiene cierta columna, consúltala en la BD real (`information_schema` vía tinker, o phpMyAdmin) — no confíes en `database/migrations/`.
- Sigue el patrón de acceso a datos ya usado en el controlador que edites (Eloquent vs. `DB::table`) en vez de mezclar estilos.
- Los endpoints JSON "hermanos" de una página Inertia (ej. `/trabajador/data`, `/distrito/data`) existen para no recargar toda la SPA al filtrar/paginar tablas — replica ese patrón para nuevos listados administrativos en vez de usar Inertia para cada cambio de filtro.
