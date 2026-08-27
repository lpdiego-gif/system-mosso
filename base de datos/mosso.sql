-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mosso2
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.34-MariaDB-1:10.4.34+maria~ubu2004

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `animales`
--

DROP TABLE IF EXISTS `animales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `animales` (
  `id_animal` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `id_tipo_animal` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_animal`),
  KEY `fk_animales_tipo_animal` (`id_tipo_animal`),
  CONSTRAINT `fk_animales_tipo_animal` FOREIGN KEY (`id_tipo_animal`) REFERENCES `tipo_animales` (`id_tipo_animal`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `animales`
--

LOCK TABLES `animales` WRITE;
/*!40000 ALTER TABLE `animales` DISABLE KEYS */;
INSERT INTO `animales` VALUES (1,'Perro',1),(2,'Gato',1),(3,'Hámster',2),(4,'Avess',2),(5,'Peces',2),(6,'Conejo',2);
/*!40000 ALTER TABLE `animales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-0b4054a53774766efe60bf3f0fee01e0','i:2;',1787803982),('laravel-cache-0b4054a53774766efe60bf3f0fee01e0:timer','i:1787803982;',1787803982);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canjes_premio`
--

DROP TABLE IF EXISTS `canjes_premio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canjes_premio` (
  `id_canje` int(11) NOT NULL AUTO_INCREMENT,
  `fk_cliente` int(11) NOT NULL,
  `fk_premio` int(11) NOT NULL,
  `fk_punto` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_canje`),
  KEY `fk_canjes_premio_cliente_idx` (`fk_cliente`),
  KEY `fk_canjes_premio_premio_idx` (`fk_premio`),
  KEY `fk_canjes_premio_punto_idx` (`fk_punto`),
  CONSTRAINT `fk_canjes_premio_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `fk_canjes_premio_premio` FOREIGN KEY (`fk_premio`) REFERENCES `premios` (`id_premio`),
  CONSTRAINT `fk_canjes_premio_punto` FOREIGN KEY (`fk_punto`) REFERENCES `puntos_cliente` (`id_punto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canjes_premio`
--

LOCK TABLES `canjes_premio` WRITE;
/*!40000 ALTER TABLE `canjes_premio` DISABLE KEYS */;
INSERT INTO `canjes_premio` VALUES (1,3,1,1,'2026-08-17 03:59:35','entregado'),(2,3,2,2,'2026-08-19 03:59:35','pendiente'),(3,3,3,3,'2026-08-22 03:59:35','entregado'),(4,3,4,4,'2026-08-25 03:59:35','cancelado');
/*!40000 ALTER TABLE `canjes_premio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carrito_detalle`
--

DROP TABLE IF EXISTS `carrito_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_detalle` (
  `id_carrito_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `fk_carrito` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_carrito_detalle`),
  UNIQUE KEY `carrito_detalle_carrito_producto_unique` (`fk_carrito`,`fk_producto`),
  KEY `fk_carrito_detalle_producto_idx` (`fk_producto`),
  CONSTRAINT `fk_carrito_detalle_carrito` FOREIGN KEY (`fk_carrito`) REFERENCES `carritos` (`id_carrito`) ON DELETE CASCADE,
  CONSTRAINT `fk_carrito_detalle_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_detalle`
--

LOCK TABLES `carrito_detalle` WRITE;
/*!40000 ALTER TABLE `carrito_detalle` DISABLE KEYS */;
INSERT INTO `carrito_detalle` VALUES (1,1,104,1,179.90,'2026-08-26 01:05:39'),(2,1,105,1,89.90,'2026-08-26 01:05:44');
/*!40000 ALTER TABLE `carrito_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carritos`
--

DROP TABLE IF EXISTS `carritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carritos` (
  `id_carrito` int(11) NOT NULL AUTO_INCREMENT,
  `fk_cliente` int(11) DEFAULT NULL,
  `token_invitado` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_carrito`),
  KEY `fk_carritos_cliente_idx` (`fk_cliente`),
  KEY `carritos_token_invitado_idx` (`token_invitado`),
  CONSTRAINT `fk_carritos_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
INSERT INTO `carritos` VALUES (1,NULL,'2ba1db8a-a7c5-4d61-b464-5b635dc40a72','2026-08-26 01:05:39','2026-08-26 01:05:39');
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fk_id_animal` int(11) NOT NULL,
  PRIMARY KEY (`id_categoria`),
  KEY `fk_categorias_animales1_idx` (`fk_id_animal`),
  CONSTRAINT `fk_categorias_animales1` FOREIGN KEY (`fk_id_animal`) REFERENCES `animales` (`id_animal`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Alimentos','Alimentos y nutrición para perros',1),(2,'Alimentos Prescripción','Alimentos medicados y de prescripción',1),(3,'Farmacia','Medicamentos y suplementos',1),(4,'Accesorios y más','Accesorios para perros',1),(5,'Higiene y Bienestar','Productos de higiene y cuidado',1),(6,'Alimentos','Alimentos y nutrición para gatos',2),(7,'Alimentos Prescripción','Alimentos medicados y de prescripción',2),(8,'Arenas y más','Arenas y accesorios de higiene',2),(9,'Farmacia','Medicamentos y suplementos',2),(10,'Accesorios y más','Accesorios para gatos',2),(11,'Higiene y Bienestar','Productos de higiene y cuidado',2);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente_direcciones`
--

DROP TABLE IF EXISTS `cliente_direcciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente_direcciones` (
  `id_cliente_direccion` int(11) NOT NULL AUTO_INCREMENT,
  `fk_cliente` int(11) NOT NULL,
  `fk_direccion` int(11) NOT NULL,
  `alias` varchar(50) DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_cliente_direccion`),
  KEY `fk_cliente_direcciones_cliente_idx` (`fk_cliente`),
  KEY `fk_cliente_direcciones_direccion_idx` (`fk_direccion`),
  CONSTRAINT `fk_cliente_direcciones_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `fk_cliente_direcciones_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente_direcciones`
--

LOCK TABLES `cliente_direcciones` WRITE;
/*!40000 ALTER TABLE `cliente_direcciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente_direcciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `fk_persona` int(11) DEFAULT NULL,
  `fk_user` bigint(20) unsigned DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `clientes_correo_unique` (`correo`),
  UNIQUE KEY `clientes_fk_persona_unique` (`fk_persona`),
  UNIQUE KEY `clientes_fk_user_unique` (`fk_user`),
  CONSTRAINT `fk_clientes_persona` FOREIGN KEY (`fk_persona`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `fk_clientes_user` FOREIGN KEY (`fk_user`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (3,NULL,4,'lpdiego999@gmail.com','2026-08-25 06:22:15','2026-08-25 06:22:15');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codigos_verificacion`
--

DROP TABLE IF EXISTS `codigos_verificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codigos_verificacion` (
  `email` varchar(255) NOT NULL,
  `codigo` varchar(6) NOT NULL,
  `intentos` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `expira_en` datetime NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codigos_verificacion`
--

LOCK TABLES `codigos_verificacion` WRITE;
/*!40000 ALTER TABLE `codigos_verificacion` DISABLE KEYS */;
INSERT INTO `codigos_verificacion` VALUES ('lpdiego999@gmail.com','178185',0,'2026-08-25 01:37:15','2026-08-25 01:22:15');
/*!40000 ALTER TABLE `codigos_verificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comprobantes`
--

DROP TABLE IF EXISTS `comprobantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comprobantes` (
  `id_comprobante` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pedido` int(11) NOT NULL,
  `fk_tipo_comprobante` int(11) NOT NULL,
  `fk_empresa` int(11) NOT NULL,
  `serie` varchar(10) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_comprobante`),
  UNIQUE KEY `comprobantes_fk_pedido_unique` (`fk_pedido`),
  UNIQUE KEY `comprobantes_serie_numero_unique` (`serie`,`numero`),
  KEY `fk_comprobantes_tipo_comprobante_idx` (`fk_tipo_comprobante`),
  KEY `fk_comprobantes_empresa_idx` (`fk_empresa`),
  CONSTRAINT `fk_comprobantes_empresa` FOREIGN KEY (`fk_empresa`) REFERENCES `empresa` (`id_empresa`),
  CONSTRAINT `fk_comprobantes_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_comprobantes_tipo_comprobante` FOREIGN KEY (`fk_tipo_comprobante`) REFERENCES `tipo_comprobante` (`id_tipo_comprobante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comprobantes`
--

LOCK TABLES `comprobantes` WRITE;
/*!40000 ALTER TABLE `comprobantes` DISABLE KEYS */;
/*!40000 ALTER TABLE `comprobantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cupones`
--

DROP TABLE IF EXISTS `cupones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cupones` (
  `id_cupon` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `fk_cliente` int(11) DEFAULT NULL COMMENT 'NULL si es un cupón genérico, no personal',
  `fk_mascota` int(11) DEFAULT NULL COMMENT 'qué mascota lo originó (solo aplica a origen=cumpleanos_mascota)',
  `origen` enum('cumpleanos_mascota','bienvenida','promocion_manual') NOT NULL,
  `tipo` enum('descuento_porcentaje','descuento_monto','envio_gratis','producto_gratis','puntos_bonus') NOT NULL,
  `valor` decimal(10,2) DEFAULT NULL COMMENT 'porcentaje, monto, o cantidad de puntos según el tipo',
  `fk_producto_regalo` int(11) DEFAULT NULL COMMENT 'solo si tipo=producto_gratis',
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_vencimiento` date NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `fk_pedido_uso` int(11) DEFAULT NULL COMMENT 'pedido donde se canjeó',
  PRIMARY KEY (`id_cupon`),
  UNIQUE KEY `cupones_codigo_unique` (`codigo`),
  KEY `fk_cupones_cliente_idx` (`fk_cliente`),
  KEY `fk_cupones_mascota_idx` (`fk_mascota`),
  KEY `fk_cupones_producto_regalo_idx` (`fk_producto_regalo`),
  KEY `fk_cupones_pedido_uso_idx` (`fk_pedido_uso`),
  CONSTRAINT `fk_cupones_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `fk_cupones_mascota` FOREIGN KEY (`fk_mascota`) REFERENCES `mascotas` (`id_mascota`) ON DELETE SET NULL,
  CONSTRAINT `fk_cupones_pedido_uso` FOREIGN KEY (`fk_pedido_uso`) REFERENCES `pedidos` (`id_pedido`) ON DELETE SET NULL,
  CONSTRAINT `fk_cupones_producto_regalo` FOREIGN KEY (`fk_producto_regalo`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cupones`
--

LOCK TABLES `cupones` WRITE;
/*!40000 ALTER TABLE `cupones` DISABLE KEYS */;
INSERT INTO `cupones` VALUES (1,'CUMPLE-FIRULAIS-2026',3,1,'cumpleanos_mascota','descuento_porcentaje',10.00,NULL,'2026-08-27 03:59:35','2026-09-26',0,NULL),(2,'CUMPLE-MICHI-2026',3,2,'cumpleanos_mascota','puntos_bonus',100.00,NULL,'2026-08-27 03:59:35','2026-09-26',0,NULL),(3,'BIENVENIDA-LPDIEGO',3,NULL,'bienvenida','descuento_monto',15.00,NULL,'2026-08-27 03:59:35','2026-10-26',0,NULL),(4,'PROMO-VERANO2026',NULL,NULL,'promocion_manual','descuento_porcentaje',20.00,NULL,'2026-08-27 03:59:35','2026-09-11',0,NULL);
/*!40000 ALTER TABLE `cupones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id_departamento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_departamento`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
INSERT INTO `departamentos` VALUES (1,'Amazonas'),(2,'Áncash'),(3,'Apurímac'),(4,'Arequipa'),(5,'Ayacucho'),(6,'Cajamarca'),(7,'Callao'),(8,'Cusco'),(9,'Huancavelica'),(10,'Huánuco'),(11,'Ica'),(12,'Junín'),(13,'La Libertad'),(14,'Lambayeque'),(15,'Lima'),(16,'Loreto'),(17,'Madre de Dios'),(18,'Moquegua'),(19,'Pasco'),(20,'Piura'),(21,'Puno'),(22,'San Martín'),(23,'Tacna'),(24,'Tumbes'),(25,'Ucayali');
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `descuentos`
--

DROP TABLE IF EXISTS `descuentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `descuentos` (
  `id_descuento` int(11) NOT NULL AUTO_INCREMENT,
  `fk_producto` int(11) NOT NULL,
  `tipo` enum('porcentaje','monto_fijo') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_descuento`),
  KEY `fk_descuentos_producto_idx` (`fk_producto`),
  KEY `descuentos_vigencia_idx` (`fecha_inicio`,`fecha_fin`),
  CONSTRAINT `fk_descuentos_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `descuentos`
--

LOCK TABLES `descuentos` WRITE;
/*!40000 ALTER TABLE `descuentos` DISABLE KEYS */;
INSERT INTO `descuentos` VALUES (201,101,'porcentaje',15.00,'2026-08-01 00:00:00','2026-12-31 23:59:59',1,'2026-08-25 04:37:56'),(202,104,'porcentaje',20.00,'2026-08-01 00:00:00','2026-12-31 23:59:59',1,'2026-08-25 04:37:56'),(203,107,'monto_fijo',10.00,'2026-08-01 00:00:00','2026-12-31 23:59:59',1,'2026-08-25 04:37:56');
/*!40000 ALTER TABLE `descuentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `direcciones`
--

DROP TABLE IF EXISTS `direcciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direcciones` (
  `id_direccion` int(11) NOT NULL AUTO_INCREMENT,
  `direccion` varchar(150) NOT NULL,
  `referencia` varchar(150) DEFAULT NULL,
  `fk_distrito` int(11) NOT NULL,
  PRIMARY KEY (`id_direccion`),
  KEY `fk_direcciones_distritos_idx` (`fk_distrito`),
  CONSTRAINT `fk_direcciones_distritos` FOREIGN KEY (`fk_distrito`) REFERENCES `distritos` (`id_distrito`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `direcciones`
--

LOCK TABLES `direcciones` WRITE;
/*!40000 ALTER TABLE `direcciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `direcciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distritos`
--

DROP TABLE IF EXISTS `distritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distritos` (
  `id_distrito` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `costo_envio` decimal(8,2) NOT NULL DEFAULT 0.00,
  `fk_provincia` int(11) NOT NULL,
  PRIMARY KEY (`id_distrito`),
  KEY `fk_distritos_provincias_idx` (`fk_provincia`),
  CONSTRAINT `fk_distritos_provincias` FOREIGN KEY (`fk_provincia`) REFERENCES `provincias` (`id_provincia`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distritos`
--

LOCK TABLES `distritos` WRITE;
/*!40000 ALTER TABLE `distritos` DISABLE KEYS */;
INSERT INTO `distritos` VALUES (1,'Lima',30.00,128),(2,'Ancón',10.00,128),(3,'Ate',27.00,128),(4,'Barranco',20.00,128),(5,'Breña',35.00,128),(6,'Carabayllo',28.00,128),(7,'Chaclacayo',23.00,128),(8,'Chorrillos',23.00,128),(9,'Cieneguilla',11.00,128),(10,'Comas',29.00,128),(11,'El Agustino',26.00,128),(12,'Independencia',30.00,128),(13,'Jesús María',12.00,128),(14,'La Molina',14.00,128),(15,'La Victoria',22.00,128),(16,'Lince',35.00,128),(17,'Los Olivos',21.00,128),(18,'Lurigancho-Chosica',18.00,128),(19,'Lurín',16.00,128),(20,'Magdalena del Mar',18.00,128),(21,'Miraflores',33.00,128),(22,'Pachacámac',21.00,128),(23,'Pucusana',23.00,128),(24,'Pueblo Libre',17.00,128),(25,'Puente Piedra',30.00,128),(26,'Punta Hermosa',15.00,128),(27,'Punta Negra',25.00,128),(28,'Rímac',18.00,128),(29,'San Bartolo',34.00,128),(30,'San Borja',26.00,128),(31,'San Isidro',18.00,128),(32,'San Juan de Lurigancho',27.00,128),(33,'San Juan de Miraflores',23.00,128),(34,'San Luis',24.00,128),(35,'San Martín de Porres',16.00,128),(36,'San Miguel',25.00,128),(37,'Santa Anita',15.00,128),(38,'Santa María del Mar',15.00,128),(39,'Santa Rosa',23.00,128),(40,'Santiago de Surco',35.00,128),(41,'Surquillo',18.00,128),(42,'Villa El Salvador',25.00,128),(43,'Villa María del Triunfo',13.00,128),(44,'Callao',30.00,66),(45,'Bellavista',26.00,66),(46,'Carmen de La Legua-Reynoso',29.00,66),(47,'La Perla',33.00,66),(48,'La Punta',14.00,66),(49,'Ventanilla',13.00,66),(50,'Mi Perú',15.00,66);
/*!40000 ALTER TABLE `distritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `id_empresa` int(11) NOT NULL AUTO_INCREMENT,
  `ruc` varchar(11) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `nombre_comercial` varchar(150) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `fk_direccion` int(11) NOT NULL,
  PRIMARY KEY (`id_empresa`),
  KEY `fk_empresa_direccion_idx` (`fk_direccion`),
  CONSTRAINT `fk_empresa_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa`
--

LOCK TABLES `empresa` WRITE;
/*!40000 ALTER TABLE `empresa` DISABLE KEYS */;
/*!40000 ALTER TABLE `empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa_redes`
--

DROP TABLE IF EXISTS `empresa_redes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa_redes` (
  `id_empresa_red` int(11) NOT NULL AUTO_INCREMENT,
  `fk_empresa` int(11) NOT NULL,
  `fk_red` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`id_empresa_red`),
  KEY `fk_empresa_redes_empresa_idx` (`fk_empresa`),
  KEY `fk_empresa_redes_red_idx` (`fk_red`),
  CONSTRAINT `fk_empresa_redes_empresa` FOREIGN KEY (`fk_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE,
  CONSTRAINT `fk_empresa_redes_red` FOREIGN KEY (`fk_red`) REFERENCES `redes_sociales` (`id_red_social`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa_redes`
--

LOCK TABLES `empresa_redes` WRITE;
/*!40000 ALTER TABLE `empresa_redes` DISABLE KEYS */;
/*!40000 ALTER TABLE `empresa_redes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados_pedido`
--

DROP TABLE IF EXISTS `estados_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados_pedido` (
  `id_estado_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_estado_pedido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados_pedido`
--

LOCK TABLES `estados_pedido` WRITE;
/*!40000 ALTER TABLE `estados_pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `estados_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados_producto`
--

DROP TABLE IF EXISTS `estados_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados_producto` (
  `id_estado_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_estado_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados_producto`
--

LOCK TABLES `estados_producto` WRITE;
/*!40000 ALTER TABLE `estados_producto` DISABLE KEYS */;
INSERT INTO `estados_producto` VALUES (1,'Activo'),(2,'Inactivo');
/*!40000 ALTER TABLE `estados_producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etapas_vida`
--

DROP TABLE IF EXISTS `etapas_vida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapas_vida` (
  `id_etapa_vida` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `fk_animal` int(11) NOT NULL,
  `edad_min_meses` int(11) NOT NULL,
  `edad_max_meses` int(11) DEFAULT NULL COMMENT 'NULL = sin límite superior (ej. Senior)',
  PRIMARY KEY (`id_etapa_vida`),
  KEY `fk_etapas_vida_animal_idx` (`fk_animal`),
  CONSTRAINT `fk_etapas_vida_animal` FOREIGN KEY (`fk_animal`) REFERENCES `animales` (`id_animal`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapas_vida`
--

LOCK TABLES `etapas_vida` WRITE;
/*!40000 ALTER TABLE `etapas_vida` DISABLE KEYS */;
INSERT INTO `etapas_vida` VALUES (1,'Cachorro',1,0,12),(2,'Adulto',1,13,84),(3,'Senior',1,85,NULL),(4,'Cachorro',2,0,12);
/*!40000 ALTER TABLE `etapas_vida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forma_pagos`
--

DROP TABLE IF EXISTS `forma_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forma_pagos` (
  `id_forma_pago` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_forma_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forma_pagos`
--

LOCK TABLES `forma_pagos` WRITE;
/*!40000 ALTER TABLE `forma_pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `forma_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marcas`
--

DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `id_marca` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_marca`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES (1,'Royal Canin','royal-canin.png'),(2,'Purina Pro Plan','pro-plan.png'),(3,'Hill\'s Science Diet','Hill\'s Science Diet.png'),(4,'Eukanuba','eukanuba.png'),(5,'Iams','iams.png'),(6,'Pedigree','pedigree.png'),(7,'Whiskas','Whiskas.png'),(8,'Friskies','Friskies.png'),(9,'Sheba','Sheba.png'),(10,'Vitakraft',NULL),(11,'Beaphar',NULL),(12,'Seresto',NULL),(13,'Bravecto','bravecto.png'),(14,'NexGard',NULL),(15,'Simparica',NULL);
/*!40000 ALTER TABLE `marcas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascotas`
--

DROP TABLE IF EXISTS `mascotas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascotas` (
  `id_mascota` int(11) NOT NULL AUTO_INCREMENT,
  `fk_cliente` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `fk_animal` int(11) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `ultimo_anio_cumple_premiado` year(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_mascota`),
  KEY `fk_mascotas_cliente_idx` (`fk_cliente`),
  KEY `fk_mascotas_animal_idx` (`fk_animal`),
  CONSTRAINT `fk_mascotas_animal` FOREIGN KEY (`fk_animal`) REFERENCES `animales` (`id_animal`),
  CONSTRAINT `fk_mascotas_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascotas`
--

LOCK TABLES `mascotas` WRITE;
/*!40000 ALTER TABLE `mascotas` DISABLE KEYS */;
INSERT INTO `mascotas` VALUES (1,3,'Firulais',1,'2023-05-14',NULL,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(2,3,'Michi',2,'2024-02-10',NULL,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(3,3,'Rocky',1,'2019-11-02',NULL,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(4,3,'Nala',2,'2025-01-20',NULL,'2026-08-27 03:59:35','2026-08-27 03:59:35');
/*!40000 ALTER TABLE `mascotas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `id_menu` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_menu`),
  KEY `fk_menus_animal_idx` (`fk_animal`),
  KEY `fk_menus_tipo_animal_idx` (`fk_tipo_animal`),
  CONSTRAINT `fk_menus_animal` FOREIGN KEY (`fk_animal`) REFERENCES `animales` (`id_animal`) ON DELETE CASCADE,
  CONSTRAINT `fk_menus_tipo_animal` FOREIGN KEY (`fk_tipo_animal`) REFERENCES `tipo_animales` (`id_tipo_animal`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
INSERT INTO `menus` VALUES (1,'Perros','animal',1,NULL,NULL,'🐶',1,0,1,'2026-08-24 21:07:58','2026-08-24 21:07:58'),(2,'Gatos','animal',2,NULL,NULL,'🐱',2,0,1,'2026-08-24 21:07:58','2026-08-24 21:07:58'),(3,'Exóticos','tipo_animal',NULL,2,NULL,NULL,3,0,1,'2026-08-24 21:07:58','2026-08-24 21:07:58'),(4,'Marca','marca',NULL,NULL,NULL,NULL,4,0,1,'2026-08-24 21:07:58','2026-08-24 21:07:58'),(5,'Servicios','tipo_servicio',NULL,NULL,NULL,NULL,5,0,1,'2026-08-24 21:07:58','2026-08-24 21:07:58'),(6,'Ofertas','url',NULL,NULL,'/ofertas','🔥',6,1,1,'2026-08-24 21:07:58','2026-08-24 21:07:58');
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026_08_25_003439_create_reclamos_table',1),(2,'2026_08_25_040000_make_clientes_fk_persona_nullable',2),(3,'2026_08_25_040001_create_codigos_verificacion_table',2),(4,'2026_08_25_060000_seed_tipo_documento',3);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passkeys`
--

DROP TABLE IF EXISTS `passkeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passkeys` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `credential_id` varchar(255) NOT NULL,
  `credential` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `passkeys_credential_id_unique` (`credential_id`),
  KEY `passkeys_user_id_index` (`user_id`),
  CONSTRAINT `passkeys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passkeys`
--

LOCK TABLES `passkeys` WRITE;
/*!40000 ALTER TABLE `passkeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `passkeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_detalle`
--

DROP TABLE IF EXISTS `pedido_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_detalle` (
  `id_pedido_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pedido` int(11) NOT NULL,
  `fk_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_pedido_detalle`),
  KEY `fk_pedido_detalle_pedido_idx` (`fk_pedido`),
  KEY `fk_pedido_detalle_producto_idx` (`fk_producto`),
  CONSTRAINT `fk_pedido_detalle_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_pedido_detalle_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_detalle`
--

LOCK TABLES `pedido_detalle` WRITE;
/*!40000 ALTER TABLE `pedido_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_recojo_terceros`
--

DROP TABLE IF EXISTS `pedido_recojo_terceros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_recojo_terceros` (
  `id_pedido_recojo_tercero` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pedido` int(11) NOT NULL,
  `fk_tipo_documento` int(11) NOT NULL,
  `num_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_pedido_recojo_tercero`),
  UNIQUE KEY `pedido_recojo_terceros_fk_pedido_unique` (`fk_pedido`),
  KEY `fk_pedido_recojo_terceros_tipo_documento_idx` (`fk_tipo_documento`),
  CONSTRAINT `fk_pedido_recojo_terceros_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_pedido_recojo_terceros_tipo_documento` FOREIGN KEY (`fk_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_recojo_terceros`
--

LOCK TABLES `pedido_recojo_terceros` WRITE;
/*!40000 ALTER TABLE `pedido_recojo_terceros` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_recojo_terceros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pedido`),
  KEY `fk_pedidos_cliente_idx` (`fk_cliente`),
  KEY `fk_pedidos_direccion_envio_idx` (`fk_direccion_envio`),
  KEY `fk_pedidos_tipo_entrega_idx` (`fk_tipo_entrega`),
  KEY `fk_pedidos_forma_pago_idx` (`fk_forma_pago`),
  KEY `fk_pedidos_estado_pedido_idx` (`fk_estado_pedido`),
  CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_pedidos_direccion_envio` FOREIGN KEY (`fk_direccion_envio`) REFERENCES `direcciones` (`id_direccion`),
  CONSTRAINT `fk_pedidos_estado_pedido` FOREIGN KEY (`fk_estado_pedido`) REFERENCES `estados_pedido` (`id_estado_pedido`),
  CONSTRAINT `fk_pedidos_forma_pago` FOREIGN KEY (`fk_forma_pago`) REFERENCES `forma_pagos` (`id_forma_pago`),
  CONSTRAINT `fk_pedidos_tipo_entrega` FOREIGN KEY (`fk_tipo_entrega`) REFERENCES `tipo_entregas` (`id_tipo_entrega`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id_permiso` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `permisos_clave_unique` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL AUTO_INCREMENT,
  `fk_tipo_documento` int(11) NOT NULL,
  `num_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellido_paterno` varchar(100) NOT NULL,
  `apellido_materno` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `personas_num_documento_unique` (`num_documento`),
  KEY `fk_personas_tipo_documento_idx` (`fk_tipo_documento`),
  CONSTRAINT `fk_personas_tipo_documento` FOREIGN KEY (`fk_tipo_documento`) REFERENCES `tipo_documento` (`id_tipo_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES (1,1,'00000001','Diego','Pendiente',NULL,'000000000',NULL,'2026-08-25 07:10:36','2026-08-25 07:10:36');
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `premios`
--

DROP TABLE IF EXISTS `premios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `premios` (
  `id_premio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fk_producto` int(11) DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `puntos_requeridos` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_premio`),
  KEY `fk_premios_producto_idx` (`fk_producto`),
  CONSTRAINT `fk_premios_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `premios`
--

LOCK TABLES `premios` WRITE;
/*!40000 ALTER TABLE `premios` DISABLE KEYS */;
INSERT INTO `premios` VALUES (1,'Snack de regalo','Snack pequeño para perro o gato',NULL,NULL,500,100,1,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(2,'Pelota de juguete','Pelota de goma resistente de regalo',106,NULL,800,40,1,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(3,'Bolsa de premios sorpresa','Mix de golosinas para mascota',NULL,NULL,300,60,1,'2026-08-27 03:59:35','2026-08-27 03:59:35'),(4,'Shampoo de regalo','Shampoo de cuidado básico',NULL,NULL,650,25,1,'2026-08-27 03:59:35','2026-08-27 03:59:35');
/*!40000 ALTER TABLE `premios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_imagenes`
--

DROP TABLE IF EXISTS `producto_imagenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_imagenes` (
  `id_producto_imagen` int(11) NOT NULL AUTO_INCREMENT,
  `fk_producto` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_producto_imagen`),
  KEY `fk_producto_imagenes_producto_idx` (`fk_producto`),
  CONSTRAINT `fk_producto_imagenes_producto` FOREIGN KEY (`fk_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_imagenes`
--

LOCK TABLES `producto_imagenes` WRITE;
/*!40000 ALTER TABLE `producto_imagenes` DISABLE KEYS */;
/*!40000 ALTER TABLE `producto_imagenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `sku` varchar(50) NOT NULL,
  `codigo_barras` varchar(20) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fk_marca` int(11) NOT NULL,
  `fk_unidad_medida` int(11) NOT NULL,
  `fk_id_subcategorias` int(11) DEFAULT NULL,
  `fk_etapa_vida` int(11) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `imagen_principal` varchar(255) DEFAULT NULL,
  `fk_estado` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `productos_sku_unique` (`sku`),
  UNIQUE KEY `productos_codigo_barras_unique` (`codigo_barras`),
  KEY `fk_productos_marca_idx` (`fk_marca`),
  KEY `fk_productos_unidad_medida_idx` (`fk_unidad_medida`),
  KEY `fk_productos_estado_idx` (`fk_estado`),
  KEY `fk_productos_sub_categorias1_idx` (`fk_id_subcategorias`),
  KEY `fk_productos_etapa_vida_idx` (`fk_etapa_vida`),
  CONSTRAINT `fk_productos_estado` FOREIGN KEY (`fk_estado`) REFERENCES `estados_producto` (`id_estado_producto`),
  CONSTRAINT `fk_productos_etapa_vida` FOREIGN KEY (`fk_etapa_vida`) REFERENCES `etapas_vida` (`id_etapa_vida`) ON DELETE SET NULL,
  CONSTRAINT `fk_productos_marca` FOREIGN KEY (`fk_marca`) REFERENCES `marcas` (`id_marca`),
  CONSTRAINT `fk_productos_sub_categorias1` FOREIGN KEY (`fk_id_subcategorias`) REFERENCES `sub_categorias` (`id_subcategorias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_productos_unidad_medida` FOREIGN KEY (`fk_unidad_medida`) REFERENCES `unidades_medida` (`id_unidad_medida`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'GAT-BRA-MICHILON',NULL,'michilon','50ok de michilon para tus gatas',13,5,37,NULL,50.00,1,'productos/Zj9zC7fwWumSzxpIgN3Y3pSSEjrOM9m4jJwDuNfI.jpg',1,'2026-08-24 20:23:14','2026-08-24 20:23:14'),(101,'RC-001',NULL,'Royal Canin Adulto Razas Medianas 15kg','Alimento seco para perros adultos',1,1,1,NULL,289.90,25,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(102,'PP-002',NULL,'Pro Plan Cachorro Pollo y Arroz 15kg','Alimento seco para cachorros',2,1,1,NULL,259.90,18,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(103,'HD-003',NULL,'Hill\'s Science Diet Gato Esterilizado 3kg','Alimento para gatos esterilizados',3,1,6,NULL,145.00,12,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(104,'PED-004',NULL,'Pedigree Adulto Carne 21kg','Alimento económico para perros adultos',6,1,1,NULL,179.90,30,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(105,'WHI-005',NULL,'Whiskas Adulto Pescado 7kg','Alimento seco para gatos adultos',7,1,6,NULL,89.90,20,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(106,'JUG-006',NULL,'Pelota de goma resistente','Juguete para perros medianos y grandes',1,5,18,NULL,19.90,50,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56'),(107,'BRV-007',NULL,'Bravecto Antipulgas 10-20kg','Tableta antipulgas y garrapatas, 1 unidad',13,5,26,NULL,65.00,15,NULL,1,'2026-08-25 04:37:56','2026-08-25 04:37:56');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provincias`
--

DROP TABLE IF EXISTS `provincias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provincias` (
  `id_provincia` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `fk_departamento` int(11) NOT NULL,
  PRIMARY KEY (`id_provincia`),
  KEY `fk_provincias_departamentos_idx` (`fk_departamento`),
  CONSTRAINT `fk_provincias_departamentos` FOREIGN KEY (`fk_departamento`) REFERENCES `departamentos` (`id_departamento`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provincias`
--

LOCK TABLES `provincias` WRITE;
/*!40000 ALTER TABLE `provincias` DISABLE KEYS */;
INSERT INTO `provincias` VALUES (1,'Chachapoyas',1),(2,'Bagua',1),(3,'Bongará',1),(4,'Condorcanqui',1),(5,'Luya',1),(6,'Rodríguez de Mendoza',1),(7,'Utcubamba',1),(8,'Huaraz',2),(9,'Aija',2),(10,'Antonio Raimondi',2),(11,'Asunción',2),(12,'Bolognesi',2),(13,'Carhuaz',2),(14,'Carlos Fermín Fitzcarrald',2),(15,'Casma',2),(16,'Corongo',2),(17,'Huari',2),(18,'Huarmey',2),(19,'Huaylas',2),(20,'Mariscal Luzuriaga',2),(21,'Ocros',2),(22,'Pallasca',2),(23,'Pomabamba',2),(24,'Recuay',2),(25,'Santa',2),(26,'Sihuas',2),(27,'Yungay',2),(28,'Abancay',3),(29,'Andahuaylas',3),(30,'Antabamba',3),(31,'Aymaraes',3),(32,'Cotabambas',3),(33,'Chincheros',3),(34,'Grau',3),(35,'Arequipa',4),(36,'Camaná',4),(37,'Caravelí',4),(38,'Castilla',4),(39,'Caylloma',4),(40,'Condesuyos',4),(41,'Islay',4),(42,'La Unión',4),(43,'Huamanga',5),(44,'Cangallo',5),(45,'Huanca Sancos',5),(46,'Huanta',5),(47,'La Mar',5),(48,'Lucanas',5),(49,'Parinacochas',5),(50,'Paucar del Sara Sara',5),(51,'Sucre',5),(52,'Víctor Fajardo',5),(53,'Vilcas Huamán',5),(54,'Cajamarca',6),(55,'Cajabamba',6),(56,'Celendín',6),(57,'Chota',6),(58,'Contumazá',6),(59,'Cutervo',6),(60,'Hualgayoc',6),(61,'Jaén',6),(62,'San Ignacio',6),(63,'San Marcos',6),(64,'San Miguel',6),(65,'San Pablo',6),(66,'Santa Cruz',6),(67,'Callao',7),(68,'Cusco',8),(69,'Acomayo',8),(70,'Anta',8),(71,'Calca',8),(72,'Canas',8),(73,'Canchis',8),(74,'Chumbivilcas',8),(75,'Espinar',8),(76,'La Convención',8),(77,'Paruro',8),(78,'Paucartambo',8),(79,'Quispicanchi',8),(80,'Urubamba',8),(81,'Huancavelica',9),(82,'Acobamba',9),(83,'Angaraes',9),(84,'Castrovirreyna',9),(85,'Churcampa',9),(86,'Huaytará',9),(87,'Tayacaja',9),(88,'Huánuco',10),(89,'Ambo',10),(90,'Dos de Mayo',10),(91,'Huacaybamba',10),(92,'Huamalíes',10),(93,'Leoncio Prado',10),(94,'Marañón',10),(95,'Pachitea',10),(96,'Puerto Inca',10),(97,'Lauricocha',10),(98,'Yarowilca',10),(99,'Ica',11),(100,'Chincha',11),(101,'Nazca',11),(102,'Palpa',11),(103,'Pisco',11),(104,'Huancayo',12),(105,'Concepción',12),(106,'Chanchamayo',12),(107,'Jauja',12),(108,'Junín',12),(109,'Satipo',12),(110,'Tarma',12),(111,'Yauli',12),(112,'Chupaca',12),(113,'Trujillo',13),(114,'Ascope',13),(115,'Bolívar',13),(116,'Chepén',13),(117,'Julcán',13),(118,'Otuzco',13),(119,'Pacasmayo',13),(120,'Pataz',13),(121,'Sánchez Carrión',13),(122,'Santiago de Chuco',13),(123,'Gran Chimú',13),(124,'Virú',13),(125,'Chiclayo',14),(126,'Ferreñafe',14),(127,'Lambayeque',14),(128,'Lima',15),(129,'Barranca',15),(130,'Cajatambo',15),(131,'Canta',15),(132,'Cañete',15),(133,'Huaral',15),(134,'Huarochirí',15),(135,'Huaura',15),(136,'Oyón',15),(137,'Yauyos',15),(138,'Maynas',16),(139,'Alto Amazonas',16),(140,'Loreto',16),(141,'Mariscal Ramón Castilla',16),(142,'Requena',16),(143,'Ucayali',16),(144,'Datem del Marañón',16),(145,'Putumayo',16),(146,'Tambopata',17),(147,'Manu',17),(148,'Tahuamanu',17),(149,'Mariscal Nieto',18),(150,'General Sánchez Cerro',18),(151,'Ilo',18),(152,'Pasco',19),(153,'Daniel Alcides Carrión',19),(154,'Oxapampa',19),(155,'Piura',20),(156,'Ayabaca',20),(157,'Huancabamba',20),(158,'Morropón',20),(159,'Paita',20),(160,'Sullana',20),(161,'Talara',20),(162,'Sechura',20),(163,'Puno',21),(164,'Azángaro',21),(165,'Carabaya',21),(166,'Chucuito',21),(167,'El Collao',21),(168,'Huancané',21),(169,'Lampa',21),(170,'Melgar',21),(171,'Moho',21),(172,'San Antonio de Putina',21),(173,'San Román',21),(174,'Sandia',21),(175,'Yunguyo',21),(176,'Moyobamba',22),(177,'Bellavista',22),(178,'El Dorado',22),(179,'Huallaga',22),(180,'Lamas',22),(181,'Mariscal Cáceres',22),(182,'Picota',22),(183,'Rioja',22),(184,'San Martín',22),(185,'Tocache',22),(186,'Tacna',23),(187,'Candarave',23),(188,'Jorge Basadre',23),(189,'Tarata',23),(190,'Tumbes',24),(191,'Contralmirante Villar',24),(192,'Zarumilla',24),(193,'Coronel Portillo',25),(194,'Atalaya',25),(195,'Padre Abad',25),(196,'Purús',25);
/*!40000 ALTER TABLE `provincias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `puntos_cliente`
--

DROP TABLE IF EXISTS `puntos_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `puntos_cliente` (
  `id_punto` int(11) NOT NULL AUTO_INCREMENT,
  `fk_cliente` int(11) NOT NULL,
  `fk_pedido` int(11) DEFAULT NULL COMMENT 'pedido que originó la acumulación (NULL en canjes/vencimientos)',
  `tipo` enum('acumulacion','canje_descuento','canje_producto','vencimiento') NOT NULL,
  `monto` int(11) NOT NULL COMMENT 'positivo = suma puntos, negativo = resta puntos',
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_vencimiento` date DEFAULT NULL COMMENT 'solo aplica a tipo=acumulacion',
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_punto`),
  KEY `fk_puntos_cliente_cliente_idx` (`fk_cliente`),
  KEY `fk_puntos_cliente_pedido_idx` (`fk_pedido`),
  KEY `puntos_cliente_vencimiento_idx` (`fecha_vencimiento`),
  CONSTRAINT `fk_puntos_cliente_cliente` FOREIGN KEY (`fk_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `fk_puntos_cliente_pedido` FOREIGN KEY (`fk_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `puntos_cliente`
--

LOCK TABLES `puntos_cliente` WRITE;
/*!40000 ALTER TABLE `puntos_cliente` DISABLE KEYS */;
INSERT INTO `puntos_cliente` VALUES (1,3,NULL,'canje_producto',-500,'2026-08-17 03:59:35',NULL,'Canje por Snack de regalo'),(2,3,NULL,'canje_producto',-800,'2026-08-19 03:59:35',NULL,'Canje por Pelota de juguete'),(3,3,NULL,'canje_producto',-300,'2026-08-22 03:59:35',NULL,'Canje por Bolsa de premios sorpresa'),(4,3,NULL,'canje_producto',-650,'2026-08-25 03:59:35',NULL,'Canje por Shampoo de regalo');
/*!40000 ALTER TABLE `puntos_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reclamos`
--

DROP TABLE IF EXISTS `reclamos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reclamos` (
  `id_reclamo` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('DNI','CE','Pasaporte') NOT NULL,
  `num_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellido_paterno` varchar(100) NOT NULL,
  `apellido_materno` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `tipo_respuesta` enum('correo_electronico') NOT NULL DEFAULT 'correo_electronico',
  `direccion` varchar(150) NOT NULL,
  `distrito` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `tienda_compra` enum('fisica','online') NOT NULL,
  `monto_reclamado` decimal(10,2) DEFAULT NULL,
  `tipo_bien` enum('producto','servicio') NOT NULL,
  `descripcion_bien` text NOT NULL,
  `tipo_atencion` enum('reclamo','queja') NOT NULL,
  `detalle` text NOT NULL,
  `pedido` text NOT NULL,
  `es_menor_edad` tinyint(1) NOT NULL DEFAULT 0,
  `apoderado_tipo_documento` enum('DNI','CE','Pasaporte') DEFAULT NULL,
  `apoderado_num_documento` varchar(20) DEFAULT NULL,
  `apoderado_nombres` varchar(150) DEFAULT NULL,
  `apoderado_apellidos` varchar(150) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_reclamo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamos`
--

LOCK TABLES `reclamos` WRITE;
/*!40000 ALTER TABLE `reclamos` DISABLE KEYS */;
/*!40000 ALTER TABLE `reclamos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redes_sociales`
--

DROP TABLE IF EXISTS `redes_sociales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `redes_sociales` (
  `id_red_social` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_red_social`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redes_sociales`
--

LOCK TABLES `redes_sociales` WRITE;
/*!40000 ALTER TABLE `redes_sociales` DISABLE KEYS */;
/*!40000 ALTER TABLE `redes_sociales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_permisos`
--

DROP TABLE IF EXISTS `rol_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_permisos` (
  `fk_rol` int(11) NOT NULL,
  `fk_permiso` int(11) NOT NULL,
  PRIMARY KEY (`fk_rol`,`fk_permiso`),
  KEY `fk_rol_permisos_permiso_idx` (`fk_permiso`),
  CONSTRAINT `fk_rol_permisos_permiso` FOREIGN KEY (`fk_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE,
  CONSTRAINT `fk_rol_permisos_rol` FOREIGN KEY (`fk_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_permisos`
--

LOCK TABLES `rol_permisos` WRITE;
/*!40000 ALTER TABLE `rol_permisos` DISABLE KEYS */;
/*!40000 ALTER TABLE `rol_permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `roles_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador','Acceso total al sistema, gestión de usuarios, roles, configuraciones y reportes.'),(2,'Vendedor','Gestión de ventas, atención a clientes, emisión de comprobantes y pedidos.'),(3,'Almacenero','Control de inventario, recepción de mercadería, despachos y gestión de stock.'),(4,'Cliente','Acceso restringido al portal para realizar compras, ver pedidos y dar seguimiento a envíos.');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio_beneficios`
--

DROP TABLE IF EXISTS `servicio_beneficios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio_beneficios` (
  `id_servicio_beneficio` int(11) NOT NULL AUTO_INCREMENT,
  `fk_servicio` int(11) NOT NULL,
  `icono` varchar(45) DEFAULT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_servicio_beneficio`),
  KEY `fk_servicio_beneficios_servicio_idx` (`fk_servicio`),
  CONSTRAINT `fk_servicio_beneficios_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio_beneficios`
--

LOCK TABLES `servicio_beneficios` WRITE;
/*!40000 ALTER TABLE `servicio_beneficios` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicio_beneficios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio_horarios`
--

DROP TABLE IF EXISTS `servicio_horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio_horarios` (
  `id_servicio_horario` int(11) NOT NULL AUTO_INCREMENT,
  `fk_servicio` int(11) NOT NULL,
  `dia_semana` varchar(15) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  PRIMARY KEY (`id_servicio_horario`),
  KEY `fk_servicio_horarios_servicio_idx` (`fk_servicio`),
  CONSTRAINT `fk_servicio_horarios_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio_horarios`
--

LOCK TABLES `servicio_horarios` WRITE;
/*!40000 ALTER TABLE `servicio_horarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicio_horarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio_imagenes`
--

DROP TABLE IF EXISTS `servicio_imagenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio_imagenes` (
  `id_servicio_imagen` int(11) NOT NULL AUTO_INCREMENT,
  `fk_servicio` int(11) NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_servicio_imagen`),
  KEY `fk_servicio_imagenes_servicio_idx` (`fk_servicio`),
  CONSTRAINT `fk_servicio_imagenes_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio_imagenes`
--

LOCK TABLES `servicio_imagenes` WRITE;
/*!40000 ALTER TABLE `servicio_imagenes` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicio_imagenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio_redes`
--

DROP TABLE IF EXISTS `servicio_redes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio_redes` (
  `id_servicio_red` int(11) NOT NULL AUTO_INCREMENT,
  `fk_servicio` int(11) NOT NULL,
  `fk_red` int(11) NOT NULL,
  `link` varchar(255) NOT NULL,
  PRIMARY KEY (`id_servicio_red`),
  KEY `fk_servicio_redes_servicio_idx` (`fk_servicio`),
  KEY `fk_servicio_redes_red_idx` (`fk_red`),
  CONSTRAINT `fk_servicio_redes_red` FOREIGN KEY (`fk_red`) REFERENCES `redes_sociales` (`id_red_social`) ON DELETE CASCADE,
  CONSTRAINT `fk_servicio_redes_servicio` FOREIGN KEY (`fk_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio_redes`
--

LOCK TABLES `servicio_redes` WRITE;
/*!40000 ALTER TABLE `servicio_redes` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicio_redes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id_servicio` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_servicio`),
  KEY `fk_servicios_tipo_servicio_idx` (`fk_tipo_servicio`),
  KEY `fk_servicios_direccion_idx` (`fk_direccion`),
  CONSTRAINT `fk_servicios_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE SET NULL,
  CONSTRAINT `fk_servicios_tipo_servicio` FOREIGN KEY (`fk_tipo_servicio`) REFERENCES `tipos_servicio` (`id_tipo_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('19eLHL3pNdSFMaQvUZkKBrTeeTVNkApZRq81cV3U',2,'172.18.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJlVnlqdjRoNkdueUVRcU1YZUlFUnVSaDRUOEJ2WkkwWU9MSXNkejRVIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9taS1jdWVudGEiLCJyb3V0ZSI6Im1pLWN1ZW50YSJ9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX0sImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjoyfQ==',1787804273),('DDKXNrHqAgfDpiMzT5gTTcPO6QwqbWkQ4p1dHXe6',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJsY3BXemxFZXJTckVFSkZQSVdXQ3lHRWhXeUNlNUhPSERVdTRwVTlhIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1787641186),('k16kABSOt6vYkJ8JzKghZQWXuoMWkVbpTTKmmG7u',NULL,'127.0.0.1','curl/8.19.0','eyJfdG9rZW4iOiJhWDdpRDlFUUtyMWhiTkQxdFg3ZXNzS051SnBucUwyN2RIMWRXZGw5IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOiJob21lIn0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1787641885),('nydyqWuahBmLy0aFCGzVYOgYOviz5Wi5uQVUjzr2',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJraWZzbXVaQmUwcTJXTlhVZlVoeGh2NUw1U2VMUjY5WkpvejVMMzY2IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1787639361),('Qq3O9RUGczn3mtSvp1yNLPYmkdeH0ClthtYiCpik',NULL,'172.18.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJOa1puZHBOcEVUNnN3b1F4UU4wMUlSZ29GVVlTZkZjZ1RzS0xCd0t2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOiJob21lIn0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfSwiY2FydF90b2tlbiI6IjJiYTFkYjhhLWE3YzUtNGQ2MS1iNDY0LTViNjM1ZGM0MGE3MiIsInVybCI6eyJpbnRlbmRlZCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9kYXNoYm9hcmQifX0=',1787725544),('Tc6ZXp8TrkRKWXzOiy1S32tCOmM0wofHr7xXIobC',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJ0RTgwbWN1YU55bU5MYXpwSVo5UnhEb2NLTUZYUUdBOTFtRnVyR0JZIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1787641695);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_categorias`
--

DROP TABLE IF EXISTS `sub_categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_categorias` (
  `id_subcategorias` int(11) NOT NULL AUTO_INCREMENT,
  `nom_sub_categoria` varchar(105) DEFAULT NULL,
  `fk_id_categoria` int(11) NOT NULL,
  PRIMARY KEY (`id_subcategorias`),
  KEY `fk_sub_categorias_categorias1_idx` (`fk_id_categoria`),
  CONSTRAINT `fk_sub_categorias_categorias1` FOREIGN KEY (`fk_id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_categorias`
--

LOCK TABLES `sub_categorias` WRITE;
/*!40000 ALTER TABLE `sub_categorias` DISABLE KEYS */;
INSERT INTO `sub_categorias` VALUES (1,'Alimento Seco',1),(2,'Alimento Húmedo',1),(3,'Alimento BARF',1),(4,'Granel',1),(5,'Snacks y Sazonadores',1),(6,'Alimento Medicado Seco',2),(7,'Alimento Medicado Húmedo',2),(8,'Antiinflamatorios',3),(9,'Cuidado del Hígado',3),(10,'Vitaminas y Suplementos',3),(11,'Cuidado de la Piel',3),(12,'Cuidado del Oído',3),(13,'Cuidado Ocular',3),(14,'Fórmulas para Perritos',3),(15,'Antisépticos',3),(16,'Calmantes',3),(17,'Antibióticos',3),(18,'Juguetes',4),(19,'Camas',4),(20,'Transportadores',4),(21,'Ropa',4),(22,'Collares y Correas',4),(23,'Bozales',4),(24,'Platos y Bebederos',4),(25,'Fuentes de Agua',4),(26,'Antipulgas',5),(27,'Antiparasitarios',5),(28,'Shampoo',5),(29,'Pañales',5),(30,'Toallitas Húmedas',5),(31,'Entrenamiento',5),(32,'Porta Bolsas y Bolsas Multiusos',5),(33,'Cuidado Oral',5),(34,'Peines y Cepillos',5),(35,'Colonias y Perfumes',5),(36,'Alimento Seco',6),(37,'Alimento Húmedo',6),(38,'Alimento BARF',6),(39,'Granel',6),(40,'Snacks y Sazonadores',6),(41,'Alimento Medicado Seco',7),(42,'Alimento Medicado Húmedo',7),(43,'Arenas',8),(44,'Areneros y Palitas',8),(45,'Antiinflamatorios',9),(46,'Cuidado del Hígado',9),(47,'Vitaminas y Suplementos',9),(48,'Cuidado de la Piel',9),(49,'Cuidado del Oído',9),(50,'Cuidado Ocular',9),(51,'Fórmulas para Gatitos',9),(52,'Antisépticos',9),(53,'Calmantes',9),(54,'Antibióticos',9),(55,'Rascadores',10),(56,'Fuentes de Agua',10),(57,'Juguetes',10),(58,'Catnip',10),(59,'Camas',10),(60,'Platos y Bebederos',10),(61,'Collares y Correas',10),(62,'Transportadores',10),(63,'Antipulgas',11),(64,'Antiparasitarios',11),(65,'Shampoo',11),(66,'Toallitas Húmedas',11),(67,'Entrenamiento',11),(68,'Porta Bolsas y Bolsas Multiusos',11),(69,'Cuidado Oral',11),(70,'Peines y Cepillos',11),(71,'Colonias y Perfumes',11);
/*!40000 ALTER TABLE `sub_categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_animales`
--

DROP TABLE IF EXISTS `tipo_animales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_animales` (
  `id_tipo_animal` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_tipo_animal`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_animales`
--

LOCK TABLES `tipo_animales` WRITE;
/*!40000 ALTER TABLE `tipo_animales` DISABLE KEYS */;
INSERT INTO `tipo_animales` VALUES (1,'Normal','2026-08-24 19:55:04'),(2,'Exóticos','2026-08-24 19:55:04');
/*!40000 ALTER TABLE `tipo_animales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_comprobante`
--

DROP TABLE IF EXISTS `tipo_comprobante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_comprobante` (
  `id_tipo_comprobante` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_tipo_comprobante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_comprobante`
--

LOCK TABLES `tipo_comprobante` WRITE;
/*!40000 ALTER TABLE `tipo_comprobante` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_comprobante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_documento`
--

DROP TABLE IF EXISTS `tipo_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_documento` (
  `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  PRIMARY KEY (`id_tipo_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_documento`
--

LOCK TABLES `tipo_documento` WRITE;
/*!40000 ALTER TABLE `tipo_documento` DISABLE KEYS */;
INSERT INTO `tipo_documento` VALUES (1,'DNI'),(2,'CE'),(3,'Pasaporte');
/*!40000 ALTER TABLE `tipo_documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_entregas`
--

DROP TABLE IF EXISTS `tipo_entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_entregas` (
  `id_tipo_entrega` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `requiere_direccion` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_tipo_entrega`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_entregas`
--

LOCK TABLES `tipo_entregas` WRITE;
/*!40000 ALTER TABLE `tipo_entregas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_servicio`
--

DROP TABLE IF EXISTS `tipos_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_servicio` (
  `id_tipo_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  PRIMARY KEY (`id_tipo_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_servicio`
--

LOCK TABLES `tipos_servicio` WRITE;
/*!40000 ALTER TABLE `tipos_servicio` DISABLE KEYS */;
INSERT INTO `tipos_servicio` VALUES (1,'Grooming'),(2,'Veterinaria');
/*!40000 ALTER TABLE `tipos_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trabajadores`
--

DROP TABLE IF EXISTS `trabajadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trabajadores` (
  `id_trabajador` int(11) NOT NULL AUTO_INCREMENT,
  `fk_persona` int(11) NOT NULL,
  `fk_user` bigint(20) unsigned NOT NULL,
  `fk_rol` int(11) NOT NULL,
  `fk_direccion` int(11) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_trabajador`),
  UNIQUE KEY `trabajadores_fk_persona_unique` (`fk_persona`),
  UNIQUE KEY `trabajadores_fk_user_unique` (`fk_user`),
  KEY `fk_trabajadores_rol_idx` (`fk_rol`),
  KEY `fk_trabajadores_direccion_idx` (`fk_direccion`),
  CONSTRAINT `fk_trabajadores_direccion` FOREIGN KEY (`fk_direccion`) REFERENCES `direcciones` (`id_direccion`) ON DELETE SET NULL,
  CONSTRAINT `fk_trabajadores_persona` FOREIGN KEY (`fk_persona`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `fk_trabajadores_rol` FOREIGN KEY (`fk_rol`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `fk_trabajadores_user` FOREIGN KEY (`fk_user`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trabajadores`
--

LOCK TABLES `trabajadores` WRITE;
/*!40000 ALTER TABLE `trabajadores` DISABLE KEYS */;
INSERT INTO `trabajadores` VALUES (3,1,5,1,NULL,'2026-08-25',1,'2026-08-25 07:10:36','2026-08-25 07:10:36');
/*!40000 ALTER TABLE `trabajadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades_medida`
--

DROP TABLE IF EXISTS `unidades_medida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_medida` (
  `id_unidad_medida` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `abreviatura` varchar(10) NOT NULL,
  PRIMARY KEY (`id_unidad_medida`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_medida`
--

LOCK TABLES `unidades_medida` WRITE;
/*!40000 ALTER TABLE `unidades_medida` DISABLE KEYS */;
INSERT INTO `unidades_medida` VALUES (1,'Kilogramo','kg'),(2,'Gramo','g'),(3,'Litro','L'),(4,'Mililitro','ml'),(5,'Unidad','unid'),(6,'Paquete','paq'),(7,'Caja','caja'),(8,'Frasco','frasco');
/*!40000 ALTER TABLE `unidades_medida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_recovery_codes` text DEFAULT NULL,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'mili','jonceano26cristian@gmail.com',NULL,'$2y$12$O7xkFKqSccWzhFanFV1DkuB991QAxnJyXfpko7W62GaNa2aDh.cCm',NULL,NULL,NULL,NULL,'2026-08-24 20:20:10','2026-08-24 20:20:10'),(4,'lpdiego999','lpdiego999@gmail.com',NULL,'$2y$12$2gWeN2knFltKWcRPJxwMbeJJsCjnid2GatmJvGoBUgKK44T5KPuRS',NULL,NULL,NULL,NULL,'2026-08-25 06:22:15','2026-08-25 06:22:15'),(5,'Diego','diego@mosso.com','2026-08-25 07:10:36','$2y$12$5kDBlvHIC7MOkd/AD2Nqc.QJFNvun/KA.osw2Driy8brVz5NcI/PK',NULL,NULL,NULL,NULL,'2026-08-25 07:10:36','2026-08-25 07:10:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 23:26:39
