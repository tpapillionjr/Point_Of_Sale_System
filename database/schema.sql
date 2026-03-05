-- =========================
-- TABLES
-- =========================

CREATE TABLE Dining_Tables (
    table_id INT AUTO_INCREMENT PRIMARY KEY,
    table_number SMALLINT NOT NULL UNIQUE,
    capacity SMALLINT NULL,
    status ENUM('available','occupied','reserved','inactive') NOT NULL DEFAULT 'available'
);

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(250) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('employee','manager','kitchen') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE Menu_Item (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50) NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE Modifier (
    modifier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
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
    CONSTRAINT fk_inventory_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Loyalty / Customer (your snippet was missing CREATE TABLE)
CREATE TABLE Customer (
    customer_num_id INT PRIMARY KEY,
    phone_number VARCHAR(10) NOT NULL UNIQUE,
    points_balance INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_points_nonneg CHECK (points_balance >= 0)
);

-- =========================
-- ORDERS + PAYMENTS
-- =========================

CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    created_by INT NOT NULL,
    sent_to_kitchen_at DATETIME NULL,

    receipt_number VARCHAR(30),
    order_note VARCHAR(255),

    order_type ENUM('Dine_in', 'Takeout', 'Delivery') NOT NULL DEFAULT 'Dine_in',
    order_channel ENUM('In_Store','Phone','Online') NOT NULL DEFAULT 'In_Store',
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
    CONSTRAINT chk_orders_id_pos CHECK (table_id > 0 AND created_by > 0),
    CONSTRAINT chk_orders_money_nonneg CHECK (subtotal >= 0 AND tax >= 0 AND total >= 0),
    CONSTRAINT chk_orders_closed_time CHECK (closed_at IS NULL OR closed_at >= created_at),
    CONSTRAINT chk_guest_count CHECK (guest_count >= 1 AND guest_count <= 20),

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
    CONSTRAINT chk_change_nonneg CHECK (change_given >= 0),

    CONSTRAINT chk_payment_card_rules CHECK (
        (payment_type = 'cash' AND card_type IS NULL AND card_last4 IS NULL)
        OR
        (payment_type = 'card' AND card_type IS NOT NULL AND card_last4 IS NOT NULL)
    ),

    CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_payment_served_by
        FOREIGN KEY (served_by) REFERENCES Users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================
-- KITCHEN TICKETS
-- =========================

CREATE TABLE Kitchen_Ticket (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    table_id INT NOT NULL,
    status ENUM('new','in_progress','done','canceled') NOT NULL DEFAULT 'new',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,

    CONSTRAINT fk_kitchen_order
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_kitchen_table
        FOREIGN KEY (table_id) REFERENCES Dining_Tables(table_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);