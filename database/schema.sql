
CREATE TABLE Dining_Tables (
    table_id INT AUTO_INCREMENT PRIMARY KEY,
    table_number SMALLINT NOT NULL UNIQUE,
    capacity SMALLINT NULL,
    status ENUM('available','occupied','reserved','inactive') NOT NULL DEFAULT 'available',
    CONSTRAINT chk_table_number_range CHECK (table_number >= 1 AND table_number <= 99),
    CONSTRAINT chk_table_capacity_range CHECK (capacity IS NULL OR (capacity >= 1 AND capacity <= 8))
);

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(250) NOT NULL UNIQUE,
    pin_code CHAR(4) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('employee','manager','kitchen') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_pin_attempts TINYINT NOT NULL DEFAULT 0,
    is_pos_locked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_user_name_nonblank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_user_email_format CHECK (email LIKE '%@%.__%'),
    CONSTRAINT chk_user_pin_digits CHECK (pin_code REGEXP '^[0-9]{4}$'),
    CONSTRAINT chk_failed_pin_attempts_range CHECK (failed_pin_attempts >= 0 AND failed_pin_attempts <= 5)
);

CREATE TABLE Menu_Item (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50) NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT NULL,
    photo_url VARCHAR(2048) NULL,
    common_allergens VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_menu_item_name_nonblank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_menu_item_price_nonneg CHECK (base_price >= 0)
);

CREATE TABLE Modifier (
    modifier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_modifier_name_nonblank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_modifier_price_nonneg CHECK (price >= 0)
);

