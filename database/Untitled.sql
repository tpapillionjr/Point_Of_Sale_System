-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (x86_64)
--
-- Host: group4-pos-mysql.mysql.database.azure.com    Database: restaurant_pos
-- ------------------------------------------------------
-- Server version	8.0.44-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_rule`
--

DROP TABLE IF EXISTS `approval_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_rule` (
  `approval_rule_id` int NOT NULL AUTO_INCREMENT,
  `rule_key` varchar(60) NOT NULL,
  `label` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `threshold_type` enum('none','line_total','order_total','discount_amount') NOT NULL DEFAULT 'none',
  `threshold_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`approval_rule_id`),
  UNIQUE KEY `rule_key` (`rule_key`),
  CONSTRAINT `chk_approval_rule_display_order_positive` CHECK ((`display_order` >= 1)),
  CONSTRAINT `chk_approval_rule_key_nonblank` CHECK ((char_length(trim(`rule_key`)) > 0)),
  CONSTRAINT `chk_approval_rule_label_nonblank` CHECK ((char_length(trim(`label`)) > 0)),
  CONSTRAINT `chk_approval_rule_threshold_nonneg` CHECK ((`threshold_value` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `back_office_settings`
--

DROP TABLE IF EXISTS `back_office_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `back_office_settings` (
  `setting_key` varchar(120) NOT NULL,
  `setting_value` json NOT NULL,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`),
  KEY `fk_back_office_settings_user` (`updated_by`),
  CONSTRAINT `fk_back_office_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `customer_num_id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(10) NOT NULL,
  `points_balance` int NOT NULL DEFAULT '0',
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`customer_num_id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `chk_points_nonneg` CHECK ((`points_balance` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_reservation`
--

DROP TABLE IF EXISTS `customer_reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_reservation` (
  `reservation_id` int NOT NULL AUTO_INCREMENT,
  `customer_num_id` int NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `party_size` smallint NOT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `occasion` varchar(100) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `status` enum('requested','confirmed','seated','cancelled') NOT NULL DEFAULT 'requested',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reservation_id`),
  KEY `fk_customer_reservation_customer` (`customer_num_id`),
  CONSTRAINT `fk_customer_reservation_customer` FOREIGN KEY (`customer_num_id`) REFERENCES `customer` (`customer_num_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_reservation_party_size` CHECK ((`party_size` between 1 and 8)),
  CONSTRAINT `chk_reservation_phone_digits` CHECK (((`phone` is null) or regexp_like(`phone`,_utf8mb4'^[0-9]{10}$')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `device_defaults`
--

DROP TABLE IF EXISTS `device_defaults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_defaults` (
  `device_defaults_id` tinyint NOT NULL,
  `default_register_id` varchar(20) NOT NULL,
  `default_payment_method` enum('CASH','CREDIT','SPLIT') NOT NULL DEFAULT 'CREDIT',
  `online_order_source_table_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`device_defaults_id`),
  KEY `fk_device_defaults_online_order_table` (`online_order_source_table_id`),
  CONSTRAINT `fk_device_defaults_online_order_table` FOREIGN KEY (`online_order_source_table_id`) REFERENCES `dining_tables` (`table_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_device_register_id_nonblank` CHECK ((char_length(trim(`default_register_id`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dining_tables`
--

DROP TABLE IF EXISTS `dining_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dining_tables` (
  `table_id` int NOT NULL AUTO_INCREMENT,
  `table_number` smallint NOT NULL,
  `capacity` smallint DEFAULT NULL,
  `status` enum('available','occupied','reserved','inactive') NOT NULL DEFAULT 'available',
  PRIMARY KEY (`table_id`),
  UNIQUE KEY `table_number` (`table_number`)
) ENGINE=InnoDB AUTO_INCREMENT=10002 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_shift`
--

DROP TABLE IF EXISTS `employee_shift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_shift` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `scheduled_start` datetime NOT NULL,
  `scheduled_end` datetime NOT NULL,
  `clock_in` datetime DEFAULT NULL,
  `clock_out` datetime DEFAULT NULL,
  `tip_declared_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tip_declared_at` datetime DEFAULT NULL,
  PRIMARY KEY (`shift_id`),
  KEY `fk_shift_user` (`user_id`),
  CONSTRAINT `fk_shift_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_item_name` varchar(100) NOT NULL,
  `amount_available` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `availability_status` tinyint(1) NOT NULL DEFAULT '1',
  `reorder_threshold` int DEFAULT '10',
  PRIMARY KEY (`inventory_item_name`),
  KEY `fk_inventory_menu_item` (`menu_item_id`),
  CONSTRAINT `fk_inventory_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_inventory_amount_nonneg` CHECK ((`amount_available` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_inventory_low_stock_notify` AFTER UPDATE ON `inventory` FOR EACH ROW BEGIN
    IF NEW.amount_available <= 10
       AND OLD.amount_available > 10
       AND NEW.availability_status = TRUE THEN

        INSERT INTO Manager_Notification (
            user_id,
            inventory_item_name,
            title,
            message
        )
        SELECT
            u.user_id,
            NEW.inventory_item_name,
            'Low Inventory Alert',
            CONCAT(
                NEW.inventory_item_name,
                ' is low. Current amount available: ',
                NEW.amount_available
            )
        FROM Users u
        WHERE u.role = 'manager'
          AND u.is_active = TRUE;

    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `kitchen_ticket`
--

DROP TABLE IF EXISTS `kitchen_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kitchen_ticket` (
  `ticket_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `online_order_id` int DEFAULT NULL,
  `table_id` int NOT NULL,
  `status` enum('new','in_progress','done','canceled') NOT NULL DEFAULT 'new',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `fk_kitchen_table` (`table_id`),
  KEY `fk_kitchen_online_order` (`online_order_id`),
  KEY `fk_kitchen_order` (`order_id`),
  CONSTRAINT `fk_kitchen_online_order` FOREIGN KEY (`online_order_id`) REFERENCES `online_orders` (`online_order_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_kitchen_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_kitchen_table` FOREIGN KEY (`table_id`) REFERENCES `dining_tables` (`table_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_order_preparing` AFTER UPDATE ON `kitchen_ticket` FOR EACH ROW BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE Online_Orders
    SET customer_status = 'preparing'
    WHERE online_order_id = NEW.online_order_id
      AND customer_status = 'confirmed';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_order_ready` AFTER UPDATE ON `kitchen_ticket` FOR EACH ROW BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    UPDATE Online_Orders
    SET customer_status = 'ready'
    WHERE online_order_id = NEW.online_order_id
      AND customer_status = 'preparing';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `login_audit`
--

DROP TABLE IF EXISTS `login_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_audit` (
  `login_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `attempt_type` enum('success','failed') NOT NULL,
  `attempted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`login_id`),
  KEY `fk_login_audit_user` (`user_id`),
  CONSTRAINT `fk_login_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_increment_failed_login` BEFORE INSERT ON `login_audit` FOR EACH ROW BEGIN
    -- If this is a failed attempt, increment the counter
    IF NEW.attempt_type = 'failed' THEN
        UPDATE Users 
        SET failed_pin_attempts = failed_pin_attempts + 1
        WHERE user_id = NEW.user_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `loyalty_rewards`
--

DROP TABLE IF EXISTS `loyalty_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_rewards` (
  `reward_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `points_cost` int NOT NULL,
  `menu_item_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reward_id`),
  KEY `fk_reward_menu_item` (`menu_item_id`),
  CONSTRAINT `fk_reward_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_reward_name_nonblank` CHECK ((char_length(trim(`name`)) > 0)),
  CONSTRAINT `chk_reward_points_positive` CHECK ((`points_cost` >= 1))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loyalty_transactions`
--

DROP TABLE IF EXISTS `loyalty_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `customer_num_id` int NOT NULL,
  `online_order_id` int DEFAULT NULL,
  `type` enum('earned','redeemed') NOT NULL,
  `points` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `fk_loyalty_customer` (`customer_num_id`),
  KEY `fk_loyalty_online_order` (`online_order_id`),
  CONSTRAINT `fk_loyalty_customer` FOREIGN KEY (`customer_num_id`) REFERENCES `customer` (`customer_num_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_loyalty_online_order` FOREIGN KEY (`online_order_id`) REFERENCES `online_orders` (`online_order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_loyalty_points_positive` CHECK ((`points` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manager_notification`
--

DROP TABLE IF EXISTS `manager_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manager_notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `inventory_item_name` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `fk_manager_notification_user` (`user_id`),
  KEY `fk_manager_notification_inventory` (`inventory_item_name`),
  CONSTRAINT `fk_manager_notification_inventory` FOREIGN KEY (`inventory_item_name`) REFERENCES `inventory` (`inventory_item_name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_manager_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `menu_item`
--

DROP TABLE IF EXISTS `menu_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item` (
  `menu_item_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text,
  `photo_url` varchar(2048) DEFAULT NULL,
  `common_allergens` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`menu_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `menu_item_modifier`
--

DROP TABLE IF EXISTS `menu_item_modifier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_modifier` (
  `menu_item_id` int NOT NULL,
  `modifier_id` int NOT NULL,
  PRIMARY KEY (`menu_item_id`,`modifier_id`),
  KEY `fk_mim_modifier` (`modifier_id`),
  CONSTRAINT `fk_mim_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mim_modifier` FOREIGN KEY (`modifier_id`) REFERENCES `modifier` (`modifier_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `modifier`
--

DROP TABLE IF EXISTS `modifier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modifier` (
  `modifier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`modifier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `online_order_item`
--

DROP TABLE IF EXISTS `online_order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_order_item` (
  `online_order_item_id` int NOT NULL AUTO_INCREMENT,
  `online_order_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`online_order_item_id`),
  KEY `fk_online_order_item_order` (`online_order_id`),
  KEY `fk_online_order_item_menu` (`menu_item_id`),
  CONSTRAINT `fk_online_order_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_online_order_item_order` FOREIGN KEY (`online_order_id`) REFERENCES `online_orders` (`online_order_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_online_order_item_price` CHECK ((`price` >= 0)),
  CONSTRAINT `chk_online_order_item_qty` CHECK ((`quantity` >= 1))
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `online_orders`
--

DROP TABLE IF EXISTS `online_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_orders` (
  `online_order_id` int NOT NULL AUTO_INCREMENT,
  `customer_num_id` int DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `phone` varchar(10) NOT NULL,
  `order_note` varchar(255) DEFAULT NULL,
  `customer_status` enum('placed','confirmed','preparing','ready','picked_up','denied') NOT NULL DEFAULT 'placed',
  `payment_preference` enum('online','in_store') NOT NULL DEFAULT 'in_store',
  `payment_status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `void_reason` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`online_order_id`),
  KEY `fk_online_order_customer` (`customer_num_id`),
  CONSTRAINT `fk_online_order_customer` FOREIGN KEY (`customer_num_id`) REFERENCES `customer` (`customer_num_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_award_loyalty_points` AFTER UPDATE ON `online_orders` FOR EACH ROW BEGIN
    DECLARE v_points INT;

    IF OLD.payment_status = 'unpaid'
       AND NEW.payment_status = 'paid'
       AND NEW.customer_num_id IS NOT NULL
    THEN
        SET v_points = FLOOR(NEW.total) * 10;

        IF v_points > 0 THEN
            INSERT INTO Loyalty_Transactions (
                customer_num_id,
                online_order_id,
                type,
                points,
                description
            ) VALUES (
                NEW.customer_num_id,
                NEW.online_order_id,
                'earned',
                v_points,
                CONCAT('Points earned from online order #', NEW.online_order_id)
            );

            UPDATE Customer
            SET points_balance = points_balance + v_points
            WHERE customer_num_id = NEW.customer_num_id;
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_create_kitchen_ticket_on_online_confirm` AFTER UPDATE ON `online_orders` FOR EACH ROW BEGIN
    IF OLD.customer_status <> 'confirmed'
       AND NEW.customer_status = 'confirmed'
       AND NOT EXISTS (
           SELECT 1
           FROM Kitchen_Ticket kt
           WHERE kt.online_order_id = NEW.online_order_id
       )
    THEN
        INSERT INTO Kitchen_Ticket (
            order_id,
            online_order_id,
            table_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            NULL,
            NEW.online_order_id,
            1,
            'new',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_order_item_order` (`order_id`),
  KEY `fk_order_item_menu` (`menu_item_id`),
  CONSTRAINT `fk_order_item_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item` (`menu_item_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `table_id` int NOT NULL,
  `created_by` int NOT NULL,
  `sent_to_kitchen_at` datetime DEFAULT NULL,
  `receipt_number` varchar(30) DEFAULT NULL,
  `order_note` varchar(255) DEFAULT NULL,
  `order_type` enum('Dine_in','Takeout','Online') NOT NULL DEFAULT 'Dine_in',
  `guest_count` smallint NOT NULL DEFAULT '1',
  `is_split_check` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('Open','Sent','Completed','Paid','Void') NOT NULL DEFAULT 'Open',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_type` enum('None','Promo','Manager_comp','Employee_meal') NOT NULL DEFAULT 'None',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `void_reason` varchar(100) DEFAULT NULL,
  `voided_by` int DEFAULT NULL,
  `customer_num_id` int DEFAULT NULL,
  `customer_status` enum('placed','confirmed','preparing','ready') DEFAULT 'placed',
  `payment_preference` enum('online','in_store') NOT NULL DEFAULT 'in_store',
  `takeout_name` varchar(100) DEFAULT NULL,
  `takeout_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_voided_by` (`voided_by`),
  KEY `fk_orders_customer` (`customer_num_id`),
  KEY `fk_orders_table` (`table_id`),
  KEY `fk_orders_created_by` (`created_by`),
  CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_num_id`) REFERENCES `customer` (`customer_num_id`),
  CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) REFERENCES `dining_tables` (`table_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_guest_count` CHECK (((`guest_count` >= 1) and (`guest_count` <= 20))),
  CONSTRAINT `chk_orders_closed_time` CHECK (((`closed_at` is null) or (`closed_at` >= `created_at`))),
  CONSTRAINT `chk_orders_money_nonneg` CHECK (((`subtotal` >= 0) and (`tax` >= 0) and (`total` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `register_id` varchar(20) DEFAULT NULL,
  `served_by` int DEFAULT NULL,
  `payment_type` enum('cash','card') NOT NULL,
  `card_type` enum('visa','mastercard','amex','discover') DEFAULT NULL,
  `card_last4` char(4) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tip_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tendered_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `change_given` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('approved','declined','refunded') NOT NULL DEFAULT 'approved',
  `voided_at` datetime DEFAULT NULL,
  `refund_reason` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payment_order` (`order_id`),
  KEY `fk_payment_served_by` (`served_by`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_served_by` FOREIGN KEY (`served_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_amount_nonneg` CHECK ((`amount` >= 0)),
  CONSTRAINT `chk_change_nonneg` CHECK ((`change_given` >= 0)),
  CONSTRAINT `chk_payment_card_rules` CHECK ((((`payment_type` = _utf8mb4'cash') and (`card_type` is null) and (`card_last4` is null)) or ((`payment_type` = _utf8mb4'card') and (`card_type` is not null) and (`card_last4` is not null)))),
  CONSTRAINT `chk_tip_nonneg` CHECK ((`tip_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `receipt_settings`
--

DROP TABLE IF EXISTS `receipt_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_settings` (
  `receipt_settings_id` tinyint NOT NULL,
  `prefix` varchar(10) NOT NULL,
  `next_sequence` int NOT NULL DEFAULT '1',
  `padding_length` tinyint NOT NULL DEFAULT '4',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`receipt_settings_id`),
  CONSTRAINT `chk_receipt_next_sequence_positive` CHECK ((`next_sequence` >= 1)),
  CONSTRAINT `chk_receipt_padding_range` CHECK (((`padding_length` >= 2) and (`padding_length` <= 12))),
  CONSTRAINT `chk_receipt_prefix_nonblank` CHECK ((char_length(trim(`prefix`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings_audit_log`
--

DROP TABLE IF EXISTS `settings_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings_audit_log` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `setting_group` enum('tax','receipt','approval','device') NOT NULL,
  `setting_key` varchar(60) NOT NULL,
  `action` enum('create','update','toggle') NOT NULL DEFAULT 'update',
  `changed_by` int NOT NULL,
  `change_summary` varchar(255) NOT NULL,
  `previous_value` text,
  `new_value` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `fk_settings_audit_user` (`changed_by`),
  KEY `idx_settings_audit_created_at` (`created_at`),
  KEY `idx_settings_audit_group` (`setting_group`),
  CONSTRAINT `fk_settings_audit_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_settings_audit_summary_nonblank` CHECK ((char_length(trim(`change_summary`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` json NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tax_configuration`
--

DROP TABLE IF EXISTS `tax_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_configuration` (
  `tax_configuration_id` int NOT NULL AUTO_INCREMENT,
  `tax_name` varchar(80) NOT NULL,
  `rate_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `applies_to` enum('all','pos','online') NOT NULL DEFAULT 'all',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tax_configuration_id`),
  CONSTRAINT `chk_tax_display_order_positive` CHECK ((`display_order` >= 1)),
  CONSTRAINT `chk_tax_name_nonblank` CHECK ((char_length(trim(`tax_name`)) > 0)),
  CONSTRAINT `chk_tax_rate_range` CHECK (((`rate_percent` >= 0) and (`rate_percent` <= 100)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('employee','manager','kitchen') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `pin_code` char(4) NOT NULL,
  `failed_pin_attempts` tinyint NOT NULL DEFAULT '0',
  `is_pos_locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `pin_code` (`pin_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`posadmin`@`%`*/ /*!50003 TRIGGER `trg_lock_user_after_5_failures` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    -- Lock user if they reach 5 failed attempts
    IF NEW.failed_pin_attempts >= 5 AND OLD.failed_pin_attempts < 5 THEN
        UPDATE Users
        SET is_pos_locked = TRUE
        WHERE user_id = NEW.user_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `utensil_inventory`
--

DROP TABLE IF EXISTS `utensil_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utensil_inventory` (
  `utensil_id` int NOT NULL AUTO_INCREMENT,
  `utensil_name` varchar(100) NOT NULL,
  `amount_available` int NOT NULL,
  `reorder_threshold` int NOT NULL DEFAULT '10',
  `availability_status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`utensil_id`),
  UNIQUE KEY `utensil_name` (`utensil_name`),
  CONSTRAINT `chk_utensil_amount_nonneg` CHECK ((`amount_available` >= 0)),
  CONSTRAINT `chk_utensil_name_nonblank` CHECK ((char_length(trim(`utensil_name`)) > 0)),
  CONSTRAINT `chk_utensil_reorder_threshold_nonneg` CHECK ((`reorder_threshold` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'restaurant_pos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-13 16:34:11
