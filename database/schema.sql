
CREATE TABLE Dining_Tables (
    table_id INT AUTO_INCREMENT PRIMARY KEY,
    table_number SMALLINT NOT NULL UNIQUE,
    capacity SMALLINT NULL,
    status ENUM('available','occupied','reserved','inactive') NOT NULL DEFAULT 'available',
    CONSTRAINT chk_table_number_positive CHECK (table_number >= 1),
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
    payment_preference ENUM('online','in_store') NOT NULL DEFAULT 'in_store',

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
    customer_status ENUM('placed','confirmed','preparing','ready') NOT NULL DEFAULT 'placed',
    payment_preference ENUM('online','in_store') NOT NULL DEFAULT 'in_store',

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
