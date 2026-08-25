-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 25-08-2026 a las 04:59:22
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mosso`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `animales`
--

CREATE TABLE `animales` (
  `id_animal` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `id_tipo_animal` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `animales`
--

INSERT INTO `animales` (`id_animal`, `nombre`, `id_tipo_animal`) VALUES
(1, 'Perro', 1),
(2, 'Gato', 1),
(3, 'Hámster', 2),
(4, 'Aves', 2),
(5, 'Peces', 2),
(6, 'Conejo', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-admin@mosso.pe|127.0.0.1', 'i:1;', 1787633106),
('laravel-cache-admin@mosso.pe|127.0.0.1:timer', 'i:1787633106;', 1787633106),
('laravel-cache-f7cc854707625fe7695d479d754b44dd', 'i:1;', 1787633104),
('laravel-cache-f7cc854707625fe7695d479d754b44dd:timer', 'i:1787633104;', 1787633104);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id_carrito` int(11) NOT NULL,
  `fk_cliente` int(11) DEFAULT NULL,
  `token_invitado` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito_detalle`
--

CREATE TABLE `carrito_detalle` (
  `id_carrito_detalle` int(11) NOT NULL,
  `fk_carrito` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fk_id_animal` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `fk_id_animal`) VALUES
(1, 'Alimentos', 'Alimentos y nutrición para perros', 1),
(2, 'Alimentos Prescripción', 'Alimentos medicados y de prescripción', 1),
(3, 'Farmacia', 'Medicamentos y suplementos', 1),
(4, 'Accesorios y más', 'Accesorios para perros', 1),
(5, 'Higiene y Bienestar', 'Productos de higiene y cuidado', 1),
(6, 'Alimentos', 'Alimentos y nutrición para gatos', 2),
(7, 'Alimentos Prescripción', 'Alimentos medicados y de prescripción', 2),
(8, 'Arenas y más', 'Arenas y accesorios de higiene', 2),
(9, 'Farmacia', 'Medicamentos y suplementos', 2),
(10, 'Accesorios y más', 'Accesorios para gatos', 2),
(11, 'Higiene y Bienestar', 'Productos de higiene y cuidado', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `fk_persona` int(11) NOT NULL,
  `fk_user` bigint(20) UNSIGNED DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente_direcciones`
--

CREATE TABLE `cliente_direcciones` (
  `id_cliente_direccion` int(11) NOT NULL,
  `fk_cliente` int(11) NOT NULL,
  `fk_direccion` int(11) NOT NULL,
  `alias` varchar(50) DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comprobantes`
--

CREATE TABLE `comprobantes` (
  `id_comprobante` int(11) NOT NULL,
  `fk_pedido` int(11) NOT NULL,
  `fk_tipo_comprobante` int(11) NOT NULL,
  `fk_empresa` int(11) NOT NULL,
  `serie` varchar(10) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id_departamento` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `departamentos`
--

INSERT INTO `departamentos` (`id_departamento`, `nombre`) VALUES
(1, 'Amazonas'),
(2, 'Áncash'),
(3, 'Apurímac'),
(4, 'Arequipa'),
(5, 'Ayacucho'),
(6, 'Cajamarca'),
(7, 'Callao'),
(8, 'Cusco'),
(9, 'Huancavelica'),
(10, 'Huánuco'),
(11, 'Ica'),
(12, 'Junín'),
(13, 'La Libertad'),
(14, 'Lambayeque'),
(15, 'Lima'),
(16, 'Loreto'),
(17, 'Madre de Dios'),
(18, 'Moquegua'),
(19, 'Pasco'),
(20, 'Piura'),
(21, 'Puno'),
(22, 'San Martín'),
(23, 'Tacna'),
(24, 'Tumbes'),
(25, 'Ucayali');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `descuentos`
--

CREATE TABLE `descuentos` (
  `id_descuento` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `tipo` enum('porcentaje','monto_fijo') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `descuentos`
--

INSERT INTO `descuentos` (`id_descuento`, `fk_producto`, `tipo`, `valor`, `fecha_inicio`, `fecha_fin`, `activo`, `created_at`) VALUES
(201, 101, 'porcentaje', 15.00, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-08-25 04:37:56'),
(202, 104, 'porcentaje', 20.00, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-08-25 04:37:56'),
(203, 107, 'monto_fijo', 10.00, '2026-08-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-08-25 04:37:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `id_direccion` int(11) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `referencia` varchar(150) DEFAULT NULL,
  `fk_distrito` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `distritos`
--

CREATE TABLE `distritos` (
  `id_distrito` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `costo_envio` decimal(8,2) NOT NULL DEFAULT 0.00,
  `fk_provincia` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `distritos`
--

INSERT INTO `distritos` (`id_distrito`, `nombre`, `costo_envio`, `fk_provincia`) VALUES
(1, 'Lima', 30.00, 128),
(2, 'Ancón', 10.00, 128),
(3, 'Ate', 27.00, 128),
(4, 'Barranco', 20.00, 128),
(5, 'Breña', 35.00, 128),
(6, 'Carabayllo', 28.00, 128),
(7, 'Chaclacayo', 23.00, 128),
(8, 'Chorrillos', 23.00, 128),
(9, 'Cieneguilla', 11.00, 128),
(10, 'Comas', 29.00, 128),
(11, 'El Agustino', 26.00, 128),
(12, 'Independencia', 30.00, 128),
(13, 'Jesús María', 12.00, 128),
(14, 'La Molina', 14.00, 128),
(15, 'La Victoria', 22.00, 128),
(16, 'Lince', 35.00, 128),
(17, 'Los Olivos', 21.00, 128),
(18, 'Lurigancho-Chosica', 18.00, 128),
(19, 'Lurín', 16.00, 128),
(20, 'Magdalena del Mar', 18.00, 128),
(21, 'Miraflores', 33.00, 128),
(22, 'Pachacámac', 21.00, 128),
(23, 'Pucusana', 23.00, 128),
(24, 'Pueblo Libre', 17.00, 128),
(25, 'Puente Piedra', 30.00, 128),
(26, 'Punta Hermosa', 15.00, 128),
(27, 'Punta Negra', 25.00, 128),
(28, 'Rímac', 18.00, 128),
(29, 'San Bartolo', 34.00, 128),
(30, 'San Borja', 26.00, 128),
(31, 'San Isidro', 18.00, 128),
(32, 'San Juan de Lurigancho', 27.00, 128),
(33, 'San Juan de Miraflores', 23.00, 128),
(34, 'San Luis', 24.00, 128),
(35, 'San Martín de Porres', 16.00, 128),
(36, 'San Miguel', 25.00, 128),
(37, 'Santa Anita', 15.00, 128),
(38, 'Santa María del Mar', 15.00, 128),
(39, 'Santa Rosa', 23.00, 128),
(40, 'Santiago de Surco', 35.00, 128),
(41, 'Surquillo', 18.00, 128),
(42, 'Villa El Salvador', 25.00, 128),
(43, 'Villa María del Triunfo', 13.00, 128),
(44, 'Callao', 30.00, 66),
(45, 'Bellavista', 26.00, 66),
(46, 'Carmen de La Legua-Reynoso', 29.00, 66),
(47, 'La Perla', 33.00, 66),
(48, 'La Punta', 14.00, 66),
(49, 'Ventanilla', 13.00, 66),
(50, 'Mi Perú', 15.00, 66);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `id_empresa` int(11) NOT NULL,
  `ruc` varchar(11) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `nombre_comercial` varchar(150) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `fk_direccion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa_redes`
--

CREATE TABLE `empresa_redes` (
  `id_empresa_red` int(11) NOT NULL,
  `fk_empresa` int(11) NOT NULL,
  `fk_red` int(11) NOT NULL,
  `url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados_pedido`
--

CREATE TABLE `estados_pedido` (
  `id_estado_pedido` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados_producto`
--

CREATE TABLE `estados_producto` (
  `id_estado_producto` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estados_producto`
--

INSERT INTO `estados_producto` (`id_estado_producto`, `nombre`) VALUES
(1, 'Activo'),
(2, 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `forma_pagos`
--

CREATE TABLE `forma_pagos` (
  `id_forma_pago` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcas`
--

CREATE TABLE `marcas` (
  `id_marca` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `logo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `marcas`
--

INSERT INTO `marcas` (`id_marca`, `nombre`, `logo`) VALUES
(1, 'Royal Canin', 'royal-canin.png'),
(2, 'Purina Pro Plan', 'pro-plan.png'),
(3, 'Hill\'s Science Diet', 'hills.png'),
(4, 'Eukanuba', 'eukanuba.png'),
(5, 'Iams', 'iams.png'),
(6, 'Pedigree', 'pedigree.png'),
(7, 'Whiskas', 'whiskas.png'),
(8, 'Friskies', 'friskies.png'),
(9, 'Sheba', NULL),
(10, 'Vitakraft', NULL),
(11, 'Beaphar', NULL),
(12, 'Seresto', NULL),
(13, 'Bravecto', 'bravecto.png'),
(14, 'NexGard', NULL),
(15, 'Simparica', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menus`
--

CREATE TABLE `menus` (
  `id_menu` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `tipo_enlace` enum('animal','tipo_animal','marca','tipo_servicio','url') NOT NULL,
  `fk_animal` int(11) DEFAULT NULL,
  `fk_tipo_animal` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `destacado` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `menus`
--

INSERT INTO `menus` (`id_menu`, `nombre`, `tipo_enlace`, `fk_animal`, `fk_tipo_animal`, `url`, `icono`, `orden`, `destacado`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Perros', 'animal', 1, NULL, NULL, '🐶', 1, 0, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58'),
(2, 'Gatos', 'animal', 2, NULL, NULL, '🐱', 2, 0, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58'),
(3, 'Exóticos', 'tipo_animal', NULL, 2, NULL, NULL, 3, 0, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58'),
(4, 'Marca', 'marca', NULL, NULL, NULL, NULL, 4, 0, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58'),
(5, 'Servicios', 'tipo_servicio', NULL, NULL, NULL, NULL, 5, 0, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58'),
(6, 'Ofertas', 'url', NULL, NULL, '/ofertas', '🔥', 6, 1, 1, '2026-08-24 21:07:58', '2026-08-24 21:07:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `passkeys`
--

CREATE TABLE `passkeys` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `credential_id` varchar(255) NOT NULL,
  `credential` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `fk_cliente` int(11) NOT NULL,
  `fk_direccion_envio` int(11) DEFAULT NULL,
  `fk_tipo_entrega` int(11) NOT NULL,
  `fk_forma_pago` int(11) NOT NULL,
  `fk_estado_pedido` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `igv` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_detalle`
--

CREATE TABLE `pedido_detalle` (
  `id_pedido_detalle` int(11) NOT NULL,
  `fk_pedido` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_recojo_terceros`
--

CREATE TABLE `pedido_recojo_terceros` (
  `id_pedido_recojo_tercero` int(11) NOT NULL,
  `fk_pedido` int(11) NOT NULL,
  `fk_tipo_documento` int(11) NOT NULL,
  `num_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id_permiso` int(11) NOT NULL,
  `clave` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL,
  `fk_tipo_documento` int(11) NOT NULL,
  `num_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellido_paterno` varchar(100) NOT NULL,
  `apellido_materno` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fk_marca` int(11) NOT NULL,
  `fk_unidad_medida` int(11) NOT NULL,
  `fk_id_subcategorias` int(11) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `imagen_principal` varchar(255) DEFAULT NULL,
  `fk_estado` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `sku`, `nombre`, `descripcion`, `fk_marca`, `fk_unidad_medida`, `fk_id_subcategorias`, `precio`, `stock`, `imagen_principal`, `fk_estado`, `created_at`, `updated_at`) VALUES
(1, 'GAT-BRA-MICHILON', 'michilon', '50ok de michilon para tus gatas', 13, 5, 37, 50.00, 1, 'productos/Zj9zC7fwWumSzxpIgN3Y3pSSEjrOM9m4jJwDuNfI.jpg', 1, '2026-08-24 20:23:14', '2026-08-24 20:23:14'),
(101, 'RC-001', 'Royal Canin Adulto Razas Medianas 15kg', 'Alimento seco para perros adultos', 1, 1, 1, 289.90, 25, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(102, 'PP-002', 'Pro Plan Cachorro Pollo y Arroz 15kg', 'Alimento seco para cachorros', 2, 1, 1, 259.90, 18, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(103, 'HD-003', 'Hill\'s Science Diet Gato Esterilizado 3kg', 'Alimento para gatos esterilizados', 3, 1, 6, 145.00, 12, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(104, 'PED-004', 'Pedigree Adulto Carne 21kg', 'Alimento económico para perros adultos', 6, 1, 1, 179.90, 30, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(105, 'WHI-005', 'Whiskas Adulto Pescado 7kg', 'Alimento seco para gatos adultos', 7, 1, 6, 89.90, 20, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(106, 'JUG-006', 'Pelota de goma resistente', 'Juguete para perros medianos y grandes', 1, 5, 18, 19.90, 50, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56'),
(107, 'BRV-007', 'Bravecto Antipulgas 10-20kg', 'Tableta antipulgas y garrapatas, 1 unidad', 13, 5, 26, 65.00, 15, NULL, 1, '2026-08-25 04:37:56', '2026-08-25 04:37:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_imagenes`
--

CREATE TABLE `producto_imagenes` (
  `id_producto_imagen` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `provincias`
--

CREATE TABLE `provincias` (
  `id_provincia` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `fk_departamento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `provincias`
--

INSERT INTO `provincias` (`id_provincia`, `nombre`, `fk_departamento`) VALUES
(1, 'Chachapoyas', 1),
(2, 'Bagua', 1),
(3, 'Bongará', 1),
(4, 'Condorcanqui', 1),
(5, 'Luya', 1),
(6, 'Rodríguez de Mendoza', 1),
(7, 'Utcubamba', 1),
(8, 'Huaraz', 2),
(9, 'Aija', 2),
(10, 'Antonio Raimondi', 2),
(11, 'Asunción', 2),
(12, 'Bolognesi', 2),
(13, 'Carhuaz', 2),
(14, 'Carlos Fermín Fitzcarrald', 2),
(15, 'Casma', 2),
(16, 'Corongo', 2),
(17, 'Huari', 2),
(18, 'Huarmey', 2),
(19, 'Huaylas', 2),
(20, 'Mariscal Luzuriaga', 2),
(21, 'Ocros', 2),
(22, 'Pallasca', 2),
(23, 'Pomabamba', 2),
(24, 'Recuay', 2),
(25, 'Santa', 2),
(26, 'Sihuas', 2),
(27, 'Yungay', 2),
(28, 'Abancay', 3),
(29, 'Andahuaylas', 3),
(30, 'Antabamba', 3),
(31, 'Aymaraes', 3),
(32, 'Cotabambas', 3),
(33, 'Chincheros', 3),
(34, 'Grau', 3),
(35, 'Arequipa', 4),
(36, 'Camaná', 4),
(37, 'Caravelí', 4),
(38, 'Castilla', 4),
(39, 'Caylloma', 4),
(40, 'Condesuyos', 4),
(41, 'Islay', 4),
(42, 'La Unión', 4),
(43, 'Huamanga', 5),
(44, 'Cangallo', 5),
(45, 'Huanca Sancos', 5),
(46, 'Huanta', 5),
(47, 'La Mar', 5),
(48, 'Lucanas', 5),
(49, 'Parinacochas', 5),
(50, 'Paucar del Sara Sara', 5),
(51, 'Sucre', 5),
(52, 'Víctor Fajardo', 5),
(53, 'Vilcas Huamán', 5),
(54, 'Cajamarca', 6),
(55, 'Cajabamba', 6),
(56, 'Celendín', 6),
(57, 'Chota', 6),
(58, 'Contumazá', 6),
(59, 'Cutervo', 6),
(60, 'Hualgayoc', 6),
(61, 'Jaén', 6),
(62, 'San Ignacio', 6),
(63, 'San Marcos', 6),
(64, 'San Miguel', 6),
(65, 'San Pablo', 6),
(66, 'Santa Cruz', 6),
(67, 'Callao', 7),
(68, 'Cusco', 8),
(69, 'Acomayo', 8),
(70, 'Anta', 8),
(71, 'Calca', 8),
(72, 'Canas', 8),
(73, 'Canchis', 8),
(74, 'Chumbivilcas', 8),
(75, 'Espinar', 8),
(76, 'La Convención', 8),
(77, 'Paruro', 8),
(78, 'Paucartambo', 8),
(79, 'Quispicanchi', 8),
(80, 'Urubamba', 8),
(81, 'Huancavelica', 9),
(82, 'Acobamba', 9),
(83, 'Angaraes', 9),
(84, 'Castrovirreyna', 9),
(85, 'Churcampa', 9),
(86, 'Huaytará', 9),
(87, 'Tayacaja', 9),
(88, 'Huánuco', 10),
(89, 'Ambo', 10),
(90, 'Dos de Mayo', 10),
(91, 'Huacaybamba', 10),
(92, 'Huamalíes', 10),
(93, 'Leoncio Prado', 10),
(94, 'Marañón', 10),
(95, 'Pachitea', 10),
(96, 'Puerto Inca', 10),
(97, 'Lauricocha', 10),
(98, 'Yarowilca', 10),
(99, 'Ica', 11),
(100, 'Chincha', 11),
(101, 'Nazca', 11),
(102, 'Palpa', 11),
(103, 'Pisco', 11),
(104, 'Huancayo', 12),
(105, 'Concepción', 12),
(106, 'Chanchamayo', 12),
(107, 'Jauja', 12),
(108, 'Junín', 12),
(109, 'Satipo', 12),
(110, 'Tarma', 12),
(111, 'Yauli', 12),
(112, 'Chupaca', 12),
(113, 'Trujillo', 13),
(114, 'Ascope', 13),
(115, 'Bolívar', 13),
(116, 'Chepén', 13),
(117, 'Julcán', 13),
(118, 'Otuzco', 13),
(119, 'Pacasmayo', 13),
(120, 'Pataz', 13),
(121, 'Sánchez Carrión', 13),
(122, 'Santiago de Chuco', 13),
(123, 'Gran Chimú', 13),
(124, 'Virú', 13),
(125, 'Chiclayo', 14),
(126, 'Ferreñafe', 14),
(127, 'Lambayeque', 14),
(128, 'Lima', 15),
(129, 'Barranca', 15),
(130, 'Cajatambo', 15),
(131, 'Canta', 15),
(132, 'Cañete', 15),
(133, 'Huaral', 15),
(134, 'Huarochirí', 15),
(135, 'Huaura', 15),
(136, 'Oyón', 15),
(137, 'Yauyos', 15),
(138, 'Maynas', 16),
(139, 'Alto Amazonas', 16),
(140, 'Loreto', 16),
(141, 'Mariscal Ramón Castilla', 16),
(142, 'Requena', 16),
(143, 'Ucayali', 16),
(144, 'Datem del Marañón', 16),
(145, 'Putumayo', 16),
(146, 'Tambopata', 17),
(147, 'Manu', 17),
(148, 'Tahuamanu', 17),
(149, 'Mariscal Nieto', 18),
(150, 'General Sánchez Cerro', 18),
(151, 'Ilo', 18),
(152, 'Pasco', 19),
(153, 'Daniel Alcides Carrión', 19),
(154, 'Oxapampa', 19),
(155, 'Piura', 20),
(156, 'Ayabaca', 20),
(157, 'Huancabamba', 20),
(158, 'Morropón', 20),
(159, 'Paita', 20),
(160, 'Sullana', 20),
(161, 'Talara', 20),
(162, 'Sechura', 20),
(163, 'Puno', 21),
(164, 'Azángaro', 21),
(165, 'Carabaya', 21),
(166, 'Chucuito', 21),
(167, 'El Collao', 21),
(168, 'Huancané', 21),
(169, 'Lampa', 21),
(170, 'Melgar', 21),
(171, 'Moho', 21),
(172, 'San Antonio de Putina', 21),
(173, 'San Román', 21),
(174, 'Sandia', 21),
(175, 'Yunguyo', 21),
(176, 'Moyobamba', 22),
(177, 'Bellavista', 22),
(178, 'El Dorado', 22),
(179, 'Huallaga', 22),
(180, 'Lamas', 22),
(181, 'Mariscal Cáceres', 22),
(182, 'Picota', 22),
(183, 'Rioja', 22),
(184, 'San Martín', 22),
(185, 'Tocache', 22),
(186, 'Tacna', 23),
(187, 'Candarave', 23),
(188, 'Jorge Basadre', 23),
(189, 'Tarata', 23),
(190, 'Tumbes', 24),
(191, 'Contralmirante Villar', 24),
(192, 'Zarumilla', 24),
(193, 'Coronel Portillo', 25),
(194, 'Atalaya', 25),
(195, 'Padre Abad', 25),
(196, 'Purús', 25);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `redes_sociales`
--

CREATE TABLE `redes_sociales` (
  `id_red_social` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`) VALUES
(1, 'Administrador', 'Acceso total al sistema, gestión de usuarios, roles, configuraciones y reportes.'),
(2, 'Vendedor', 'Gestión de ventas, atención a clientes, emisión de comprobantes y pedidos.'),
(3, 'Almacenero', 'Control de inventario, recepción de mercadería, despachos y gestión de stock.'),
(4, 'Cliente', 'Acceso restringido al portal para realizar compras, ver pedidos y dar seguimiento a envíos.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_permisos`
--

CREATE TABLE `rol_permisos` (
  `fk_rol` int(11) NOT NULL,
  `fk_permiso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_servicio` int(11) NOT NULL,
  `fk_tipo_servicio` int(11) NOT NULL,
  `nombre_negocio` varchar(150) NOT NULL,
  `nombre_servicio` varchar(150) NOT NULL,
  `responsable` varchar(150) DEFAULT NULL,
  `foto_responsable` varchar(255) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `telefono_contacto` varchar(20) DEFAULT NULL,
  `correo_contacto` varchar(150) DEFAULT NULL,
  `fk_direccion` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_beneficios`
--

CREATE TABLE `servicio_beneficios` (
  `id_servicio_beneficio` int(11) NOT NULL,
  `fk_servicio` int(11) NOT NULL,
  `icono` varchar(45) DEFAULT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_horarios`
--

CREATE TABLE `servicio_horarios` (
  `id_servicio_horario` int(11) NOT NULL,
  `fk_servicio` int(11) NOT NULL,
  `dia_semana` varchar(15) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_imagenes`
--

CREATE TABLE `servicio_imagenes` (
  `id_servicio_imagen` int(11) NOT NULL,
  `fk_servicio` int(11) NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_redes`
--

CREATE TABLE `servicio_redes` (
  `id_servicio_red` int(11) NOT NULL,
  `fk_servicio` int(11) NOT NULL,
  `fk_red` int(11) NOT NULL,
  `link` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('PFp8ghE5lsev5Mv76YlM4pDIHWUks9bFfjtVnDSw', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJBTDMxYnRxd1lPek56ZXZBNlZsQ1Z2OEZUSURYOUVpWTRYaDF4MlAyIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1787633320);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sub_categorias`
--

CREATE TABLE `sub_categorias` (
  `id_subcategorias` int(11) NOT NULL,
  `nom_sub_categoria` varchar(105) DEFAULT NULL,
  `fk_id_categoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sub_categorias`
--

INSERT INTO `sub_categorias` (`id_subcategorias`, `nom_sub_categoria`, `fk_id_categoria`) VALUES
(1, 'Alimento Seco', 1),
(2, 'Alimento Húmedo', 1),
(3, 'Alimento BARF', 1),
(4, 'Granel', 1),
(5, 'Snacks y Sazonadores', 1),
(6, 'Alimento Medicado Seco', 2),
(7, 'Alimento Medicado Húmedo', 2),
(8, 'Antiinflamatorios', 3),
(9, 'Cuidado del Hígado', 3),
(10, 'Vitaminas y Suplementos', 3),
(11, 'Cuidado de la Piel', 3),
(12, 'Cuidado del Oído', 3),
(13, 'Cuidado Ocular', 3),
(14, 'Fórmulas para Perritos', 3),
(15, 'Antisépticos', 3),
(16, 'Calmantes', 3),
(17, 'Antibióticos', 3),
(18, 'Juguetes', 4),
(19, 'Camas', 4),
(20, 'Transportadores', 4),
(21, 'Ropa', 4),
(22, 'Collares y Correas', 4),
(23, 'Bozales', 4),
(24, 'Platos y Bebederos', 4),
(25, 'Fuentes de Agua', 4),
(26, 'Antipulgas', 5),
(27, 'Antiparasitarios', 5),
(28, 'Shampoo', 5),
(29, 'Pañales', 5),
(30, 'Toallitas Húmedas', 5),
(31, 'Entrenamiento', 5),
(32, 'Porta Bolsas y Bolsas Multiusos', 5),
(33, 'Cuidado Oral', 5),
(34, 'Peines y Cepillos', 5),
(35, 'Colonias y Perfumes', 5),
(36, 'Alimento Seco', 6),
(37, 'Alimento Húmedo', 6),
(38, 'Alimento BARF', 6),
(39, 'Granel', 6),
(40, 'Snacks y Sazonadores', 6),
(41, 'Alimento Medicado Seco', 7),
(42, 'Alimento Medicado Húmedo', 7),
(43, 'Arenas', 8),
(44, 'Areneros y Palitas', 8),
(45, 'Antiinflamatorios', 9),
(46, 'Cuidado del Hígado', 9),
(47, 'Vitaminas y Suplementos', 9),
(48, 'Cuidado de la Piel', 9),
(49, 'Cuidado del Oído', 9),
(50, 'Cuidado Ocular', 9),
(51, 'Fórmulas para Gatitos', 9),
(52, 'Antisépticos', 9),
(53, 'Calmantes', 9),
(54, 'Antibióticos', 9),
(55, 'Rascadores', 10),
(56, 'Fuentes de Agua', 10),
(57, 'Juguetes', 10),
(58, 'Catnip', 10),
(59, 'Camas', 10),
(60, 'Platos y Bebederos', 10),
(61, 'Collares y Correas', 10),
(62, 'Transportadores', 10),
(63, 'Antipulgas', 11),
(64, 'Antiparasitarios', 11),
(65, 'Shampoo', 11),
(66, 'Toallitas Húmedas', 11),
(67, 'Entrenamiento', 11),
(68, 'Porta Bolsas y Bolsas Multiusos', 11),
(69, 'Cuidado Oral', 11),
(70, 'Peines y Cepillos', 11),
(71, 'Colonias y Perfumes', 11);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_servicio`
--

CREATE TABLE `tipos_servicio` (
  `id_tipo_servicio` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipos_servicio`
--

INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre`) VALUES
(1, 'Grooming'),
(2, 'Veterinaria');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_animales`
--

CREATE TABLE `tipo_animales` (
  `id_tipo_animal` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_animales`
--

INSERT INTO `tipo_animales` (`id_tipo_animal`, `nombre`, `created_at`) VALUES
(1, 'Normal', '2026-08-24 19:55:04'),
(2, 'Exóticos', '2026-08-24 19:55:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_comprobante`
--

CREATE TABLE `tipo_comprobante` (
  `id_tipo_comprobante` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_documento`
--

CREATE TABLE `tipo_documento` (
  `id_tipo_documento` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_entregas`
--

CREATE TABLE `tipo_entregas` (
  `id_tipo_entrega` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `requiere_direccion` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajadores`
--

CREATE TABLE `trabajadores` (
  `id_trabajador` int(11) NOT NULL,
  `fk_persona` int(11) NOT NULL,
  `fk_user` bigint(20) UNSIGNED NOT NULL,
  `fk_rol` int(11) NOT NULL,
  `fk_direccion` int(11) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_medida`
--

CREATE TABLE `unidades_medida` (
  `id_unidad_medida` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `abreviatura` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `unidades_medida`
--

INSERT INTO `unidades_medida` (`id_unidad_medida`, `nombre`, `abreviatura`) VALUES
(1, 'Kilogramo', 'kg'),
(2, 'Gramo', 'g'),
(3, 'Litro', 'L'),
(4, 'Mililitro', 'ml'),
(5, 'Unidad', 'unid'),
(6, 'Paquete', 'paq'),
(7, 'Caja', 'caja'),
(8, 'Frasco', 'frasco');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_recovery_codes` text DEFAULT NULL,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(2, 'mili', 'jonceano26cristian@gmail.com', NULL, '$2y$12$O7xkFKqSccWzhFanFV1DkuB991QAxnJyXfpko7W62GaNa2aDh.cCm', NULL, NULL, NULL, NULL, '2026-08-24 20:20:10', '2026-08-24 20:20:10'),
(3, 'Heiner', 'diego@mosso.com', NULL, '$2y$12$Du3HuTSknD3jDbch9dBl5.KNa3PGeQSBuvkwdiT2B3JiNriHwUXtG', NULL, NULL, NULL, NULL, '2026-08-25 04:44:42', '2026-08-25 04:44:42');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `animales`
--
ALTER TABLE `animales`
  ADD PRIMARY KEY (`id_animal`),
  ADD KEY `fk_animales_tipo_animal` (`id_tipo_animal`);

--
-- Indices de la tabla `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indices de la tabla `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indices de la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id_carrito`),
  ADD KEY `fk_carritos_cliente_idx` (`fk_cliente`),
  ADD KEY `carritos_token_invitado_idx` (`token_invitado`);

--
-- Indices de la tabla `carrito_detalle`
--
ALTER TABLE `carrito_detalle`
  ADD PRIMARY KEY (`id_carrito_detalle`),
  ADD UNIQUE KEY `carrito_detalle_carrito_producto_unique` (`fk_carrito`,`fk_producto`),
  ADD KEY `fk_carrito_detalle_producto_idx` (`fk_producto`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD KEY `fk_categorias_animales1_idx` (`fk_id_animal`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `clientes_fk_persona_unique` (`fk_persona`),
  ADD UNIQUE KEY `clientes_correo_unique` (`correo`),
  ADD UNIQUE KEY `clientes_fk_user_unique` (`fk_user`);

--
-- Indices de la tabla `cliente_direcciones`
--
ALTER TABLE `cliente_direcciones`
  ADD PRIMARY KEY (`id_cliente_direccion`),
  ADD KEY `fk_cliente_direcciones_cliente_idx` (`fk_cliente`),
  ADD KEY `fk_cliente_direcciones_direccion_idx` (`fk_direccion`);

--
-- Indices de la tabla `comprobantes`
--
ALTER TABLE `comprobantes`
  ADD PRIMARY KEY (`id_comprobante`),
  ADD UNIQUE KEY `comprobantes_fk_pedido_unique` (`fk_pedido`),
  ADD UNIQUE KEY `comprobantes_serie_numero_unique` (`serie`,`numero`),
  ADD KEY `fk_comprobantes_tipo_comprobante_idx` (`fk_tipo_comprobante`),
  ADD KEY `fk_comprobantes_empresa_idx` (`fk_empresa`);

--
-- Indices de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id_departamento`);

--
-- Indices de la tabla `descuentos`
--
ALTER TABLE `descuentos`
  ADD PRIMARY KEY (`id_descuento`),
  ADD KEY `fk_descuentos_producto_idx` (`fk_producto`),
  ADD KEY `descuentos_vigencia_idx` (`fecha_inicio`,`fecha_fin`);

--
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id_direccion`),
  ADD KEY `fk_direcciones_distritos_idx` (`fk_distrito`);

--
-- Indices de la tabla `distritos`
--
ALTER TABLE `distritos`
  ADD PRIMARY KEY (`id_distrito`),
  ADD KEY `fk_distritos_provincias_idx` (`fk_provincia`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id_empresa`),
  ADD KEY `fk_empresa_direccion_idx` (`fk_direccion`);

--
-- Indices de la tabla `empresa_redes`
--
ALTER TABLE `empresa_redes`
  ADD PRIMARY KEY (`id_empresa_red`),
  ADD KEY `fk_empresa_redes_empresa_idx` (`fk_empresa`),
  ADD KEY `fk_empresa_redes_red_idx` (`fk_red`);

--
-- Indices de la tabla `estados_pedido`
--
ALTER TABLE `estados_pedido`
  ADD PRIMARY KEY (`id_estado_pedido`);

--
-- Indices de la tabla `estados_producto`
--
ALTER TABLE `estados_producto`
  ADD PRIMARY KEY (`id_estado_producto`);

--
-- Indices de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indices de la tabla `forma_pagos`
--
ALTER TABLE `forma_pagos`
  ADD PRIMARY KEY (`id_forma_pago`);

--
-- Indices de la tabla `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indices de la tabla `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `marcas`
--
ALTER TABLE `marcas`
  ADD PRIMARY KEY (`id_marca`);

--
-- Indices de la tabla `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`id_menu`),
  ADD KEY `fk_menus_animal_idx` (`fk_animal`),
  ADD KEY `fk_menus_tipo_animal_idx` (`fk_tipo_animal`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `passkeys`
--
ALTER TABLE `passkeys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `passkeys_credential_id_unique` (`credential_id`),
  ADD KEY `passkeys_user_id_index` (`user_id`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `fk_pedidos_cliente_idx` (`fk_cliente`),
  ADD KEY `fk_pedidos_direccion_envio_idx` (`fk_direccion_envio`),
  ADD KEY `fk_pedidos_tipo_entrega_idx` (`fk_tipo_entrega`),
  ADD KEY `fk_pedidos_forma_pago_idx` (`fk_forma_pago`),
  ADD KEY `fk_pedidos_estado_pedido_idx` (`fk_estado_pedido`);

--
-- Indices de la tabla `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  ADD PRIMARY KEY (`id_pedido_detalle`),
  ADD KEY `fk_pedido_detalle_pedido_idx` (`fk_pedido`),
  ADD KEY `fk_pedido_detalle_producto_idx` (`fk_producto`);

--
-- Indices de la tabla `pedido_recojo_terceros`
--
ALTER TABLE `pedido_recojo_terceros`
  ADD PRIMARY KEY (`id_pedido_recojo_tercero`),
  ADD UNIQUE KEY `pedido_recojo_terceros_fk_pedido_unique` (`fk_pedido`),
  ADD KEY `fk_pedido_recojo_terceros_tipo_documento_idx` (`fk_tipo_documento`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id_permiso`),
  ADD UNIQUE KEY `permisos_clave_unique` (`clave`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `personas_num_documento_unique` (`num_documento`),
  ADD KEY `fk_personas_tipo_documento_idx` (`fk_tipo_documento`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD UNIQUE KEY `productos_sku_unique` (`sku`),
  ADD KEY `fk_productos_marca_idx` (`fk_marca`),
  ADD KEY `fk_productos_unidad_medida_idx` (`fk_unidad_medida`),
  ADD KEY `fk_productos_estado_idx` (`fk_estado`),
  ADD KEY `fk_productos_sub_categorias1_idx` (`fk_id_subcategorias`);

--
-- Indices de la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  ADD PRIMARY KEY (`id_producto_imagen`),
  ADD KEY `fk_producto_imagenes_producto_idx` (`fk_producto`);

--
-- Indices de la tabla `provincias`
--
ALTER TABLE `provincias`
  ADD PRIMARY KEY (`id_provincia`),
  ADD KEY `fk_provincias_departamentos_idx` (`fk_departamento`);

--
-- Indices de la tabla `redes_sociales`
--
ALTER TABLE `redes_sociales`
  ADD PRIMARY KEY (`id_red_social`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `roles_nombre_unique` (`nombre`);

--
-- Indices de la tabla `rol_permisos`
--
ALTER TABLE `rol_permisos`
  ADD PRIMARY KEY (`fk_rol`,`fk_permiso`),
  ADD KEY `fk_rol_permisos_permiso_idx` (`fk_permiso`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_servicio`),
  ADD KEY `fk_servicios_tipo_servicio_idx` (`fk_tipo_servicio`),
  ADD KEY `fk_servicios_direccion_idx` (`fk_direccion`);

--
-- Indices de la tabla `servicio_beneficios`
--
ALTER TABLE `servicio_beneficios`
  ADD PRIMARY KEY (`id_servicio_beneficio`),
  ADD KEY `fk_servicio_beneficios_servicio_idx` (`fk_servicio`);

--
-- Indices de la tabla `servicio_horarios`
--
ALTER TABLE `servicio_horarios`
  ADD PRIMARY KEY (`id_servicio_horario`),
  ADD KEY `fk_servicio_horarios_servicio_idx` (`fk_servicio`);

--
-- Indices de la tabla `servicio_imagenes`
--
ALTER TABLE `servicio_imagenes`
  ADD PRIMARY KEY (`id_servicio_imagen`),
  ADD KEY `fk_servicio_imagenes_servicio_idx` (`fk_servicio`);

--
-- Indices de la tabla `servicio_redes`
--
ALTER TABLE `servicio_redes`
  ADD PRIMARY KEY (`id_servicio_red`),
  ADD KEY `fk_servicio_redes_servicio_idx` (`fk_servicio`),
  ADD KEY `fk_servicio_redes_red_idx` (`fk_red`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indices de la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  ADD PRIMARY KEY (`id_subcategorias`),
  ADD KEY `fk_sub_categorias_categorias1_idx` (`fk_id_categoria`);

--
-- Indices de la tabla `tipos_servicio`
--
ALTER TABLE `tipos_servicio`
  ADD PRIMARY KEY (`id_tipo_servicio`);

--
-- Indices de la tabla `tipo_animales`
--
ALTER TABLE `tipo_animales`
  ADD PRIMARY KEY (`id_tipo_animal`);

--
-- Indices de la tabla `tipo_comprobante`
--
ALTER TABLE `tipo_comprobante`
  ADD PRIMARY KEY (`id_tipo_comprobante`);

--
-- Indices de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  ADD PRIMARY KEY (`id_tipo_documento`);

--
-- Indices de la tabla `tipo_entregas`
--
ALTER TABLE `tipo_entregas`
  ADD PRIMARY KEY (`id_tipo_entrega`);

--
-- Indices de la tabla `trabajadores`
--
ALTER TABLE `trabajadores`
  ADD PRIMARY KEY (`id_trabajador`),
  ADD UNIQUE KEY `trabajadores_fk_persona_unique` (`fk_persona`),
  ADD UNIQUE KEY `trabajadores_fk_user_unique` (`fk_user`),
  ADD KEY `fk_trabajadores_rol_idx` (`fk_rol`),
  ADD KEY `fk_trabajadores_direccion_idx` (`fk_direccion`);

--
-- Indices de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  ADD PRIMARY KEY (`id_unidad_medida`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `animales`
--
ALTER TABLE `animales`
  MODIFY `id_animal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `carritos`
--
ALTER TABLE `carritos`
  MODIFY `id_carrito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `carrito_detalle`
--
ALTER TABLE `carrito_detalle`
  MODIFY `id_carrito_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cliente_direcciones`
--
ALTER TABLE `cliente_direcciones`
  MODIFY `id_cliente_direccion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comprobantes`
--
ALTER TABLE `comprobantes`
  MODIFY `id_comprobante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `descuentos`
--
ALTER TABLE `descuentos`
  MODIFY `id_descuento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=204;

--
-- AUTO_INCREMENT de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  MODIFY `id_direccion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `distritos`
--
ALTER TABLE `distritos`
  MODIFY `id_distrito` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empresa_redes`
--
ALTER TABLE `empresa_redes`
  MODIFY `id_empresa_red` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estados_pedido`
--
ALTER TABLE `estados_pedido`
  MODIFY `id_estado_pedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estados_producto`
--
ALTER TABLE `estados_producto`
  MODIFY `id_estado_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `forma_pagos`
--
ALTER TABLE `forma_pagos`
  MODIFY `id_forma_pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `marcas`
--
ALTER TABLE `marcas`
  MODIFY `id_marca` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `menus`
--
ALTER TABLE `menus`
  MODIFY `id_menu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `passkeys`
--
ALTER TABLE `passkeys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  MODIFY `id_pedido_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido_recojo_terceros`
--
ALTER TABLE `pedido_recojo_terceros`
  MODIFY `id_pedido_recojo_tercero` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id_permiso` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT de la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  MODIFY `id_producto_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `provincias`
--
ALTER TABLE `provincias`
  MODIFY `id_provincia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=197;

--
-- AUTO_INCREMENT de la tabla `redes_sociales`
--
ALTER TABLE `redes_sociales`
  MODIFY `id_red_social` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_beneficios`
--
ALTER TABLE `servicio_beneficios`
  MODIFY `id_servicio_beneficio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_horarios`
--
ALTER TABLE `servicio_horarios`
  MODIFY `id_servicio_horario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_imagenes`
--
ALTER TABLE `servicio_imagenes`
  MODIFY `id_servicio_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_redes`
--
ALTER TABLE `servicio_redes`
  MODIFY `id_servicio_red` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  MODIFY `id_subcategorias` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT de la tabla `tipos_servicio`
--
ALTER TABLE `tipos_servicio`
  MODIFY `id_tipo_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tipo_animales`
--
ALTER TABLE `tipo_animales`
  MODIFY `id_tipo_animal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tipo_comprobante`
--
ALTER TABLE `tipo_comprobante`
  MODIFY `id_tipo_comprobante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  MODIFY `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_entregas`
--
ALTER TABLE `tipo_entregas`
  MODIFY `id_tipo_entrega` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `trabajadores`
--
ALTER TABLE `trabajadores`
  MODIFY `id_trabajador` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  MODIFY `id_unidad_medida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `animales`
--
ALTER TABLE `animales`
  ADD CONSTRAINT `fk_animales_tipo_animal` FOREIGN KEY (`id_tipo_animal`) REFERENCES `tipo_animales` (`id_tipo_animal`);

--
-- Filtros para la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD CONSTRAINT `fk_carritos_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE;

--
-- Filtros para la tabla `carrito_detalle`
--
ALTER TABLE `carrito_detalle`
  ADD CONSTRAINT `fk_carrito_detalle_carrito` FOREIGN KEY (`fk_carrito`) REFERENCES `carritos` (`id_carrito`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_carrito_detalle_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD CONSTRAINT `fk_categorias_animales1` FOREIGN KEY (`fk_id_animal`) REFERENCES `animales` (`id_animal`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_persona` FOREIGN KEY (`fk_persona`) REFERENCES `personas` (`id_persona`),
  ADD CONSTRAINT `fk_clientes_user` FOREIGN KEY (`fk_user`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `cliente_direcciones`
--
ALTER TABLE `cliente_direcciones`
  ADD CONSTRAINT `fk_cliente_direcciones_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cliente_direcciones_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `comprobantes`
--
ALTER TABLE `comprobantes`
  ADD CONSTRAINT `fk_comprobantes_empresa` FOREIGN KEY (`fk_empresa`) REFERENCES `empresa` (`id_empresa`),
  ADD CONSTRAINT `fk_comprobantes_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comprobantes_tipo_comprobante` FOREIGN KEY (`fk_tipo_comprobante`) REFERENCES `tipo_comprobante` (`id_tipo_comprobante`);

--
-- Filtros para la tabla `descuentos`
--
ALTER TABLE `descuentos`
  ADD CONSTRAINT `fk_descuentos_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD CONSTRAINT `fk_direcciones_distritos` FOREIGN KEY (`fk_distrito`) REFERENCES `distritos` (`id_distrito`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `distritos`
--
ALTER TABLE `distritos`
  ADD CONSTRAINT `fk_distritos_provincias` FOREIGN KEY (`fk_provincia`) REFERENCES `provincias` (`id_provincia`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD CONSTRAINT `fk_empresa_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`);

--
-- Filtros para la tabla `empresa_redes`
--
ALTER TABLE `empresa_redes`
  ADD CONSTRAINT `fk_empresa_redes_empresa` FOREIGN KEY (`fk_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_empresa_redes_red` FOREIGN KEY (`fk_red`) REFERENCES `redes_sociales` (`id_red_social`) ON DELETE CASCADE;

--
-- Filtros para la tabla `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `fk_menus_animal` FOREIGN KEY (`fk_animal`) REFERENCES `animales` (`id_animal`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_menus_tipo_animal` FOREIGN KEY (`fk_tipo_animal`) REFERENCES `tipo_animales` (`id_tipo_animal`) ON DELETE CASCADE;

--
-- Filtros para la tabla `passkeys`
--
ALTER TABLE `passkeys`
  ADD CONSTRAINT `passkeys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`),
  ADD CONSTRAINT `fk_pedidos_direccion_envio` FOREIGN KEY (`fk_direccion_envio`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `fk_pedidos_estado_pedido` FOREIGN KEY (`fk_estado_pedido`) REFERENCES `estados_pedido` (`id_estado_pedido`),
  ADD CONSTRAINT `fk_pedidos_forma_pago` FOREIGN KEY (`fk_forma_pago`) REFERENCES `forma_pagos` (`id_forma_pago`),
  ADD CONSTRAINT `fk_pedidos_tipo_entrega` FOREIGN KEY (`fk_tipo_entrega`) REFERENCES `tipo_entregas` (`id_tipo_entrega`);

--
-- Filtros para la tabla `pedido_detalle`
--
ALTER TABLE `pedido_detalle`
  ADD CONSTRAINT `fk_pedido_detalle_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedido_detalle_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `pedido_recojo_terceros`
--
ALTER TABLE `pedido_recojo_terceros`
  ADD CONSTRAINT `fk_pedido_recojo_terceros_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedido_recojo_terceros_tipo_documento` FOREIGN KEY (`fk_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`);

--
-- Filtros para la tabla `personas`
--
ALTER TABLE `personas`
  ADD CONSTRAINT `fk_personas_tipo_documento` FOREIGN KEY (`fk_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_estado` FOREIGN KEY (`fk_estado`) REFERENCES `estados_producto` (`id_estado_producto`),
  ADD CONSTRAINT `fk_productos_marca` FOREIGN KEY (`fk_marca`) REFERENCES `marcas` (`id_marca`),
  ADD CONSTRAINT `fk_productos_sub_categorias1` FOREIGN KEY (`fk_id_subcategorias`) REFERENCES `sub_categorias` (`id_subcategorias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_productos_unidad_medida` FOREIGN KEY (`fk_unidad_medida`) REFERENCES `unidades_medida` (`id_unidad_medida`);

--
-- Filtros para la tabla `producto_imagenes`
--
ALTER TABLE `producto_imagenes`
  ADD CONSTRAINT `fk_producto_imagenes_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `provincias`
--
ALTER TABLE `provincias`
  ADD CONSTRAINT `fk_provincias_departamentos` FOREIGN KEY (`fk_departamento`) REFERENCES `departamentos` (`id_departamento`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `rol_permisos`
--
ALTER TABLE `rol_permisos`
  ADD CONSTRAINT `fk_rol_permisos_permiso` FOREIGN KEY (`fk_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rol_permisos_rol` FOREIGN KEY (`fk_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD CONSTRAINT `fk_servicios_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_servicios_tipo_servicio` FOREIGN KEY (`fk_tipo_servicio`) REFERENCES `tipos_servicio` (`id_tipo_servicio`);

--
-- Filtros para la tabla `servicio_beneficios`
--
ALTER TABLE `servicio_beneficios`
  ADD CONSTRAINT `fk_servicio_beneficios_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_horarios`
--
ALTER TABLE `servicio_horarios`
  ADD CONSTRAINT `fk_servicio_horarios_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_imagenes`
--
ALTER TABLE `servicio_imagenes`
  ADD CONSTRAINT `fk_servicio_imagenes_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_redes`
--
ALTER TABLE `servicio_redes`
  ADD CONSTRAINT `fk_servicio_redes_red` FOREIGN KEY (`fk_red`) REFERENCES `redes_sociales` (`id_red_social`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_servicio_redes_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  ADD CONSTRAINT `fk_sub_categorias_categorias1` FOREIGN KEY (`fk_id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `trabajadores`
--
ALTER TABLE `trabajadores`
  ADD CONSTRAINT `fk_trabajadores_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_trabajadores_persona` FOREIGN KEY (`fk_persona`) REFERENCES `personas` (`id_persona`),
  ADD CONSTRAINT `fk_trabajadores_rol` FOREIGN KEY (`fk_rol`) REFERENCES `roles` (`id_rol`),
  ADD CONSTRAINT `fk_trabajadores_user` FOREIGN KEY (`fk_user`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
