-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: lucchese_pizza
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('lucchese-pizza-system-cache-16317367de5c773e73efcf33ea38bfa390caecc3','i:2;',1783528484),('lucchese-pizza-system-cache-16317367de5c773e73efcf33ea38bfa390caecc3:timer','i:1783528484;',1783528484),('lucchese-pizza-system-cache-dashboard_stats','a:8:{s:13:\"revenue_today\";d:0;s:17:\"revenue_yesterday\";d:0;s:12:\"orders_today\";i:0;s:16:\"orders_yesterday\";i:0;s:13:\"active_orders\";i:3;s:14:\"products_count\";i:14;s:13:\"flavors_count\";i:49;s:18:\"cash_register_open\";b:1;}',1783527733);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
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
-- Table structure for table `cash_registers`
--

DROP TABLE IF EXISTS `cash_registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_registers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opened_at` timestamp NOT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `opening_balance` bigint NOT NULL,
  `closing_balance` bigint DEFAULT NULL,
  `calculated_balance` bigint DEFAULT NULL,
  `total_sales` bigint NOT NULL DEFAULT '0',
  `total_orders` int DEFAULT NULL,
  `payment_summary` json DEFAULT NULL,
  `difference` bigint DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_registers_user_id_foreign` (`user_id`),
  CONSTRAINT `cash_registers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_registers`
--

LOCK TABLES `cash_registers` WRITE;
/*!40000 ALTER TABLE `cash_registers` DISABLE KEYS */;
INSERT INTO `cash_registers` VALUES ('019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','019cfc64-b34b-73fc-b6bc-2e66753bb0ff','2026-03-17 15:28:21',NULL,6000,NULL,NULL,0,NULL,NULL,NULL,'open',NULL,'2026-03-17 15:28:21','2026-03-17 15:28:21');
/*!40000 ALTER TABLE `cash_registers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complement` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_phone_unique` (`phone`),
  KEY `customers_neighborhood_id_foreign` (`neighborhood_id`),
  CONSTRAINT `customers_neighborhood_id_foreign` FOREIGN KEY (`neighborhood_id`) REFERENCES `neighborhoods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('019d6410-c754-724b-9f20-91c8b1c9643e','JOAO','51997004458',NULL,NULL,NULL,NULL,NULL,'2026-04-06 18:31:54','2026-04-06 18:31:54'),('019d6445-2336-722e-af69-791ded8df1a2','Rita Adriana','51995067094',NULL,NULL,NULL,NULL,NULL,'2026-04-06 19:29:05','2026-04-06 19:29:05'),('019d9759-2ea1-7233-8803-d87470c761a0','rodriguez','51999999999',NULL,NULL,NULL,NULL,NULL,'2026-04-16 17:31:37','2026-04-16 17:31:37'),('019d9840-e582-7100-a858-e8b5d89e0527','Joao Cliente','11988887777',NULL,NULL,NULL,NULL,NULL,'2026-04-16 21:44:43','2026-04-16 21:44:43'),('019dee92-dbc7-7110-8207-57b41df4b928','testepdv','51998838405',NULL,NULL,NULL,NULL,NULL,'2026-05-03 16:01:35','2026-05-03 16:01:35'),('019deea1-c2e0-71e9-9786-aad613d363d3','testecardapiomenu','51992849312',NULL,NULL,NULL,NULL,NULL,'2026-05-03 16:17:51','2026-05-03 16:17:51'),('019deed5-6e09-73ff-8ae0-379998be24ae','testecarapio3','97988979873',NULL,NULL,NULL,NULL,NULL,'2026-05-03 17:14:18','2026-05-03 17:14:18'),('019e1483-ba74-724e-88cf-96c9a2564211','gabriel','51997895959',NULL,NULL,NULL,NULL,NULL,'2026-05-11 00:50:37','2026-05-11 00:50:37'),('019e1497-e208-73e0-a90b-7af9f558c8e7','jonas','51854856265',NULL,NULL,NULL,NULL,NULL,'2026-05-11 01:12:38','2026-05-11 01:12:38'),('019e2c87-7116-7202-b8a6-16d9799bc7ca','claus','51988584899',NULL,NULL,NULL,NULL,NULL,'2026-05-15 16:45:34','2026-05-15 16:45:34'),('019e2ffe-4356-71e9-ab41-c2d2fe40baff','delivery dinheiro','51889595858',NULL,NULL,NULL,NULL,NULL,'2026-05-16 08:54:13','2026-05-16 08:54:13');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_date` date NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('019e25b1-9c2e-7248-843b-893fa265a8a3','luz',25000,'Despesa fixa','2026-05-14',1,'2026-05-14 08:54:17','2026-05-14 08:54:17');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
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
-- Table structure for table `floor_elements`
--

DROP TABLE IF EXISTS `floor_elements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floor_elements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 0xF09F938D,
  `position_x` int NOT NULL DEFAULT '0',
  `position_y` int NOT NULL DEFAULT '0',
  `width` int NOT NULL DEFAULT '100',
  `height` int NOT NULL DEFAULT '80',
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `floor_elements`
--

LOCK TABLES `floor_elements` WRITE;
/*!40000 ALTER TABLE `floor_elements` DISABLE KEYS */;
INSERT INTO `floor_elements` VALUES ('5126ef0c-3848-430f-aa48-89528a22f174','WC','banheiro','🚻',20,520,100,60,0,'2026-03-17 06:57:06','2026-03-17 06:57:06'),('6e69ab5f-89cd-48bd-a4e7-4f7d8f86e2f3','CAIXA','caixa','💰',700,20,100,80,1,'2026-03-17 06:57:06','2026-03-17 06:57:06'),('cbd5993d-c278-499b-9e0d-bcedc10d9694','ENTRADA','entrada','🚪',350,520,120,60,0,'2026-03-17 06:57:06','2026-03-17 06:57:06'),('e87d81cc-45a2-4bd7-9ae0-a8576f3ea155','COZINHA','cozinha','👨‍🍳',700,500,120,80,0,'2026-03-17 06:57:06','2026-03-17 06:57:06');
/*!40000 ALTER TABLE `floor_elements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
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
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
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
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2025_01_01_000000_create_core_tables',1),(5,'2025_01_01_999999_fix_defaults',1),(6,'2025_12_27_171028_create_personal_access_tokens_table',1),(7,'2025_12_30_001048_add_is_active_to_pizza_flavors_table',1),(8,'2025_12_30_005025_add_description_to_pizza_flavors_table',1),(9,'2026_01_04_195324_add_user_id_to_orders_table',1),(10,'2026_01_04_195437_add_type_to_order_items_table',1),(11,'2026_01_04_202525_add_customer_phone_to_orders_table',1),(12,'2026_02_07_060004_create_payments_table',1),(13,'2026_02_08_210000_add_position_to_tables',1),(14,'2026_02_09_040000_create_floor_elements_table',1),(15,'2026_02_09_080000_add_notes_to_order_items_table',1),(16,'2026_02_11_200000_add_delivery_fields_to_orders',1),(17,'2026_02_11_200100_add_payment_and_ready_fields_to_orders',1),(18,'2026_02_11_210000_create_cash_registers_table',1),(19,'2026_02_11_234621_add_summary_to_cash_registers',1),(20,'2026_02_12_085109_create_printer_settings_table',1),(21,'2026_02_19_091800_add_show_on_digital_menu_columns',1),(22,'2026_02_19_093700_add_image_to_products_and_flavors',1),(23,'2026_02_28_080000_add_online_payment_fields',1),(24,'2026_03_09_001839_add_capacity_to_tables_table',1),(25,'2026_03_09_100000_create_customers_table',1),(26,'2026_03_09_120000_add_description_to_order_items_table',1),(27,'2026_03_09_130935_create_store_settings_table',1),(28,'2026_03_09_132120_add_is_active_to_products_table',1),(29,'2026_03_09_140000_add_role_to_users_table',1),(30,'2026_03_09_140100_create_printers_table',1),(31,'2026_03_09_140200_add_profile_to_store_settings',1),(32,'2026_03_09_174416_add_short_code_to_orders_table',1),(33,'2026_03_09_174423_add_short_code_to_orders_table',1),(34,'2026_03_11_114355_add_ingredients_to_pizza_flavors_table',1),(35,'2026_03_13_045358_add_receipt_settings_to_store_settings_table',1),(36,'2026_03_19_190000_create_print_metrics_table',2),(37,'2026_03_19_190100_create_printer_alerts_table',2),(38,'2026_03_26_113629_add_branding_to_store_settings',2),(39,'2026_04_06_135447_add_profile_details_to_store_settings_table',3),(40,'2026_04_06_183023_add_city_and_observation_to_neighborhoods_table',4),(41,'2026_04_08_023741_add_google_maps_urls_to_store_settings_table',5),(42,'2026_04_18_000000_fix_pix_qr_code_base64_length',6),(43,'2026_04_20_211715_change_method_to_string_on_payments_table',7),(44,'2026_04_27_051738_update_foreign_keys_for_on_delete_behavior',8),(45,'2026_04_27_061429_add_indexes_and_soft_deletes_to_core_tables',9),(46,'2026_04_27_064948_refactor_currency_columns_to_cents',10),(47,'2026_04_27_141323_add_date_indexes_to_orders_table',11),(48,'2026_04_29_184221_fix_double_multiplied_currency_columns',12),(49,'2026_05_10_032848_upgrade_catalog_for_variations_visibility_and_ingredients',13),(50,'2026_05_10_154840_fix_missing_columns_for_catalog_erp',14),(51,'2026_05_11_030709_add_background_media_to_store_settings_table',15),(52,'2026_05_11_125950_upgrade_store_settings_for_media_carousel',16),(53,'2026_05_14_053147_create_expenses_table',17),(54,'2026_05_14_085012_add_integrations_to_store_settings_table',18);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `neighborhoods`
--

DROP TABLE IF EXISTS `neighborhoods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `neighborhoods` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Torres',
  `delivery_fee` bigint NOT NULL DEFAULT '0',
  `observation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `neighborhoods`
--