CREATE TABLE Menu_Item_Modifier (
    menu_item_id INT NOT NULL,
    modifier_id INT NOT NULL,
    PRIMARY KEY (menu_item_id, modifier_id),
    CONSTRAINT fk_mim_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mim_modifier
        FOREIGN KEY (modifier_id) REFERENCES Modifier(modifier_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Inventory (
    inventory_item_name VARCHAR(100) PRIMARY KEY,
    amount_available INT NOT NULL,
    menu_item_id INT NOT NULL,
    availability_status BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_inventory_amount_nonneg CHECK (amount_available >= 0),
    CONSTRAINT chk_inventory_name_nonblank CHECK (CHAR_LENGTH(TRIM(inventory_item_name)) > 0),
    CONSTRAINT fk_inventory_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Utensil_Inventory (
    utensil_id INT AUTO_INCREMENT PRIMARY KEY,
    utensil_name VARCHAR(100) NOT NULL UNIQUE,
    amount_available INT NOT NULL,
    reorder_threshold INT NOT NULL DEFAULT 10,
    availability_status BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_utensil_name_nonblank CHECK (CHAR_LENGTH(TRIM(utensil_name)) > 0),
    CONSTRAINT chk_utensil_amount_nonneg CHECK (amount_available >= 0),
    CONSTRAINT chk_utensil_reorder_threshold_nonneg CHECK (reorder_threshold >= 0)
);

CREATE TABLE Customer (
    customer_num_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(250) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(10) NOT NULL UNIQUE,
    points_balance INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_customer_phone_digits CHECK (phone_number REGEXP '^[0-9]{10}$'),
    CONSTRAINT chk_points_nonneg CHECK (points_balance >= 0)
);

CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    created_by INT NOT NULL,
    sent_to_kitchen_at DATETIME NULL,

    receipt_number VARCHAR(30) UNIQUE,
    order_note VARCHAR(255),

    order_type ENUM('Dine_in', 'Takeout', 'Online') NOT NULL DEFAULT 'Dine_in',

    customer_num_id INT NULL,
    customer_status ENUM('placed','confirmed','preparing','ready') DEFAULT 'placed',

    guest_count SMALLINT NOT NULL DEFAULT 1,

    is_split_check BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM('Open', 'Sent', 'Completed', 'Paid', 'Void') NOT NULL DEFAULT 'Open',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,

    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('None','Promo','Manager_comp','Employee_meal') NOT NULL DEFAULT 'None',
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    takeout_name VARCHAR(100) NULL,
    takeout_phone VARCHAR(20) NULL,

    void_reason VARCHAR(100),
    voided_by INT NULL,

    -- domain checks:
    CONSTRAINT chk_orders_money_nonneg CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax >= 0 AND service_charge >= 0 AND total >= 0
    ),
    CONSTRAINT chk_orders_closed_time CHECK (closed_at IS NULL OR closed_at >= created_at),
    CONSTRAINT chk_orders_sent_time CHECK (sent_to_kitchen_at IS NULL OR sent_to_kitchen_at >= created_at),
    CONSTRAINT chk_guest_count CHECK (guest_count >= 1 AND guest_count <= 8),
    CONSTRAINT chk_order_totals_consistent CHECK (
        total = subtotal - discount_amount + tax + service_charge
    ),
    CONSTRAINT chk_order_void_rules CHECK (
        (status = 'Void' AND void_reason IS NOT NULL)
        OR
        (status <> 'Void' AND void_reason IS NULL)
    ),
    CONSTRAINT chk_order_void_user_rules CHECK (
        (status = 'Void' AND voided_by IS NOT NULL)
        OR
        (status <> 'Void' AND voided_by IS NULL)
    ),

    -- FKs
    CONSTRAINT fk_orders_table
        FOREIGN KEY (table_id) REFERENCES Dining_Tables(table_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_created_by
        FOREIGN KEY (created_by) REFERENCES Users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_orders_voided_by
        FOREIGN KEY (voided_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL, -- allow multiple payments per order for split payments
    register_id VARCHAR(20),

    served_by INT NULL, -- employee who processed payment

    payment_type ENUM('cash', 'card') NOT NULL,
    card_type ENUM('visa', 'mastercard', 'amex', 'discover') NULL,
    card_last4 CHAR(4) NULL,

    amount DECIMAL(10,2) NOT NULL,
    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tendered_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    change_given DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    status ENUM('approved', 'declined', 'refunded') NOT NULL DEFAULT 'approved',
    voided_at DATETIME NULL,
    refund_reason VARCHAR(100),

    -- domain checks
    CONSTRAINT chk_amount_nonneg CHECK (amount >= 0),
    CONSTRAINT chk_tip_nonneg CHECK (tip_amount >= 0),
    CONSTRAINT chk_tendered_nonneg CHECK (tendered_amount >= 0),
    CONSTRAINT chk_change_nonneg CHECK (change_given >= 0),
    CONSTRAINT chk_card_last4_digits CHECK (card_last4 IS NULL OR card_last4 REGEXP '^[0-9]{4}$'),
    CONSTRAINT chk_voided_time CHECK (voided_at IS NULL OR voided_at >= paid_at),

    CONSTRAINT chk_payment_card_rules CHECK (
        (payment_type = 'cash' AND card_type IS NULL AND card_last4 IS NULL)
        OR
        (payment_type = 'card' AND card_type IS NOT NULL AND card_last4 IS NOT NULL)
    ),
    CONSTRAINT chk_payment_cash_rules CHECK (
        payment_type <> 'cash'
        OR
        (tendered_amount >= amount + tip_amount AND change_given = tendered_amount - amount - tip_amount)
    ),
    CONSTRAINT chk_payment_card_amount_rules CHECK (
        payment_type <> 'card'
        OR
        (tendered_amount = 0 AND change_given = 0)
    ),
    CONSTRAINT chk_refund_reason_rules CHECK (
        (status = 'refunded' AND refund_reason IS NOT NULL)
        OR
        (status <> 'refunded' AND refund_reason IS NULL)
    ),

    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_payment_served_by
        FOREIGN KEY (served_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Online_Orders (
    online_order_id INT AUTO_INCREMENT PRIMARY KEY,

    -- Customer info (guest or logged-in)
    customer_num_id INT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(250) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    order_note VARCHAR(255) NULL,

    -- Status tracking
    customer_status ENUM('placed','confirmed','preparing','ready','picked_up','denied') NOT NULL DEFAULT 'placed',
    payment_preference ENUM('online','in_store') NOT NULL DEFAULT 'in_store',
    payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',

    -- Financials
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_online_order_customer
        FOREIGN KEY (customer_num_id) REFERENCES Customer(customer_num_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Online_Order_Item (
    online_order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    online_order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_online_order_item_qty CHECK (quantity >= 1),
    CONSTRAINT chk_online_order_item_price CHECK (price >= 0),
    CONSTRAINT fk_online_order_item_order
        FOREIGN KEY (online_order_id) REFERENCES Online_Orders(online_order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_online_order_item_menu
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE RESTRICT
);

CREATE TABLE Kitchen_Ticket (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    online_order_id INT NULL,
    table_id INT NOT NULL,
    status ENUM('new','in_progress','done','canceled') NOT NULL DEFAULT 'new',
    completed_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    CONSTRAINT chk_kitchen_ticket_updated_time CHECK (updated_at IS NULL OR updated_at >= created_at),

    CONSTRAINT fk_kitchen_order
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_kitchen_online_order
        FOREIGN KEY (online_order_id) REFERENCES Online_Orders(online_order_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_kitchen_table
        FOREIGN KEY (table_id) REFERENCES Dining_Tables(table_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_kitchen_completed_by
        FOREIGN KEY (completed_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Order_Item (  --needed to calculate sales by item and most popular menu items
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_order_item_quantity_positive CHECK (quantity >= 1),
    CONSTRAINT chk_order_item_price_nonneg CHECK (price >= 0),
    
    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_order_item_menu
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE RESTRICT
);

CREATE TABLE Login_Audit (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attempt_type ENUM('success', 'failed') NOT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    
    CONSTRAINT fk_login_audit_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

DELIMITER $$

CREATE TRIGGER trg_increment_failed_login
BEFORE INSERT ON Login_Audit
FOR EACH ROW
BEGIN
    -- If this is a failed attempt, increment the counter
    IF NEW.attempt_type = 'failed' THEN
        UPDATE Users 
        SET failed_pin_attempts = failed_pin_attempts + 1
        WHERE user_id = NEW.user_id;
    END IF;
END$$

CREATE TRIGGER trg_lock_user_after_5_failures
AFTER UPDATE ON Users
FOR EACH ROW
BEGIN
    -- Lock user if they reach 5 failed attempts
    IF NEW.failed_pin_attempts >= 5 AND OLD.failed_pin_attempts < 5 THEN
        UPDATE Users
        SET is_pos_locked = TRUE
        WHERE user_id = NEW.user_id;
    END IF;
END$$

DELIMITER ;

CREATE TABLE Employee_Shift ( -- used to calculate employee shifts for reports
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheduled_by INT NULL,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    tip_declared_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tip_declared_at DATETIME NULL,
    CONSTRAINT chk_shift_scheduled_time CHECK (
        scheduled_end >= scheduled_start
    ),
    CONSTRAINT chk_shift_clock_time CHECK (
        clock_out IS NULL OR clock_in IS NULL OR clock_out >= clock_in
    ),
    CONSTRAINT chk_shift_tip_nonneg CHECK (tip_declared_amount >= 0),
    CONSTRAINT chk_shift_tip_declared_time CHECK (
        tip_declared_at IS NULL OR clock_in IS NULL OR tip_declared_at >= clock_in
    ),

    CONSTRAINT fk_shift_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT fk_shift_scheduled_by
        FOREIGN KEY (scheduled_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Security and brute force detection tables
CREATE TABLE IP_Address_Tracking (
    tracking_id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_id INT NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    last_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_until DATETIME NULL,
    CONSTRAINT chk_attempt_count_nonneg CHECK (attempt_count >= 0),
    CONSTRAINT chk_ip_tracking_time CHECK (blocked_until IS NULL OR blocked_until >= last_attempt),
    CONSTRAINT fk_ip_tracking_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ip_address (ip_address),
    INDEX idx_user_id (user_id),
    INDEX idx_last_attempt (last_attempt)
);

CREATE TABLE Brute_Force_Alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    alert_type ENUM('multiple_ips_single_user', 'multiple_failures_single_ip', 'rapid_failures') NOT NULL,
    attempt_count INT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alert_resolved_time CHECK (resolved_at IS NULL OR resolved_at >= created_at),
    CONSTRAINT fk_brute_force_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_alert (user_id, is_resolved),
    INDEX idx_created_at (created_at)
);

CREATE TABLE Manager_Alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    manager_id INT NOT NULL,
    alert_type ENUM('user_locked', 'brute_force', 'ip_blocked', 'suspicious_activity') NOT NULL,
    related_user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    message VARCHAR(255) NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at DATETIME NULL,
    acknowledged_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alert_acknowledged_time CHECK (acknowledged_at IS NULL OR acknowledged_at >= created_at),
    CONSTRAINT fk_manager_alert_manager
        FOREIGN KEY (manager_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_manager_alert_related_user
        FOREIGN KEY (related_user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_manager_alert_acknowledged_by
        FOREIGN KEY (acknowledged_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_manager_id (manager_id),
    INDEX idx_is_acknowledged (is_acknowledged)
);

CREATE TABLE CAPTCHA_Validation (
    validation_id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    validated_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_captcha_validated_time CHECK (validated_at IS NULL OR validated_at >= created_at),
    CONSTRAINT chk_captcha_expiry_time CHECK (expires_at > created_at),
    CONSTRAINT fk_captcha_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);
CREATE TABLE Manager_Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    inventory_item_name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_manager_notification_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_manager_notification_inventory
        FOREIGN KEY (inventory_item_name) REFERENCES Inventory(inventory_item_name)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Loyalty_Rewards (
    reward_id    INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    points_cost  INT NOT NULL,
    menu_item_id INT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_reward_name_nonblank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_reward_points_positive CHECK (points_cost >= 1),

    CONSTRAINT fk_reward_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE Loyalty_Transactions (
    transaction_id  INT AUTO_INCREMENT PRIMARY KEY,
    customer_num_id INT NOT NULL,
    online_order_id INT NULL,
    type            ENUM('earned', 'redeemed') NOT NULL,
    points          INT NOT NULL,
    description     VARCHAR(255) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_loyalty_points_positive CHECK (points > 0),

    CONSTRAINT fk_loyalty_customer
        FOREIGN KEY (customer_num_id) REFERENCES Customer(customer_num_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_loyalty_online_order
        FOREIGN KEY (online_order_id) REFERENCES Online_Orders(online_order_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

DELIMITER $$

CREATE TRIGGER trg_inventory_low_stock_notify
AFTER UPDATE ON Inventory
FOR EACH ROW
BEGIN
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
END$$

CREATE TRIGGER trg_award_loyalty_points
AFTER UPDATE ON Online_Orders
FOR EACH ROW
BEGIN
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
END$$

-- When a kitchen ticket moves to in_progress, mark the linked online order as 'preparing'
CREATE TRIGGER trg_order_preparing
AFTER UPDATE ON Kitchen_Ticket
FOR EACH ROW
BEGIN
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
        UPDATE Online_Orders
        SET customer_status = 'preparing'
        WHERE online_order_id = NEW.online_order_id
          AND customer_status = 'confirmed';
    END IF;
END$$

-- When a kitchen ticket moves to done, mark the linked online order as 'ready'
CREATE TRIGGER trg_order_ready
AFTER UPDATE ON Kitchen_Ticket
FOR EACH ROW
BEGIN
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        UPDATE Online_Orders
        SET customer_status = 'ready'
        WHERE online_order_id = NEW.online_order_id
          AND customer_status = 'preparing';
    END IF;
END$$

DELIMITER ;