LOCK TABLES `neighborhoods` WRITE;
/*!40000 ALTER TABLE `neighborhoods` DISABLE KEYS */;
INSERT INTO `neighborhoods` VALUES ('019d64b5-92cf-7211-9e7b-832d001c9c22','Centro','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9313-7061-a0b4-dc34cae517b9','Beira mar','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-931c-725e-a8e2-f676b7f9b324','Predial','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-932a-7394-b2dd-bc3500d5a451','Centenário','Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9333-70e6-8db0-7b406610beab','Curtume','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9337-70ff-9ec2-d1cc3e1281c2','Campo bonito','Torres',4000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-933c-7250-b8cd-e6e52c58c204','Dunas','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9340-72db-b5e3-e453a2228a6a','Engenho Velho','Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9347-7024-925a-fa2c8da290fa','Faxinal','Torres',2000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-934d-7136-ad11-0e71ab5a1a8d','Faxinal Zena','Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9354-7053-825a-8f69f16a720f','Faxinal pele','Torres',3500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-935b-7259-a5c9-b4a293211ec0','Faxina Motel','Torres',3000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9364-7170-9083-fc7aa0789ba6','Tamburiki','Torres',4500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-936d-710e-83ff-706e8a72c9db','Getúlio Vargas','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9375-7280-9740-843b88179079','Guarita','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9379-715c-b9c7-f7bdb2c53e8a','Igra Norte','Torres',1300,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-937c-7124-94e4-1a64d7ae9b16','Igra Sul','Torres',1300,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9380-7348-b29f-b51602db0ca2','Itapeva','Torres',5000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9383-73bc-a91d-56b1e3afaa9f','Itapeva Sul','Torres',5000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9387-728f-a615-2d03a6f9edaa','Jacaré','Torres',2500,'início','2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-938b-726e-96d8-64966d28baf9','Balonismo','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9391-70f6-98a9-49d196c6ebcf','Porto Alegre','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9398-715e-87ce-18119e6de69d','Riacho Doce','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-939f-725e-9b8a-2e3595ce181b','São Jorge','Torres',1800,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93b1-713a-9534-0f2d3f10db89','Salinas 1','Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93b5-70fb-889c-47b0711a8aa3','Salinas 2','Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93b9-7375-a6ff-de73fd56e777','São Francisco','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93bd-7329-886f-ade543d6a906','São Brás','Torres',6000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93c0-70bf-b597-006e08388812','Stan','Torres',1200,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93c4-705b-be35-84adc740f189','Vila São João','Torres',2500,'até Davi','2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93c8-7387-af00-283ab6be8e03','Reserva das águas','Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93cd-7216-8cba-acba4a49c9c4','Outro condomínio','Torres',2000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93d2-720f-8249-031843492800','Centro','Passo de Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93d9-717f-9007-a3607a099168','Progresso','Passo de Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93e0-70cd-bf44-48b0ff3bd014','Estaleiro','Passo de Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93e9-7338-a367-17335c5ff4db','Silveira','Passo de Torres',1500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93ed-7164-b58c-ce31ad2c9fb1','Novo passo','Passo de Torres',2000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93f1-7338-b7df-adcac2f92ff8','Bosque','Passo de Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93f5-70d1-bc73-cf8cad4564e8','Alto feliz','Passo de Torres',1800,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93f7-736c-aaab-dd21ddc2aa26','Passárgada','Passo de Torres',1800,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93fa-728a-81bb-8ec30200e239','Barra Velha','Passo de Torres',2000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-93fd-70ce-84f5-18e3019bf3a0','Praia Azul','Passo de Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9404-7154-bdf2-379ed97318c2','Caravelle','Passo de Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-940a-7031-9c3e-8e9cd388af53','Mirratorres','Passo de Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9411-7144-b665-c9667d54d551','Jardim América','Passo de Torres',2500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9420-73f6-aaff-ae65c1e08221','Pérola','Passo de Torres',3500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-9428-71cb-b40e-139b85bc27e2','Ribeiro','Passo de Torres',4500,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54'),('019d64b5-942c-7058-a865-184c14b019c0','Bella Torres','Passo de Torres',5000,NULL,'2026-04-06 21:31:54','2026-04-06 21:31:54');
/*!40000 ALTER TABLE `neighborhoods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item_flavors`
--

DROP TABLE IF EXISTS `order_item_flavors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item_flavors` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_item_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pizza_flavor_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fraction` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_item_flavors_order_item_id_foreign` (`order_item_id`),
  KEY `order_item_flavors_pizza_flavor_id_foreign` (`pizza_flavor_id`),
  CONSTRAINT `order_item_flavors_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_item_flavors_pizza_flavor_id_foreign` FOREIGN KEY (`pizza_flavor_id`) REFERENCES `pizza_flavors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item_flavors`
--

LOCK TABLES `order_item_flavors` WRITE;
/*!40000 ALTER TABLE `order_item_flavors` DISABLE KEYS */;
INSERT INTO `order_item_flavors` VALUES ('04fdaeb6-627e-496a-843d-2c5a797176aa','019e23d7-b4c4-727a-9090-a92d9c06b3e3','019cfc64-b3a9-7018-b7e8-51f84ec6cd47','1/3','2026-05-14 00:16:39','2026-05-14 00:16:39'),('07ae3db7-8ce4-4bee-b41b-90947243a6ea','019e2e52-6780-70ea-8b1b-54745ec103ea','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-16 01:06:53','2026-05-16 01:06:53'),('0b0b0a44-9ef6-496c-bde6-75c822d26ab6','019deefb-a966-70c3-bf39-cd1553201e9f','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-03 17:56:03','2026-05-03 17:56:03'),('0c5c6d08-56a3-484f-95e4-ca04ff63ed94','019e1483-ba8c-7051-961d-a7af4e73368a','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-11 00:50:37','2026-05-11 00:50:37'),('124a098a-7a56-4180-8dec-2675130c1a47','019e2e52-6780-70ea-8b1b-54745ec103ea','019cfc64-b4da-719e-b67a-b5e47db39058','1/3','2026-05-16 01:06:53','2026-05-16 01:06:53'),('16ace383-9391-49b1-ac03-56b2fb408faa','019e1479-d232-70ed-9c66-578aa7bd7b1e','019cfc64-b48e-721e-92a1-e24727fa2048','1/2','2026-05-11 00:39:48','2026-05-11 00:39:48'),('1b9019dc-400d-4bc3-8160-6e01f59f318d','019deea1-f385-7268-8e9b-40134b7468f3','019cfc64-b4d1-7102-8a79-2b07c661c5a0','1/3','2026-05-03 16:18:04','2026-05-03 16:18:04'),('1c7a531d-f7b1-4f6e-b293-2f0ff9ffe341','019dfe9a-708f-7081-a6fa-145391b7d55a','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-06 18:43:47','2026-05-06 18:43:47'),('2524db49-f5a9-47ed-85ac-e6127ddcc5cb','019dee92-dbf4-7022-968a-12c7bb18e492','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-03 16:01:35','2026-05-03 16:01:35'),('29e58983-6b86-490f-b0dc-9a359a94a89c','019deedc-cf7a-70f5-9bf0-14d8d3505abe','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-03 17:22:21','2026-05-03 17:22:21'),('2bccebfc-bf4f-4556-bfca-8b1cec006e07','019dfe4e-4f38-70bd-8e83-1917a475499d','019cfc64-b3f2-7160-adc0-1b6aaee89b50','1/3','2026-05-06 17:20:38','2026-05-06 17:20:38'),('2c274659-5bdc-48b3-aa5c-2b7d9ddd25dd','019e23d7-b4c4-727a-9090-a92d9c06b3e3','019cfc64-b478-73d7-b8ea-194a530287bf','1/3','2026-05-14 00:16:39','2026-05-14 00:16:39'),('2d5fe9bb-1d5f-4a6d-903f-e6133d5c9955','019deedb-b847-73a4-9a6a-2512700523a4','019cfc64-b3d1-7023-8a4f-4680f3032755','1/1','2026-05-03 17:21:10','2026-05-03 17:21:10'),('3cdf30e7-ac8c-43f2-a57c-9591f588784b','019deec1-b4fb-70c1-8fb3-fbd666b57f34','019cfc64-b462-714f-84e0-a6d36155a7c5','1/3','2026-05-03 16:52:45','2026-05-03 16:52:45'),('41220547-f179-40e6-b0f2-ba6902073a77','019dfe9a-708f-7081-a6fa-145391b7d55a','019cfc64-b3c3-7006-aae4-c0a39635587b','1/3','2026-05-06 18:43:47','2026-05-06 18:43:47'),('4391c24e-5d4f-48f4-92ed-d58f6baff7f8','019deefb-a966-70c3-bf39-cd1553201e9f','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-03 17:56:03','2026-05-03 17:56:03'),('4a4d1828-ec17-44ba-9838-13f5e46fa97f','019e00d2-1132-7255-8918-26ff9c461aec','019cfc64-b43a-7047-8e4e-5d9221948740','1/3','2026-05-07 05:03:47','2026-05-07 05:03:47'),('5529790c-547b-4075-bec0-691b1d742264','019dfe4e-4f38-70bd-8e83-1917a475499d','019cfc64-b4da-719e-b67a-b5e47db39058','1/3','2026-05-06 17:20:38','2026-05-06 17:20:38'),('590aafa6-c97b-41e7-82a0-4511da6366bc','019e137e-5530-731a-82ab-3ac76db483a1','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-10 20:05:06','2026-05-10 20:05:06'),('5ea9e70a-f342-4076-ac05-9a242fed6bc7','019e1479-d232-70ed-9c66-578aa7bd7b1e','019cfc64-b3a9-7018-b7e8-51f84ec6cd47','1/2','2026-05-11 00:39:48','2026-05-11 00:39:48'),('5ed10862-558c-41d1-bc1c-0d1efe3270f3','019e2e5a-2782-71db-a9d6-2d2afecdc47f','019cfc64-b4d1-7102-8a79-2b07c661c5a0','1/2','2026-05-16 01:15:20','2026-05-16 01:15:20'),('69ccce10-c32a-4ba2-af99-d107addc4cb9','019deec1-b4fb-70c1-8fb3-fbd666b57f34','019cfc64-b430-717c-9fec-3cbd1dbbbb96','1/3','2026-05-03 16:52:45','2026-05-03 16:52:45'),('6f74d57c-193f-4d6f-b746-a6f00d9ed5e9','019e6b89-597e-71bb-90fb-ed94a5a873a3','019cfc64-b455-7043-aaca-a8e56db0a8d8','1/3','2026-05-27 22:23:44','2026-05-27 22:23:44'),('70751907-dede-4908-8c45-bde24ffe8bfd','019dee92-dbf4-7022-968a-12c7bb18e492','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-03 16:01:35','2026-05-03 16:01:35'),('76c4e5a7-ae1c-4e10-95f3-f1a5a00488d7','019e2c88-6f21-73af-9656-3efb1f42a059','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-15 16:46:39','2026-05-15 16:46:39'),('7963ec14-ee95-41ba-b7e7-70695c377ab8','019deefb-a966-70c3-bf39-cd1553201e9f','019cfc64-b3ca-7371-8ba5-4712fa95bfa6','1/3','2026-05-03 17:56:03','2026-05-03 17:56:03'),('7d24d8e7-9047-4024-8c64-10ffeec75ee3','019e2c88-6f21-73af-9656-3efb1f42a059','019cfc64-b3f2-7160-adc0-1b6aaee89b50','1/3','2026-05-15 16:46:39','2026-05-15 16:46:39'),('7e88ecac-b9f0-465e-bdf6-233998917f81','019e2e5a-2782-71db-a9d6-2d2afecdc47f','019cfc64-b3d1-7023-8a4f-4680f3032755','1/2','2026-05-16 01:15:20','2026-05-16 01:15:20'),('85746510-01a4-4aef-9246-5527003df388','019e137e-5530-731a-82ab-3ac76db483a1','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-10 20:05:06','2026-05-10 20:05:06'),('883dc2b8-b6f2-412d-a89e-74bc993e89f5','019e2c8c-0bd2-7262-a3b7-36029cf808f7','019cfc64-b3a9-7018-b7e8-51f84ec6cd47','1/1','2026-05-15 16:50:36','2026-05-15 16:50:36'),('95ee8004-3a48-4d66-be92-fd4c0e5e532f','019dfea1-621e-7228-9a3f-a06e4a36b393','019cfc64-b4d1-7102-8a79-2b07c661c5a0','1/3','2026-05-06 18:51:22','2026-05-06 18:51:22'),('9b33876a-0df7-4f97-a358-5403511d89ba','019e1483-ba8c-7051-961d-a7af4e73368a','019cfc64-b4b1-708b-b1d7-86e2d669948a','1/3','2026-05-11 00:50:37','2026-05-11 00:50:37'),('9fc21355-0206-40b2-84e1-63af0be3a64c','019e0f8c-faad-72ba-9314-a55a729a1651','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-10 01:42:37','2026-05-10 01:42:37'),('a26d8321-3db4-4688-a247-4fbfb2085e85','019deec1-b4fb-70c1-8fb3-fbd666b57f34','019cfc64-b40c-71f8-888a-4bd86e170885','1/3','2026-05-03 16:52:45','2026-05-03 16:52:45'),('a2e81056-4cf9-4377-a4fe-46487fa1bd4c','019e23d5-606d-7384-aad2-375e1a172e1a','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-14 00:14:06','2026-05-14 00:14:06'),('ab6fc010-c993-4d8b-a758-7e98b3c28e1f','019e00d2-1132-7255-8918-26ff9c461aec','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-07 05:03:47','2026-05-07 05:03:47'),('ac6cf03c-32a8-4ffe-8fd2-a44a15b39764','019deedc-cf7a-70f5-9bf0-14d8d3505abe','019cfc64-b3ea-72cc-96f3-ab8da3380f17','1/3','2026-05-03 17:22:21','2026-05-03 17:22:21'),('ac90f277-2602-489d-ad47-cca325d28ba5','019dee92-dbf4-7022-968a-12c7bb18e492','019cfc64-b43a-7047-8e4e-5d9221948740','1/3','2026-05-03 16:01:35','2026-05-03 16:01:35'),('b1ef0507-8e92-4cc5-a6aa-479d04805cf4','019e6b89-597e-71bb-90fb-ed94a5a873a3','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-27 22:23:43','2026-05-27 22:23:43'),('b7e9e837-395b-43b2-9c8d-29638c9aaa73','019e6b89-597e-71bb-90fb-ed94a5a873a3','019cfc64-b430-717c-9fec-3cbd1dbbbb96','1/3','2026-05-27 22:23:44','2026-05-27 22:23:44'),('b83bc559-0bf4-4bbf-b50a-f6ab02a56ac7','019e00d2-1132-7255-8918-26ff9c461aec','019cfc64-b4d1-7102-8a79-2b07c661c5a0','1/3','2026-05-07 05:03:47','2026-05-07 05:03:47'),('bd4fca37-d65f-4a54-857a-4bd6d9b85576','019dfe9a-708f-7081-a6fa-145391b7d55a','019cfc64-b4d1-7102-8a79-2b07c661c5a0','1/3','2026-05-06 18:43:47','2026-05-06 18:43:47'),('c1a83e46-9b5a-43cc-83ee-637b2e887c0a','019e2c88-6f21-73af-9656-3efb1f42a059','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-15 16:46:39','2026-05-15 16:46:39'),('ca68a9d4-78cd-4bc7-9eec-3f15549013e1','019dfe4e-4f38-70bd-8e83-1917a475499d','019cfc64-b492-71f9-a13b-f50de9e0bd82','1/3','2026-05-06 17:20:38','2026-05-06 17:20:38'),('d1f64671-e47b-49f2-8d2c-a18c0553ab4a','019e23d7-b4c4-727a-9090-a92d9c06b3e3','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-14 00:16:39','2026-05-14 00:16:39'),('d42b4403-612e-4b99-bdfa-d7160ef9d93d','019deea1-f385-7268-8e9b-40134b7468f3','019cfc64-b3d1-7023-8a4f-4680f3032755','1/3','2026-05-03 16:18:04','2026-05-03 16:18:04'),('d46207ac-4a27-4ead-a755-4072bbd9398b','019e2ffe-efb5-71c7-a40c-a380205091cd','019cfc64-b48e-721e-92a1-e24727fa2048','1/2','2026-05-16 08:54:57','2026-05-16 08:54:57'),('d78cc69e-1898-4353-a2c7-71efc87dbd68','019e0f8c-faad-72ba-9314-a55a729a1651','019cfc64-b459-7250-a851-174fe2af9142','1/3','2026-05-10 01:42:38','2026-05-10 01:42:38'),('d8e8ff78-7281-4ee6-aa7d-70560a330afc','019dfea1-621e-7228-9a3f-a06e4a36b393','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-06 18:51:22','2026-05-06 18:51:22'),('dd206857-c0a4-4590-815b-a7a21d2e67d5','019e0f8c-faad-72ba-9314-a55a729a1651','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-10 01:42:38','2026-05-10 01:42:38'),('e1ddf57f-cabd-43b4-b834-3cc94b51ae59','019dfea1-621e-7228-9a3f-a06e4a36b393','019cfc64-b3c3-7006-aae4-c0a39635587b','1/3','2026-05-06 18:51:22','2026-05-06 18:51:22'),('e4453f67-3994-4a38-bdf0-0e273b58415f','019deea1-f385-7268-8e9b-40134b7468f3','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-03 16:18:04','2026-05-03 16:18:04'),('eeb6354c-36ad-4a46-9c13-2d3f62e5ab65','019deedc-cf7a-70f5-9bf0-14d8d3505abe','019cfc64-b41c-7165-9412-4845900950a8','1/3','2026-05-03 17:22:21','2026-05-03 17:22:21'),('f299e93a-3d16-49a4-8b5e-237a47843d26','019e78f7-bddd-7162-a2d9-8c67548fd9fb','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-30 12:59:22','2026-05-30 12:59:22'),('f2d1acda-2601-4294-bbbc-af64173fabac','019e2e52-6780-70ea-8b1b-54745ec103ea','019cfc64-b4b1-708b-b1d7-86e2d669948a','1/3','2026-05-16 01:06:53','2026-05-16 01:06:53'),('fad18ea1-d93a-4fa3-bec6-0628ba7ee986','019e137e-5530-731a-82ab-3ac76db483a1','019cfc64-b459-7250-a851-174fe2af9142','1/3','2026-05-10 20:05:06','2026-05-10 20:05:06'),('fd29a57b-64ac-4da3-ba4d-ff303de92f79','019e1483-ba8c-7051-961d-a7af4e73368a','019cfc64-b48e-721e-92a1-e24727fa2048','1/3','2026-05-11 00:50:37','2026-05-11 00:50:37');
/*!40000 ALTER TABLE `order_item_flavors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'product',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pizza_size_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` bigint NOT NULL DEFAULT '0',
  `subtotal` bigint NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_pizza_size_id_foreign` (`pizza_size_id`),
  KEY `order_items_product_id_foreign` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_pizza_size_id_foreign` FOREIGN KEY (`pizza_size_id`) REFERENCES `pizza_sizes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES ('019dee92-dbf4-7022-968a-12c7bb18e492','pizza_custom','Pizza Grande','019dee92-dbee-7158-8418-95c5d9df0eb1','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,NULL,'2026-05-03 16:01:35','2026-05-03 16:01:35',NULL),('019deea1-f385-7268-8e9b-40134b7468f3','pizza',NULL,'019deea1-f382-701f-bfb1-4aa49fc0efae','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,'⚠️ Alho: S/ Orégano|⚠️ Banana com Doce de Leite: S/ doce de leite|⚠️ Camarão ao 4 Queijos: S/ Catupiry','2026-05-03 16:18:04','2026-05-03 16:18:04',NULL),('019deec1-b4fb-70c1-8fb3-fbd666b57f34','pizza_custom','Pizza Grande','019deec1-b4ee-719e-9789-4488c334bfc2','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,11500,11500,NULL,'2026-05-03 16:52:45','2026-05-03 16:52:45',NULL),('019deedb-b847-73a4-9a6a-2512700523a4','pizza',NULL,'019deedb-b83e-7055-8ea9-92fc8fe46e05','019cfc64-b353-7151-93a0-a0e981397a18',NULL,1,4250,4250,NULL,'2026-05-03 17:21:10','2026-05-03 17:21:10',NULL),('019deedc-cf7a-70f5-9bf0-14d8d3505abe','pizza_custom','Pizza Grande','019deedc-cf77-712a-b1a8-63a29e229558','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,NULL,'2026-05-03 17:22:21','2026-05-03 17:22:21',NULL),('019deefb-a966-70c3-bf39-cd1553201e9f','pizza_custom','Pizza Grande','019deefb-a953-7375-ac3b-ac2c0b528c7a','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ catupiry|⚠️ Toscana: S/ pimentões coloridos|⚠️ Vegetariana: S/ ervilha|Obs: bem assada','2026-05-03 17:56:03','2026-05-03 17:56:03',NULL),('019dfa6b-d26b-71ab-9d25-204be8570a3a','product','Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)','019dfa6b-d236-71ab-93cc-d7d27cfd8032',NULL,'019cfc64-b4f2-738b-a14d-e420462ef467',1,7000,7000,NULL,'2026-05-05 23:14:23','2026-05-05 23:14:23',NULL),('019dfe4e-4f38-70bd-8e83-1917a475499d','pizza_custom','Pizza Grande','019dfe4e-4ef3-701d-bbba-0f29cb69104a','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,8500,8500,NULL,'2026-05-06 17:20:38','2026-05-06 17:20:38',NULL),('019dfe9a-227e-7037-b268-ef535cc2da13','product','Água com/sem Gás','019dfe9a-2276-7266-87af-0087364e7b89',NULL,NULL,1,500,500,NULL,'2026-05-06 18:43:27','2026-05-06 18:43:27',NULL),('019dfe9a-708f-7081-a6fa-145391b7d55a','pizza_custom','Pizza Grande','019dfe9a-708c-70c5-b202-e55e93da1445','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Banana com Doce de Leite: S/ canela','2026-05-06 18:43:47','2026-05-06 18:43:47',NULL),('019dfea1-15ee-709d-b8a8-eb632793d5ec','product','Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)','019dfea1-15e8-7329-ae7b-3bfd1bfaf088',NULL,'019cfc64-b4f2-738b-a14d-e420462ef467',1,7000,7000,NULL,'2026-05-06 18:51:03','2026-05-06 18:51:03',NULL),('019dfea1-621e-7228-9a3f-a06e4a36b393','pizza_custom','Pizza Grande','019dfea1-621a-7250-aa85-005df697425b','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,NULL,'2026-05-06 18:51:22','2026-05-06 18:51:22',NULL),('019e00cb-7dec-71cc-bd20-d43de7d2f450','product','Cerveja Artesanal','019e00cb-7ddc-727f-9713-222858958c1a',NULL,'019cfc64-b533-7198-86fe-91d1f34a88c5',1,2000,2000,NULL,'2026-05-07 04:56:36','2026-05-07 04:56:36',NULL),('019e00d2-1132-7255-8918-26ff9c461aec','pizza_custom','Pizza Grande','019e00d2-112b-70b7-bdcd-44eabc1cf3a4','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Banana com Doce de Leite: S/ canela|⚠️ Camarão ao 4 Queijos: S/ catupiry|⚠️ Camarão ao 4 Queijos: S/ Provolone|⚠️ Putanesca: S/ alcaparras','2026-05-07 05:03:47','2026-05-07 05:03:47',NULL),('019e0f8c-faa9-70e4-bda3-28805a92b63e','product','Água com/sem Gás','019e0f8c-faa1-7044-a73d-b0e0fbcbba50',NULL,NULL,1,500,500,NULL,'2026-05-10 01:42:37','2026-05-10 01:42:37',NULL),('019e0f8c-faac-7156-9cf7-a7848433540c','product','Água com/sem Gás','019e0f8c-faa1-7044-a73d-b0e0fbcbba50',NULL,NULL,1,500,500,NULL,'2026-05-10 01:42:37','2026-05-10 01:42:37',NULL),('019e0f8c-faad-72ba-9314-a55a729a1651','pizza_custom','Pizza Grande','019e0f8c-faa1-7044-a73d-b0e0fbcbba50','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ catupiry|⚠️ Toscana: S/ pimentões coloridos|⚠️ Siciliana: S/ cebola caramelizada|Obs: Bem assada, por favor joaooooo','2026-05-10 01:42:37','2026-05-10 01:42:37',NULL),('019e137e-552c-70d1-b581-b8cb802728ec','product','Cerveja Latão (therezópolis gold)','019e137e-5521-7157-8325-ac032fb5f450',NULL,'b5483542-9854-46f1-a920-6cb3fcbc39fb',1,1500,1500,'therezópolis gold','2026-05-10 20:05:06','2026-05-10 20:05:06',NULL),('019e137e-552f-734a-9201-36e92da7e4f3','product','Água Mineral (Sem Gás)','019e137e-5521-7157-8325-ac032fb5f450',NULL,'019e136f-794d-72f9-a02f-ccf0f2ddb27f',1,500,500,'Sem Gás','2026-05-10 20:05:06','2026-05-10 20:05:06',NULL),('019e137e-5530-731a-82ab-3ac76db483a1','pizza_custom','Pizza Grande','019e137e-5521-7157-8325-ac032fb5f450','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ catupiry|⚠️ Toscana: S/ pimentões coloridos|⚠️ Siciliana: S/ Bacon|Obs: bem assada','2026-05-10 20:05:06','2026-05-10 20:05:06',NULL),('019e1479-d22d-704b-8ae4-671dd0b0ca54','product','Água Mineral (Com Gás)','019e1479-d221-705e-8fc9-ea0dcea23fb2',NULL,'019e136f-794d-72f9-a02f-ccf0f2ddb27f',1,500,500,'Com Gás','2026-05-11 00:39:48','2026-05-11 00:39:48',NULL),('019e1479-d230-7348-9c68-486f2c85eec7','product','Cerveja Latão (heineken)','019e1479-d221-705e-8fc9-ea0dcea23fb2',NULL,'b5483542-9854-46f1-a920-6cb3fcbc39fb',1,1500,1500,'heineken','2026-05-11 00:39:48','2026-05-11 00:39:48',NULL),('019e1479-d231-7070-90c5-88b7ac153335','product','Refrigerante 2 Litros (sprite (zero))','019e1479-d221-705e-8fc9-ea0dcea23fb2',NULL,'facaf379-b46d-4adb-8da7-7782f3dac7f2',1,1500,1500,'sprite (zero)','2026-05-11 00:39:48','2026-05-11 00:39:48',NULL),('019e1479-d232-70ed-9c66-578aa7bd7b1e','pizza_custom','Pizza Grande','019e1479-d221-705e-8fc9-ea0dcea23fb2','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Bacon: S/ orégano|⚠️ Camarão ao 4 Queijos: S/ Provolone|Obs: bem assada','2026-05-11 00:39:48','2026-05-11 00:39:48',NULL),('019e1483-ba87-7133-842b-ee04ec085501','product','Água Mineral (Sem Gás)','019e1483-ba80-70cb-9e94-44881bea9872',NULL,'019e136f-794d-72f9-a02f-ccf0f2ddb27f',1,500,500,'Sem Gás','2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e1483-ba8a-7349-9f96-e963f8825447','product','Refrigerante Lata (coca cola (zero))','019e1483-ba80-70cb-9e94-44881bea9872',NULL,NULL,1,600,600,'coca cola (zero)','2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e1483-ba8a-7349-9f96-e963f8ff947e','product','Refrigerante Lata (Fanta Guarana)','019e1483-ba80-70cb-9e94-44881bea9872',NULL,'da33a7e0-413f-41fd-b38a-d0b4022f4df2',1,600,600,'Fanta Guarana','2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e1483-ba8b-720f-a79d-12703054b491','product','Cerveja Latão (heineken)','019e1483-ba80-70cb-9e94-44881bea9872',NULL,'b5483542-9854-46f1-a920-6cb3fcbc39fb',1,1500,1500,'heineken','2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e1483-ba8c-7051-961d-a7af4e73368a','pizza_custom','Pizza Grande','019e1483-ba80-70cb-9e94-44881bea9872','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ Provolone|⚠️ Toscana: S/ pimentões coloridos|Obs: bem assada','2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e23d5-606d-7384-aad2-375e1a172e1a','pizza',NULL,'019e23d5-6045-7311-b236-a86c72cca505','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,NULL,'2026-05-14 00:14:06','2026-05-14 00:14:06',NULL),('019e23d7-b4c2-713a-8833-2c4e83e4804b','product','Água Mineral (Sem Gás)','019e23d7-b4bf-71b7-a0f0-0eb5907105b2',NULL,'019e136f-794d-72f9-a02f-ccf0f2ddb27f',1,500,500,'Sem Gás','2026-05-14 00:16:39','2026-05-14 00:16:39',NULL),('019e23d7-b4c3-72ae-a636-958467b342d4','product','Cerveja Latão (heineken)','019e23d7-b4bf-71b7-a0f0-0eb5907105b2',NULL,'b5483542-9854-46f1-a920-6cb3fcbc39fb',1,1500,1500,'heineken','2026-05-14 00:16:39','2026-05-14 00:16:39',NULL),('019e23d7-b4c4-727a-9090-a92d9c06b3e3','pizza_custom','Pizza Grande','019e23d7-b4bf-71b7-a0f0-0eb5907105b2','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Bacon: S/ Queijo Mussarela|⚠️ Camarão ao 4 Queijos: S/ catupiry|Obs: bem assada','2026-05-14 00:16:39','2026-05-14 00:16:39',NULL),('019e2c88-6f21-73af-9656-3efb1f42a059','pizza',NULL,'019e2c88-6f19-704a-bfbf-a7df2cd2214a','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,'⚠️ Atum: S/ Queijo mussarela ralado|⚠️ Camarão ao 4 Queijos: S/ Catupiry|⚠️ Toscana: S/ azeitona verde','2026-05-15 16:46:39','2026-05-15 16:46:39',NULL),('019e2c8c-0bd2-7262-a3b7-36029cf808f7','pizza',NULL,'019e2c8c-0bcb-73a0-ab9c-eb4c12edd6ee','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,7500,7500,NULL,'2026-05-15 16:50:36','2026-05-15 16:50:36',NULL),('019e2e52-6780-70ea-8b1b-54745ec103ea','pizza_custom','Pizza Grande','019e2e52-6730-7016-b8fb-9c4b94c00c1c','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ Queijo Mussarela|Obs: bem assada','2026-05-16 01:06:52','2026-05-16 01:06:52',NULL),('019e2e5a-2782-71db-a9d6-2d2afecdc47f','pizza_custom','Pizza Grande','019e2e5a-277d-7258-a24b-9cad1a2fdf0d','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10000,10000,'⚠️ Alho: S/ orégano|Obs: kukukugukgkugkugukg','2026-05-16 01:15:20','2026-05-16 01:15:20',NULL),('019e2ffe-efb5-71c7-a40c-a380205091cd','pizza',NULL,'019e2ffe-efa9-7233-a95a-40e06edb5425','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,NULL,'2026-05-16 08:54:57','2026-05-16 08:54:57',NULL),('019e6b89-597e-71bb-90fb-ed94a5a873a3','pizza_custom','Pizza Grande','019e6b89-5974-713b-a206-e5915fee77d2','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,12500,12500,'⚠️ Camarão ao 4 Queijos: S/ Provolone|⚠️ Camarão ao 4 Queijos: S/ catupiry|Obs: assar bem pizza','2026-05-27 22:23:43','2026-05-27 22:23:43',NULL),('019e78f7-bddd-7162-a2d9-8c67548fd9fb','pizza',NULL,'019e78f7-bd9e-702d-a0d2-06be2ad5ac69','019cfc64-b37c-7172-a416-46ef031aabaf',NULL,1,10500,10500,NULL,'2026-05-30 12:59:22','2026-05-30 12:59:22',NULL),('019f428b-4d2d-7010-884b-e50db7311988','product','Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)','019f428b-4cdf-72fb-a2f0-c98b5ce8f5c9',NULL,'019cfc64-b4f2-738b-a14d-e420462ef467',1,7000,7000,NULL,'2026-07-08 16:24:13','2026-07-08 16:24:13',NULL),('019f428b-4d2f-70d7-9151-ffbd384bb00a','product','Cerveja Latão (heineken)','019f428b-4cdf-72fb-a2f0-c98b5ce8f5c9',NULL,'b5483542-9854-46f1-a920-6cb3fcbc39fb',1,1500,1500,'heineken','2026-07-08 16:24:13','2026-07-08 16:24:13',NULL),('019f428b-4d30-73ba-806b-1f633dd29ca6','product','Refrigerante 600ml (coca cola (zero))','019f428b-4cdf-72fb-a2f0-c98b5ce8f5c9',NULL,'3888e732-746f-463f-8e80-cfc4c6b8b125',1,800,800,'coca cola (zero)','2026-07-08 16:24:13','2026-07-08 16:24:13',NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `table_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cash_register_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_gateway_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method_online` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `online_payment_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pix_qr_code` text COLLATE utf8mb4_unicode_ci,
  `pix_qr_code_base64` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'salon',
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_complement` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_fee` bigint NOT NULL DEFAULT '0',
  `customer_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` bigint NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `paid_at` timestamp NULL DEFAULT NULL,
  `change_amount` bigint DEFAULT NULL,
  `ready_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_short_code_unique` (`short_code`),
  KEY `orders_user_id_foreign` (`user_id`),
  KEY `orders_neighborhood_id_foreign` (`neighborhood_id`),
  KEY `orders_cash_register_id_foreign` (`cash_register_id`),
  KEY `orders_customer_id_foreign` (`customer_id`),
  KEY `orders_status_index` (`status`),
  KEY `orders_table_id_index` (`table_id`),
  KEY `orders_created_at_index` (`created_at`),
  KEY `orders_paid_at_index` (`paid_at`),
  CONSTRAINT `orders_cash_register_id_foreign` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_neighborhood_id_foreign` FOREIGN KEY (`neighborhood_id`) REFERENCES `neighborhoods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('019dee92-dbee-7158-8418-95c5d9df0eb1','HHMUU',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'pickup','testepdv',NULL,NULL,0,NULL,12500,NULL,'2026-05-03 16:01:35',NULL,NULL,NULL,NULL,NULL,'2026-05-03 16:01:35','2026-05-06 17:18:10',NULL),('019deea1-f382-701f-bfb1-4aa49fc0efae','5URDP',NULL,NULL,NULL,NULL,NULL,'delivered',NULL,NULL,NULL,NULL,NULL,'pickup','testecardapiomenu',NULL,NULL,0,'51992849312',10500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 16:18:04','2026-05-06 17:18:11',NULL),('019deec1-b4ee-719e-9789-4488c334bfc2','DCNJZ',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'pickup','testepdv2',NULL,NULL,0,NULL,11500,NULL,'2026-05-03 16:52:45',NULL,NULL,NULL,NULL,NULL,'2026-05-03 16:52:45','2026-05-06 17:18:12',NULL),('019deedb-b83e-7055-8ea9-92fc8fe46e05','UYKFQ',NULL,NULL,NULL,NULL,NULL,'delivered',NULL,NULL,NULL,NULL,NULL,'pickup','testecarapio3',NULL,NULL,0,'97988979873',4250,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-03 17:21:10','2026-05-06 17:18:13',NULL),('019deedc-cf77-712a-b1a8-63a29e229558','1VEU3',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'pickup','TESTEPDV4',NULL,NULL,0,NULL,12500,NULL,'2026-05-03 17:22:21',NULL,NULL,NULL,NULL,NULL,'2026-05-03 17:22:21','2026-05-06 17:18:13',NULL),('019deefb-a953-7375-ac3b-ac2c0b528c7a','PRRZ9',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'pickup','testepdv5',NULL,NULL,0,NULL,12500,NULL,'2026-05-03 17:56:03',NULL,NULL,NULL,NULL,NULL,'2026-05-03 17:56:03','2026-05-06 17:18:15',NULL),('019dfa6b-d236-71ab-93cc-d7d27cfd8032','C6FUD','019cfc64-b539-72a5-822d-49a962db53ab',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 1',NULL,NULL,0,NULL,7000,NULL,'2026-05-07 04:47:49',NULL,NULL,NULL,NULL,NULL,'2026-05-05 23:14:23','2026-05-07 04:47:49',NULL),('019dfe4e-4ef3-701d-bbba-0f29cb69104a','GCEX6','019cfc64-b539-72a5-822d-49a962db53ab',NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 1',NULL,NULL,0,NULL,8500,NULL,'2026-05-07 04:47:49',NULL,NULL,NULL,NULL,NULL,'2026-05-06 17:20:38','2026-05-07 04:47:49',NULL),('019dfe9a-2276-7266-87af-0087364e7b89','ALK2P','019cfc64-b539-72a5-822d-49a962db53ab',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 1',NULL,NULL,0,NULL,500,NULL,'2026-05-07 04:47:49',NULL,NULL,NULL,NULL,NULL,'2026-05-06 18:43:27','2026-05-07 04:47:49',NULL),('019dfe9a-708c-70c5-b202-e55e93da1445','5CYS6','019cfc64-b539-72a5-822d-49a962db53ab',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 1',NULL,NULL,0,NULL,12500,NULL,'2026-05-07 04:47:49',NULL,NULL,NULL,NULL,NULL,'2026-05-06 18:43:47','2026-05-07 04:47:49',NULL),('019dfea1-15e8-7329-ae7b-3bfd1bfaf088','YEY2Z','019cfc64-b544-7141-9f85-bc4ec25309d0',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 2',NULL,NULL,0,NULL,7000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-06 18:51:03','2026-05-06 18:54:10',NULL),('019dfea1-621a-7250-aa85-005df697425b','D5BVI','019cfc64-b544-7141-9f85-bc4ec25309d0',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 2',NULL,NULL,0,NULL,10500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-06 18:51:22','2026-05-06 18:54:11',NULL),('019e00cb-7ddc-727f-9713-222858958c1a','BF7LX','019cfc64-b544-7141-9f85-bc4ec25309d0',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 2',NULL,NULL,0,NULL,2000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-07 04:56:36','2026-05-11 04:43:53',NULL),('019e00d2-112b-70b7-bdcd-44eabc1cf3a4','AZWUH','019cfc64-b544-7141-9f85-bc4ec25309d0',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 2',NULL,NULL,0,NULL,12500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-07 05:03:47','2026-05-07 05:26:49',NULL),('019e0f8c-faa1-7044-a73d-b0e0fbcbba50','NW9HX','019cfc64-b539-72a5-822d-49a962db53ab',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered','1346640647','pix','approved','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b6152040000530398654045.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter13466406476304C6FA','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','dine_in','Mesa Mesa 1',NULL,NULL,0,NULL,13500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-10 01:42:37','2026-05-26 21:28:46',NULL),('019e137e-5521-7157-8325-ac032fb5f450','XETV9','019cfc64-b54c-7058-bc9a-f065d55e4324',NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 3',NULL,NULL,0,NULL,14500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-10 20:05:06','2026-05-11 04:44:03',NULL),('019e1479-d221-705e-8fc9-ea0dcea23fb2','REDRY','019cfc64-b556-72d5-acf8-f6a49fec2482',NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 4',NULL,NULL,0,NULL,16000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-11 00:39:48','2026-05-11 04:44:05',NULL),('019e1483-ba80-70cb-9e94-44881bea9872','CAOYF',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','delivered',NULL,NULL,NULL,NULL,NULL,'pickup','gabriel',NULL,NULL,0,NULL,15700,NULL,'2026-05-11 00:50:37',NULL,NULL,NULL,NULL,NULL,'2026-05-11 00:50:37','2026-05-11 04:44:08',NULL),('019e23d5-6045-7311-b236-a86c72cca505','ZXD67',NULL,NULL,'019d64b5-9428-71cb-b40e-139b85bc27e2',NULL,NULL,'awaiting_payment','1346559827','pix','approved','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406150.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter1346559827630454E5','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','delivery','JOAO','rfjreipfjiorefj','112',4500,'51997004458',15000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-14 00:14:06','2026-05-26 21:28:46',NULL),('019e23d7-b4bf-71b7-a0f0-0eb5907105b2','SUMFZ','019cfc64-b561-732c-8500-fceeec763493',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed','1346811599','pix','approved','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b6152040000530398654045.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter134681159963049678','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','dine_in','Mesa Mesa 5',NULL,NULL,0,NULL,14500,NULL,'2026-05-26 22:18:29',NULL,NULL,NULL,NULL,NULL,'2026-05-14 00:16:39','2026-05-26 22:18:29',NULL),('019e2c88-6f19-704a-bfbf-a7df2cd2214a','4C53F',NULL,NULL,NULL,NULL,NULL,'awaiting_payment','1346591721','pix','approved','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406105.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter13465917216304987B','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','pickup','claus',NULL,NULL,0,'51988584899',10500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-15 16:46:39','2026-05-26 21:28:46',NULL),('019e2c8c-0bcb-73a0-ab9c-eb4c12edd6ee','3LMHZ',NULL,NULL,'019d64b5-93f5-70d1-bc73-cf8cad4564e8',NULL,NULL,'delivered',NULL,NULL,NULL,NULL,NULL,'delivery','claus','edmeujdo','225',1800,'51988584899',9300,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-15 16:50:36','2026-05-15 16:52:38',NULL),('019e2e52-6730-7016-b8fb-9c4b94c00c1c','VVKXP',NULL,NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','ready',NULL,NULL,NULL,NULL,NULL,'pickup','fran',NULL,NULL,0,NULL,12500,NULL,'2026-05-16 01:06:51',NULL,NULL,NULL,NULL,NULL,'2026-05-16 01:06:52','2026-05-16 01:09:03',NULL),('019e2e5a-277d-7258-a24b-9cad1a2fdf0d','THJWX','019cfc64-b565-7114-9262-8455afb7e305',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','completed','1346811457','pix','approved','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b6152040000530398654041.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter13468114576304EAD8','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','dine_in','Mesa Mesa 6',NULL,NULL,0,NULL,10000,NULL,'2026-05-26 21:42:37',NULL,NULL,NULL,NULL,NULL,'2026-05-16 01:15:20','2026-05-26 21:42:37',NULL),('019e2ffe-efa9-7233-a95a-40e06edb5425','0U87D',NULL,NULL,'019d64b5-93f5-70d1-bc73-cf8cad4564e8',NULL,NULL,'preparing',NULL,NULL,NULL,NULL,NULL,'delivery','delivery dinheiro','dinherio','delivey',1800,'51889595858',12300,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-16 08:54:57','2026-07-08 16:21:52',NULL),('019e6b89-5974-713b-a206-e5915fee77d2','5Y4TX','019cfc64-b561-732c-8500-fceeec763493',NULL,NULL,'019cfc64-b224-73b2-ae5f-36f71ac48eb3','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','pending',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 5',NULL,NULL,0,NULL,12500,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-27 22:23:43','2026-05-27 22:23:43',NULL),('019e78f7-bd9e-702d-a0d2-06be2ad5ac69','L2VNG',NULL,NULL,'019d64b5-93f5-70d1-bc73-cf8cad4564e8',NULL,NULL,'awaiting_payment','1346867875','pix','pending','00020126580014br.gov.bcb.pix0136b76aa9c2-2ec4-4110-954e-ebfe34f05b615204000053039865406123.005802BR5916JOrsZDCJZeHczLMM6006Tosnes62230519mpqrinter134686787563040DFE','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','delivery','JOAO','rua edmindo','128',1800,'51997004458',12300,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-30 12:59:22','2026-05-30 12:59:25',NULL),('019f428b-4cdf-72fb-a2f0-c98b5ce8f5c9','P8WMI','019cfc64-b565-7114-9262-8455afb7e305',NULL,NULL,'019cfc64-b34b-73fc-b6bc-2e66753bb0ff','019cfc69-8d51-72bc-8053-2a4e9d4d4cb5','pending',NULL,NULL,NULL,NULL,NULL,'dine_in','Mesa Mesa 6',NULL,NULL,0,NULL,9300,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-08 16:24:13','2026-07-08 16:24:13',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
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
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'dinheiro',
  `amount` bigint NOT NULL,
  `gateway_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_order_id_foreign` (`order_id`),
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('019dee92-dc3f-732f-b029-31c8727b000b','019dee92-dbee-7158-8418-95c5d9df0eb1','dinheiro',12500,NULL,NULL,NULL,NULL,'2026-05-03 16:01:35','2026-05-03 16:01:35',NULL),('019deec1-b503-71a2-a680-a95c2d902aa6','019deec1-b4ee-719e-9789-4488c334bfc2','dinheiro',11500,NULL,NULL,NULL,NULL,'2026-05-03 16:52:45','2026-05-03 16:52:45',NULL),('019deedc-cf85-72f4-81d8-d3072d2a296d','019deedc-cf77-712a-b1a8-63a29e229558','dinheiro',12500,NULL,NULL,NULL,NULL,'2026-05-03 17:22:21','2026-05-03 17:22:21',NULL),('019deefb-a975-73d4-9256-1a66b795fc92','019deefb-a953-7375-ac3b-ac2c0b528c7a','dinheiro',12500,NULL,NULL,NULL,NULL,'2026-05-03 17:56:03','2026-05-03 17:56:03',NULL),('019e00c3-70a3-7280-bb59-80498943d355','019dfa6b-d236-71ab-93cc-d7d27cfd8032','debito',7000,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e00c3-713f-7080-834b-2b16af06dfdd','019dfe4e-4ef3-701d-bbba-0f29cb69104a','debito',3000,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e00c3-7142-72eb-b3f7-51b7dfa2534c','019dfe4e-4ef3-701d-bbba-0f29cb69104a','dinheiro',5000,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e00c3-7145-7196-a669-bea8bad33616','019dfe4e-4ef3-701d-bbba-0f29cb69104a','pix',500,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e00c3-7149-7340-9d31-31ab056ef550','019dfe9a-2276-7266-87af-0087364e7b89','pix',500,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e00c3-7151-7272-9cf2-17be391a88ee','019dfe9a-708c-70c5-b202-e55e93da1445','pix',12500,NULL,NULL,NULL,NULL,'2026-05-07 04:47:49','2026-05-07 04:47:49',NULL),('019e1483-ba96-7080-98f6-76b1f0867875','019e1483-ba80-70cb-9e94-44881bea9872','debito',15700,NULL,NULL,NULL,NULL,'2026-05-11 00:50:37','2026-05-11 00:50:37',NULL),('019e2e52-67eb-71ab-a350-81d3f760fe41','019e2e52-6730-7016-b8fb-9c4b94c00c1c','dinheiro',12500,NULL,NULL,NULL,NULL,'2026-05-16 01:06:53','2026-05-16 01:06:53',NULL),('019e663d-5ba4-737e-bf9e-7306875fff43','019e2e5a-277d-7258-a24b-9cad1a2fdf0d','credito',10000,NULL,NULL,NULL,NULL,'2026-05-26 21:42:37','2026-05-26 21:42:37',NULL),('019e663d-5be3-72cb-9b5c-7858d2e95ae0','019e2e5a-277d-7258-a24b-9cad1a2fdf0d','credito',480000,NULL,NULL,NULL,NULL,'2026-05-26 21:42:37','2026-05-26 21:42:37',NULL),('019e663d-5be4-73e3-9b47-617859596663','019e2e5a-277d-7258-a24b-9cad1a2fdf0d','debito',500000,NULL,NULL,NULL,NULL,'2026-05-26 21:42:37','2026-05-26 21:42:37',NULL),('019e663d-5be5-7232-b6d6-048b5cebb440','019e2e5a-277d-7258-a24b-9cad1a2fdf0d','pix',10000,NULL,NULL,NULL,NULL,'2026-05-26 21:42:37','2026-05-26 21:42:37',NULL),('019e665e-31da-71cd-97d7-416fd6465499','019e23d7-b4bf-71b7-a0f0-0eb5907105b2','pix',500,NULL,NULL,NULL,NULL,'2026-05-26 22:18:29','2026-05-26 22:18:29',NULL),('019e665e-31e2-72ef-8af1-1cc378e8d551','019e23d7-b4bf-71b7-a0f0-0eb5907105b2','credito',7000,NULL,NULL,NULL,NULL,'2026-05-26 22:18:29','2026-05-26 22:18:29',NULL),('019e665e-31e3-708f-9476-66c93c42c224','019e23d7-b4bf-71b7-a0f0-0eb5907105b2','debito',7000,NULL,NULL,NULL,NULL,'2026-05-26 22:18:29','2026-05-26 22:18:29',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','249c619a3eb52fff288479fa71c344d038f4516b522fd6d9848327aeee60e2a6','[\"*\"]',NULL,NULL,'2026-03-20 02:27:40','2026-03-20 02:27:40'),(2,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','5a61075fd860b05d951d923ea050fc8f5755026b4b192272bfcd7d68e32b7d45','[\"*\"]',NULL,NULL,'2026-03-20 02:27:56','2026-03-20 02:27:56'),(3,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','632d2fa5d45f733eea30637e58841d0cc8ae6d9425f98c90a3ce817c6a48054f','[\"*\"]',NULL,NULL,'2026-03-25 07:26:04','2026-03-25 07:26:04'),(4,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','a4b8669cbfb418dd872afe8827de4fb3c91848092060a3486694f003e4ee0307','[\"*\"]',NULL,NULL,'2026-03-25 07:26:25','2026-03-25 07:26:25'),(5,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','ba289d530d72671aa91391e22a08aebfa6e63c3f92b575318fa2b486ffb59fcf','[\"*\"]',NULL,NULL,'2026-03-25 07:26:37','2026-03-25 07:26:37'),(6,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','50e8f4f3b1807e772ade61cb84a5646d180d9daf153ca60987142e5b2ae6b656','[\"*\"]',NULL,NULL,'2026-03-25 07:27:00','2026-03-25 07:27:00'),(7,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','1f7280ac4d9775a3431184d9f1172b19c87c4424606c0aed64e2e1607e474f32','[\"*\"]',NULL,NULL,'2026-03-25 07:27:25','2026-03-25 07:27:25'),(8,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','58a3b2a38ddd7ce0fd307fcfcec298c30f52430edc6f23e927c1bffafb1e80ea','[\"*\"]',NULL,NULL,'2026-03-25 07:27:28','2026-03-25 07:27:28'),(9,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','383eaf78739970422107be9162999f6d803412194314bcbc46fe32d7a7228d8f','[\"*\"]','2026-04-03 01:08:45',NULL,'2026-04-03 01:03:45','2026-04-03 01:08:45'),(10,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','b8e345e822ae46a85c0c0b3b04594863a8f25119102874bb77dcfabde9a4aca8','[\"*\"]','2026-04-03 01:11:29',NULL,'2026-04-03 01:10:58','2026-04-03 01:11:29'),(11,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','cba4323fb531473429ee6d59b946df09afd89bc2f6a82323bc4b86385fe54c13','[\"*\"]','2026-04-03 01:18:36',NULL,'2026-04-03 01:16:05','2026-04-03 01:18:36'),(12,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','4e63d4573e38b0b04f004956a9cd0091056e41f4f4ecc3799e5dc02b3cc2cd70','[\"*\"]','2026-04-03 03:03:42',NULL,'2026-04-03 01:27:12','2026-04-03 03:03:42'),(13,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','ba48707f9a4235bf9e5fdf84d9db50f55412020a9e44caec599436ac88d997cc','[\"*\"]','2026-04-26 19:41:35',NULL,'2026-04-26 19:01:17','2026-04-26 19:41:35'),(14,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','fe06969ec81dd557c46627590bdfe76daf2886c16b20fddd284b8212763b18b5','[\"*\"]','2026-04-26 20:34:23',NULL,'2026-04-26 20:31:51','2026-04-26 20:34:23'),(15,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','26e1acb3475a1b246c10fe8752cab99faf27cb5a015f42c674a47200078f32ed','[\"*\"]','2026-04-29 21:46:19',NULL,'2026-04-29 21:27:49','2026-04-29 21:46:19'),(16,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','6afe8d445fc10085c6deb5654e310f51f5d4bed196c3d4e555c7736c760aeb4f','[\"*\"]','2026-04-30 00:23:03',NULL,'2026-04-30 00:14:50','2026-04-30 00:23:03'),(17,'App\\Models\\User','019cfc64-b224-73b2-ae5f-36f71ac48eb3','mobile','ca8146aed65118ad5e78f896578d4e84297c7600f8ed5eb2eea6ddce877634d1','[\"*\"]','2026-05-02 17:57:29',NULL,'2026-05-02 17:45:58','2026-05-02 17:57:29');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pizza_flavors`
--

DROP TABLE IF EXISTS `pizza_flavors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pizza_flavors` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ingredients` text COLLATE utf8mb4_unicode_ci,
  `ingredients_json` json DEFAULT NULL,
  `flavor_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_price` bigint NOT NULL,
  `show_on_digital_menu` tinyint(1) NOT NULL DEFAULT '1',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_active_delivery` tinyint(1) NOT NULL DEFAULT '1',
  `is_active_pos` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pizza_flavors`
--

LOCK TABLES `pizza_flavors` WRITE;
/*!40000 ALTER TABLE `pizza_flavors` DISABLE KEYS */;
INSERT INTO `pizza_flavors` VALUES ('019cfc64-b394-707a-baf7-5a6916e47ad2','Mussarela','Mussarela e orégano','Mussarela e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Mussarela\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7000,1,NULL,1,1,1,'2026-03-17 15:23:03','2026-05-13 23:49:03'),('019cfc64-b3a9-7018-b7e8-51f84ec6cd47','Bacon','Bacon e orégano','Bacon e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Bacon\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:03','2026-05-13 23:49:03'),('019cfc64-b3c3-7006-aae4-c0a39635587b','Calabresa','Calabresa e orégano (cebola opcional)','Calabresa e orégano (cebola opcional)','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Calabresa\", \"is_available\": true}, {\"name\": \"orégano (cebola opcional)\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3ca-7371-8ba5-4712fa95bfa6','Vegetariana','Palmito, milho, ervilha e orégano','Palmito, milho, ervilha e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Palmito\", \"is_available\": true}, {\"name\": \"milho\", \"is_available\": true}, {\"name\": \"ervilha\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3cd-72e2-9999-b400dd09405e','Palmito','Palmito e orégano','Palmito e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Palmito\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3d1-7023-8a4f-4680f3032755','Alho','Alho no azeite de oliva e orégano','Alho no azeite de oliva e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": \"1\"}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": \"1\"}, {\"name\": \"Alho no azeite de oliva\", \"is_available\": \"1\"}, {\"name\": \"orégano\", \"is_available\": \"1\"}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-30 12:47:52'),('019cfc64-b3d7-72bf-8085-ed712457a810','Marguerita','Tomate e manjericão','Tomate e manjericão','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Tomate\", \"is_available\": true}, {\"name\": \"manjericão\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3dc-7294-b3fd-fb6cc31310a3','Milho','Milho e orégano','Milho e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Milho\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3e1-7078-9997-4900eefdb1ee','Napolitana','Tomate, presunto, parmesão e orégano','Tomate, presunto, parmesão e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Tomate\", \"is_available\": true}, {\"name\": \"presunto\", \"is_available\": true}, {\"name\": \"parmesão\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3ea-72cc-96f3-ab8da3380f17','Portuguesa','Presunto, ovos, azeitona verde, pimentões coloridos e orégano','Presunto, ovos, azeitona verde, pimentões coloridos e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Presunto\", \"is_available\": true}, {\"name\": \"ovos\", \"is_available\": true}, {\"name\": \"azeitona verde\", \"is_available\": true}, {\"name\": \"pimentões coloridos\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3f2-7160-adc0-1b6aaee89b50','Atum','Atum e orégano (cebola opcional)','Atum e orégano (cebola opcional)','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Atum\", \"is_available\": true}, {\"name\": \"orégano (cebola opcional)\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b3fb-73f7-8a93-72a751dec214','Champignon','Champignon puxado na manteiga e orégano','Champignon puxado na manteiga e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Champignon puxado na manteiga\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b403-72c2-a3ec-da0fa88047e9','Lombo','Lombo canadense e orégano','Lombo canadense e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Lombo canadense\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b407-7100-915b-3142946ee13a','Quatro Queijos','Provolone, gorgonzola, catupiry e orégano','Provolone, gorgonzola, catupiry e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Provolone\", \"is_available\": true}, {\"name\": \"gorgonzola\", \"is_available\": true}, {\"name\": \"catupiry\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b40c-71f8-888a-4bd86e170885','Cinco Queijos','Provolone, gorgonzola, catupiry, cheddar e orégano','Provolone, gorgonzola, catupiry, cheddar e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Provolone\", \"is_available\": true}, {\"name\": \"gorgonzola\", \"is_available\": true}, {\"name\": \"catupiry\", \"is_available\": true}, {\"name\": \"cheddar\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b410-711c-829e-b22b47f14a03','Quatro Queijos com Bacon','Provolone, gorgonzola, catupiry, bacon e orégano','Provolone, gorgonzola, catupiry, bacon e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Provolone\", \"is_available\": true}, {\"name\": \"gorgonzola\", \"is_available\": true}, {\"name\": \"catupiry\", \"is_available\": true}, {\"name\": \"bacon\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b413-710a-8431-847991c3dac2','Salame','Salame italiano, pimentões coloridos e orégano','Salame italiano, pimentões coloridos e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Salame italiano\", \"is_available\": true}, {\"name\": \"pimentões coloridos\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b417-7063-a6d1-538b847bbe23','Tomate Seco','Tomate seco, orégano e rúcula','Tomate seco, orégano e rúcula','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Tomate seco\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}, {\"name\": \"rúcula\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b41c-7165-9412-4845900950a8','Toscana','Calabresa ralada, ovos, azeitona verde, pimentões coloridos e orégano','Calabresa ralada, ovos, azeitona verde, pimentões coloridos e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Calabresa ralada\", \"is_available\": true}, {\"name\": \"ovos\", \"is_available\": true}, {\"name\": \"azeitona verde\", \"is_available\": true}, {\"name\": \"pimentões coloridos\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b423-7090-b301-861a5a726fc9','Brócolis','Brócolis puxado na manteiga e orégano','Brócolis puxado na manteiga e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Brócolis puxado na manteiga\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b42a-7001-84bb-d20f72a153bd','Frango com Catupiry','Frango ralado, catupiry e orégano','Frango ralado, catupiry e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Frango ralado\", \"is_available\": true}, {\"name\": \"catupiry\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b430-717c-9fec-3cbd1dbbbb96','Frango Especial','Frango ralado, bacon, milho, catupiry e orégano','Frango ralado, bacon, milho, catupiry e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Frango ralado\", \"is_available\": true}, {\"name\": \"bacon\", \"is_available\": true}, {\"name\": \"milho\", \"is_available\": true}, {\"name\": \"catupiry\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b43a-7047-8e4e-5d9221948740','Putanesca','Atum, alcaparras, azeitona verde, azeitona preta e orégano','Atum, alcaparras, azeitona verde, azeitona preta e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Atum\", \"is_available\": true}, {\"name\": \"alcaparras\", \"is_available\": true}, {\"name\": \"azeitona verde\", \"is_available\": true}, {\"name\": \"azeitona preta\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b444-708e-b041-cf99b11b0529','Strogonoff de Carne','Strogonoff de carne e orégano','Strogonoff de carne e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Strogonoff de carne\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b449-7249-88cf-5c2e056c36ed','Strogonoff de Frango','Strogonoff de frango e orégano','Strogonoff de frango e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Strogonoff de frango\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b44d-701a-8b42-7373707b33b5','Lombo com Abacaxi','Lombo canadense, abacaxi e orégano','Lombo canadense, abacaxi e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Lombo canadense\", \"is_available\": true}, {\"name\": \"abacaxi\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',8500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b452-7088-9469-6fa3c7b1be2b','Coração','Coração com especiarias e orégano','Coração com especiarias e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Coração com especiarias\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b455-7043-aaca-a8e56db0a8d8','Pepperoni','Pepperoni e orégano','Pepperoni e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Pepperoni\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b459-7250-a851-174fe2af9142','Siciliana','Bacon, tomate, champignon, cebola caramelizada e orégano','Bacon, tomate, champignon, cebola caramelizada e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Bacon\", \"is_available\": true}, {\"name\": \"tomate\", \"is_available\": true}, {\"name\": \"champignon\", \"is_available\": true}, {\"name\": \"cebola caramelizada\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b45d-70bc-bf50-0e080e8b908f','Filé','Filé puxado na manteiga e orégano','Filé puxado na manteiga e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Filé puxado na manteiga\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b462-714f-84e0-a6d36155a7c5','Filé com Gorgonzola','Filé puxado na manteiga, gorgonzola e orégano','Filé puxado na manteiga, gorgonzola e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Filé puxado na manteiga\", \"is_available\": true}, {\"name\": \"gorgonzola\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b469-7382-bebb-261e45979b7f','Filé com Cebola','Filé puxado na manteiga, cebola caramelizado e orégano','Filé puxado na manteiga, cebola caramelizado e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Filé puxado na manteiga\", \"is_available\": true}, {\"name\": \"cebola caramelizado\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b478-73d7-b8ea-194a530287bf','Filé com Alho','Filé puxado na manteiga, alho e orégano','Filé puxado na manteiga, alho e orégano','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Filé puxado na manteiga\", \"is_available\": true}, {\"name\": \"alho\", \"is_available\": true}, {\"name\": \"orégano\", \"is_available\": true}]','salgada',9500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b481-72bb-856a-97ee53ca5f52','Siri','Siri com especiarias e manjericão','Siri com especiarias e manjericão','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Siri com especiarias\", \"is_available\": true}, {\"name\": \"manjericão\", \"is_available\": true}]','salgada',10000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:03'),('019cfc64-b489-7161-b7a3-ee4a2db6599e','Camarão','Camarão com especiarias e manjericão','Camarão com especiarias e manjericão','[{\"name\": \"Molho artesanal\", \"is_available\": true}, {\"name\": \"Queijo mussarela ralado\", \"is_available\": true}, {\"name\": \"Camarão com especiarias\", \"is_available\": true}, {\"name\": \"manjericão\", \"is_available\": true}]','salgada',10000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b48e-721e-92a1-e24727fa2048','Camarão ao 4 Queijos','Provolone, gorgonzola, catupiry, camarão com especiarias e manjericão','Provolone, gorgonzola, catupiry, camarão com especiarias e manjericão','[{\"name\": \"Molho Artesanal\", \"is_available\": \"1\"}, {\"name\": \"mussarela\", \"is_available\": \"1\"}, {\"name\": \"Provoloni\", \"is_available\": \"1\"}, {\"name\": \"Gorgonzola\", \"is_available\": \"1\"}, {\"name\": \"Catupiry\", \"is_available\": \"1\"}, {\"name\": \"Camarão com Especiarias\", \"is_available\": \"1\"}, {\"name\": \"Manjericão\", \"is_available\": \"1\"}]','salgada',10500,1,'flavors/tUPTjHINPUEMmUkaUl9I2OMuzlY7xoOpWZSmkhb8.jpg',1,1,1,'2026-03-17 15:23:04','2026-07-08 16:26:35'),('019cfc64-b492-71f9-a13b-f50de9e0bd82','Chocolate Preto','Chocolate preto','Chocolate preto','[{\"name\": \"Chocolate preto\", \"is_available\": true}]','doce',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-10 18:34:20'),('019cfc64-b497-72ca-8137-58310586eec5','Chocolate Branco','Chocolate branco','Chocolate branco','[{\"name\": \"Chocolate branco\", \"is_available\": true}]','doce',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-10 18:34:20'),('019cfc64-b49b-7039-9bdc-f419399f38cf','Chocolate Preto e Branco','Chocolate preto e chocolate branco','Chocolate preto e chocolate branco','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"chocolate branco\", \"is_available\": true}]','doce',7500,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4a0-70e4-9269-74083b3db7f0','Chocolate Preto com Morango','Chocolate preto e morango','Chocolate preto e morango','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"morango\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4a5-7010-aa87-9e71a0a66498','Chocolate Branco com Morango','Chocolate branco e morango','Chocolate branco e morango','[{\"name\": \"Chocolate branco\", \"is_available\": true}, {\"name\": \"morango\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4ab-7195-b237-6f2c1447fcf1','Chocolate Preto com Paçoca','Chocolate preto e paçoca','Chocolate preto e paçoca','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"paçoca\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4b1-708b-b1d7-86e2d669948a','Chocolate Branco com Paçoca','Chocolate branco e paçoca','Chocolate branco e paçoca','[{\"name\": \"Chocolate branco\", \"is_available\": true}, {\"name\": \"paçoca\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4b9-71f8-906e-6695bf954be6','Chocolate Preto com Confete','Chocolate preto e confete colorido','Chocolate preto e confete colorido','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"confete colorido\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4c1-7393-840b-e123e13487dd','Chocolate Branco com Confete','Chocolate branco e confete colorido','Chocolate branco e confete colorido','[{\"name\": \"Chocolate branco\", \"is_available\": true}, {\"name\": \"confete colorido\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4cc-70a3-bc5c-60d8fbb9ee59','Floresta Negra','Chocolate preto, chocolate branco e cereja','Chocolate preto, chocolate branco e cereja','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"chocolate branco\", \"is_available\": true}, {\"name\": \"cereja\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4d1-7102-8a79-2b07c661c5a0','Banana com Doce de Leite','Banana, doce de leite, mussarela e canela','Banana, doce de leite, mussarela e canela','[{\"name\": \"Banana\", \"is_available\": true}, {\"name\": \"doce de leite\", \"is_available\": true}, {\"name\": \"mussarela\", \"is_available\": true}, {\"name\": \"canela\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4d5-72b0-8194-c22141bc8a59','Chocolate Preto com Abacaxi','Chocolate preto e abacaxi','Chocolate preto e abacaxi','[{\"name\": \"Chocolate preto\", \"is_available\": true}, {\"name\": \"abacaxi\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-13 23:49:04'),('019cfc64-b4da-719e-b67a-b5e47db39058','Chocolate Branco com Abacaxi','Chocolate branco com abacaxi','Chocolate branco com abacaxi','[{\"name\": \"Chocolate branco com abacaxi\", \"is_available\": true}]','doce',8000,1,NULL,1,1,1,'2026-03-17 15:23:04','2026-05-10 18:34:20');
/*!40000 ALTER TABLE `pizza_flavors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pizza_sizes`
--

DROP TABLE IF EXISTS `pizza_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pizza_sizes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slices` int NOT NULL,
  `max_flavors` int NOT NULL,
  `is_special_broto_rule` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pizza_sizes`
--

LOCK TABLES `pizza_sizes` WRITE;
/*!40000 ALTER TABLE `pizza_sizes` DISABLE KEYS */;
INSERT INTO `pizza_sizes` VALUES ('019cfc64-b353-7151-93a0-a0e981397a18','Broto',6,1,1,'2026-03-17 15:23:03','2026-03-17 15:23:03'),('019cfc64-b37c-7172-a416-46ef031aabaf','Grande',12,3,0,'2026-03-17 15:23:03','2026-03-17 15:23:03');
/*!40000 ALTER TABLE `pizza_sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `print_metrics`
--

DROP TABLE IF EXISTS `print_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `print_metrics` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric_date` date NOT NULL,
  `tenant_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_attempts` int unsigned NOT NULL DEFAULT '0',
  `success_count` int unsigned NOT NULL DEFAULT '0',
  `failure_count` int unsigned NOT NULL DEFAULT '0',
  `network_failure_count` int unsigned NOT NULL DEFAULT '0',
  `hardware_failure_count` int unsigned NOT NULL DEFAULT '0',
  `last_error` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `print_metrics_unique_daily_tenant_printer` (`metric_date`,`tenant_key`,`printer_type`),
  KEY `print_metrics_tenant_date_idx` (`tenant_key`,`metric_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `print_metrics`
--

LOCK TABLES `print_metrics` WRITE;
/*!40000 ALTER TABLE `print_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `print_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printer_alerts`
--

DROP TABLE IF EXISTS `printer_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `printer_alerts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `printer_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `printer_alerts_order_id_foreign` (`order_id`),
  KEY `printer_alerts_tenant_resolved_idx` (`tenant_key`,`resolved_at`),
  KEY `printer_alerts_printer_created_idx` (`printer_type`,`created_at`),
  CONSTRAINT `printer_alerts_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printer_alerts`
--

LOCK TABLES `printer_alerts` WRITE;
/*!40000 ALTER TABLE `printer_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `printer_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printer_settings`
--

DROP TABLE IF EXISTS `printer_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `printer_settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `printer_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printer_settings`
--

LOCK TABLES `printer_settings` WRITE;
/*!40000 ALTER TABLE `printer_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `printer_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printers`
--

DROP TABLE IF EXISTS `printers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `printers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'receipt',
  `target` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash_register',
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printers`
--

LOCK TABLES `printers` WRITE;
/*!40000 ALTER TABLE `printers` DISABLE KEYS */;
/*!40000 ALTER TABLE `printers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` bigint NOT NULL,
  `cost_price` int NOT NULL DEFAULT '0',
  `is_active_delivery` tinyint(1) NOT NULL DEFAULT '1',
  `is_active_pos` tinyint(1) NOT NULL DEFAULT '1',
  `variations` json DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `show_on_digital_menu` tinyint(1) NOT NULL DEFAULT '1',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('019cfc64-b4e0-70bd-b903-b1db0a782431','Borda Recheada - Cheddar',NULL,2000,0,1,1,NULL,'Extras',1,NULL,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b4e8-70b5-b310-2ea09657763c','Borda Recheada - Catupiry',NULL,2000,0,1,1,NULL,'Extras',1,NULL,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b4ec-72f0-b19e-21b64716ef15','Borda Recheada - Chocolate com Avelã',NULL,2000,0,1,1,NULL,'Extras',1,NULL,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b4f2-738b-a14d-e420462ef467','Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)',NULL,7000,0,1,1,NULL,'Promoções',1,NULL,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b523-7267-a67b-59bd84f205e4','Cerveja Lata',NULL,1000,0,0,0,NULL,'Bebidas',1,NULL,'2026-03-17 15:23:04','2026-05-10 19:58:50'),('019cfc64-b529-73bd-8173-01355df236cb','Cerveja 600ml',NULL,2000,0,0,0,NULL,'Bebidas',1,NULL,'2026-03-17 15:23:04','2026-05-10 19:58:44'),('019cfc64-b52e-7155-b00b-b0dd1f7c2611','Cerveja Long Neck',NULL,1500,0,0,0,NULL,'Bebidas',1,NULL,'2026-03-17 15:23:04','2026-05-10 19:59:55'),('019cfc64-b533-7198-86fe-91d1f34a88c5','Cerveja Artesanal',NULL,2000,0,0,0,NULL,'Bebidas',1,NULL,'2026-03-17 15:23:04','2026-05-10 19:58:47'),('019e136f-794d-72f9-a02f-ccf0f2ddb27f','Água Mineral',NULL,500,0,1,1,'[{\"name\": \"Com Gás\", \"price\": 500}, {\"name\": \"Sem Gás\", \"price\": 500}]','Bebidas',1,NULL,'2026-05-10 19:48:53','2026-05-30 11:09:06'),('170ba14e-ad32-4356-ac7d-0aca2f812b95','Suco',NULL,800,0,0,1,'[{\"name\": \"Suco de uva integral (copo)\", \"price\": 800}, {\"name\": \"Del Valle Pêssego Caixinha\", \"price\": 400}, {\"name\": \"Del Valle Laranja Caixinha\", \"price\": 400}]','Bebidas',1,NULL,'2026-05-10 19:30:16','2026-07-08 16:26:13'),('3888e732-746f-463f-8e80-cfc4c6b8b125','Refrigerante 600ml',NULL,800,0,1,1,'[{\"name\": \"coca cola\", \"price\": 800}, {\"name\": \"coca cola (zero)\", \"price\": 800}]','Bebidas',1,NULL,'2026-05-10 19:30:16','2026-05-17 05:31:19'),('b5483542-9854-46f1-a920-6cb3fcbc39fb','Cerveja Latão',NULL,1500,0,1,1,'[{\"name\": \"Amestel\", \"price\": 1500}, {\"name\": \"eisenbahn pilsen\", \"price\": 1500}, {\"name\": \"heineken\", \"price\": 1500}, {\"name\": \"estrela galicia\", \"price\": 1500}, {\"name\": \"therezópolis gold\", \"price\": 1500}]','Bebidas',1,NULL,'2026-05-10 19:30:16','2026-05-30 12:47:44'),('da33a7e0-413f-41fd-b38a-d0b4022f4df2','Refrigerante Lata',NULL,600,0,1,1,'[{\"name\": \"Coca cola\", \"price\": 600}, {\"name\": \"Coca cola (zero)\", \"price\": 600}, {\"name\": \"Fanta Guarana\", \"price\": 600}, {\"name\": \"Fanta guarana (zero)\", \"price\": 600}, {\"name\": \"Fanta laranja\", \"price\": 600}, {\"name\": \"Fanta uva\", \"price\": 600}, {\"name\": \"schweppes citrus\", \"price\": 600}, {\"name\": \"schweppes citrus (zero)\", \"price\": 600}, {\"name\": \"schweppes tonica\", \"price\": 600}, {\"name\": \"schweppes tonica (zero)\", \"price\": 600}, {\"name\": \"Sprite\", \"price\": 600}, {\"name\": \"sprite (zero)\", \"price\": 600}]','Bebidas',1,NULL,'2026-05-10 19:30:16','2026-05-17 05:30:40'),('facaf379-b46d-4adb-8da7-7782f3dac7f2','Refrigerante 2 Litros',NULL,1500,0,1,1,'[{\"name\": \"coca cola\", \"price\": 1500}, {\"name\": \"coca cola (zero)\", \"price\": 1500}, {\"name\": \"sprite\", \"price\": 1500}, {\"name\": \"sprite (zero)\", \"price\": 1500}, {\"name\": \"Guarana sarandi\", \"price\": 1500}]','Bebidas',1,NULL,'2026-05-10 19:30:16','2026-05-17 05:31:41');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
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
INSERT INTO `sessions` VALUES ('BVCgIjMbDff1N3i2aguIOv3TQxOg3gr3cmw0Q3ra','019cfc64-b34b-73fc-b6bc-2e66753bb0ff','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiNzVhOEU4SUdpYTFvQWdRTVFVY29DZWtNalNsVUVteUZLYkVUYjhxQSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtzOjM2OiIwMTljZmM2NC1iMzRiLTczZmMtYjZiYy0yZTY2NzUzYmIwZmYiO30=',1783528055),('HPCKGDCQ705p0edzKZhbS8450c5st0FLCk0mDfGO','019cfc64-b224-73b2-ae5f-36f71ac48eb3','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','YTo2OntzOjY6Il90b2tlbiI7czo0MDoidXRJemJzd0hTZnNxMHA0VnFpU09zdlBPODRtZjdoNjBBTGtkRzNpTyI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjM4OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYXBpL2RpZ2l0YWwtbWVudSI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO3M6MzY6IjAxOWNmYzY0LWIyMjQtNzNiMi1hZTVmLTM2ZjcxYWM0OGViMyI7czoxMDoiYXBwX2xvY2FsZSI7czo1OiJwdC1CUiI7fQ==',1783528426);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_settings`
--

DROP TABLE IF EXISTS `store_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Lucchese Pizza',
  `cnpj` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '00.000.000/0001-00',
  `cover_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `story_media` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_open` tinyint(1) NOT NULL DEFAULT '1',
  `opening_hours` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `receipt_header_1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_header_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_footer` text COLLATE utf8mb4_unicode_ci,
  `receipt_show_cnpj` tinyint(1) NOT NULL DEFAULT '1',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_maps_embed_url` text COLLATE utf8mb4_unicode_ci,
  `google_maps_place_url` text COLLATE utf8mb4_unicode_ci,
  `payment_methods` json DEFAULT NULL,
  `custom_info` longtext COLLATE utf8mb4_unicode_ci,
  `mercadopago_access_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_phone_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_maps_api_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifood_merchant_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_settings`
--

LOCK TABLES `store_settings` WRITE;
/*!40000 ALTER TABLE `store_settings` DISABLE KEYS */;
INSERT INTO `store_settings` VALUES ('1','Pedido Feito','65.656.565/6565-65','branding/U5kMCMQht9o0vc4Ugx013lVbGg7wIqQROhqarDTe.jpg','branding/b2f9tgGzXccrVTATiLMQB8oLoWKMYtKJG2sYGTuP.png','[{\"url\": \"branding/0te3PqjUFyZ6KdeM1NuKDMTl2ROMzp5vVua4pRZK.mp4\", \"type\": \"video\"}, {\"url\": \"branding/yXo72Wr9o1Kzk0Z655BTLddf8BU4l889aSv6SgVR.jpg\", \"type\": \"image\"}]','Selecione o idioma para ter uma melhor experiencia na nossa pizzaria',1,'{\"friday\": {\"open\": \"19:00\", \"close\": \"23:30\", \"closed\": false}, \"monday\": {\"open\": \"18:00\", \"close\": \"23:30\", \"closed\": true}, \"sunday\": {\"open\": \"19:00\", \"close\": \"23:30\", \"closed\": false}, \"tuesday\": {\"open\": \"18:00\", \"close\": \"23:30\", \"closed\": true}, \"saturday\": {\"open\": \"19:00\", \"close\": \"23:30\", \"closed\": false}, \"thursday\": {\"open\": \"18:00\", \"close\": \"23:30\", \"closed\": true}, \"wednesday\": {\"open\": \"18:00\", \"close\": \"23:30\", \"closed\": true}}','2026-03-17 15:23:40','2026-05-18 16:19:54','Sr. & Sra.Lucchese','Pizzaria Goumert','Volte semore A Lucchese Pizzaria',1,'51981579562','Rua Sao Pedro, 517, praia da cal','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d869.4297654999847!2d-49.735795136741245!3d-29.34922810106418!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95226906eab1ac4b%3A0x6877ca4793053f2f!2sSr.%20%26%20Sra.%20Lucchese%20-%20Pizza%20Gourmet!5e0!3m2!1spt-BR!2sbr!4v1775624955075!5m2!1spt-BR!2sbr\" width=\"400\" height=\"300\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\" referrerpolicy=\"no-referrer-when-downgrade\">','https://maps.app.goo.gl/L84D9HKoQbmQypuY6','[\"Pix\", \"Dinheiro\", \"Cartão de Crédito\", \"Cartão de Débito\", \"pix\", \"credit_card\", \"debit_card\"]','Pizzas artesanais','TEST-4653515631140033-041720-2b3224d500ee87bb01ea0e6d3d3ab656-169869261',NULL,NULL,NULL);
/*!40000 ALTER TABLE `store_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL DEFAULT '4',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `position_x` int NOT NULL DEFAULT '0',
  `position_y` int NOT NULL DEFAULT '0',
  `width` int NOT NULL DEFAULT '100',
  `height` int NOT NULL DEFAULT '100',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES ('019cfc64-b539-72a5-822d-49a962db53ab','Mesa 1',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b544-7141-9f85-bc4ec25309d0','Mesa 2',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b54c-7058-bc9a-f065d55e4324','Mesa 3',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b556-72d5-acf8-f6a49fec2482','Mesa 4',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b561-732c-8500-fceeec763493','Mesa 5',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b565-7114-9262-8455afb7e305','Mesa 6',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b569-7233-8f00-66609d485a25','Mesa 7',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b56e-732a-9759-3cc196a7b210','Mesa 8',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b571-7271-ba79-6a81292893b8','Mesa 9',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04'),('019cfc64-b575-73f8-b8f9-1b33c64344d8','Mesa 10',4,'available',0,0,100,100,'2026-03-17 15:23:04','2026-03-17 15:23:04');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('019cfc64-b224-73b2-ae5f-36f71ac48eb3','Garçom Pedido Feito','waiter@pedidofeito.com','garcom','2026-03-17 15:23:03','$2y$12$np71GqGbnEXclZ9iTmR/NeK3EthlKCTJGS0QNntekow4p/p2CSKmq','eDZzy67xNjC0cWxolY9ZVkOt5h3sCpec9p3qQ1SlVC8yH4FnwibarKGvPPIu','2026-03-17 15:23:03','2026-03-17 15:33:41'),('019cfc64-b34b-73fc-b6bc-2e66753bb0ff','Admin','admin@pedidofeito.com','admin','2026-03-17 15:23:03','$2y$12$GDhWiCmHiXWyJk8AIK86iujTQbmNJHzoMXWVC4HzbI00S1YfHhI92','4MQzHemg2PklJmMO9uUC8pXjv5bYnxjysFuyhKqg4XjeH5vi4wyzeKuWshnj','2026-03-17 15:23:03','2026-03-17 15:23:03');
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

-- Dump completed on 2026-07-20  3:58:04
