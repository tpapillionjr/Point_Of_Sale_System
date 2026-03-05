CREATE TABLE Orders (
	order_id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    created_by INT NOT NULL,
    sent_to_kitchen_at DATETIME NULL,

    receipt_number VARCHAR(30),
    order_note VARCHAR(255),

    order_type ENUM('dine_in', 'takeout', 'delivery') NOT NULL DEFAULT 'dine_in',
    order_channel ENUM('in_store','phone','online') NOT NULL DEFAULT 'in_store',
    guest_count SMALLINT NOT NULL DEFAULT 1,

    is_split_check BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM('open', 'sent', 'completed', 'paid', 'void')
		NOT NULL DEFAULT 'open',

	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,

    subtotal DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('none','promo','manager_comp','employee_meal') NOT NULL DEFAULT 'none',
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    void_reason VARCHAR(100),
    voided_by INT NULL,


    -- domain checks:
    CONSTRAINT chk_orders_id_pos CHECK (table_id > 0 AND created_by > 0),
    CONSTRAINT chk_orders_money_non_neg CHECK (subtotal >= 0 AND tax >= 0 AND total >= 0),
    CONSTRAINT chk_orders_closed_time CHECK (closed_at IS NULL OR closed_at >= created_at),
    CONSTRAINT chk_guest_count CHECK (guest_count >= 1 AND guest_count <= 20)
);

CREATE TABLE Payment (
	payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL, -- remove UNIQUE too allow for split payments
    register_id VARCHAR(20),

    served_by INT NULL, -- employee who processed payment

    payment_type ENUM('cash', 'card') NOT NULL,
    card_type ENUM('visa', 'mastercard', 'amex', 'discover'),
    card_last4 CHAR(4),

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
        (payment_type = 'cash' AND card_type is NULL AND card_last4 IS NULL)
        OR
        (payment_type = 'card' AND card_type is NOT NULL AND card_last4 IS NOT NULL)

    ),
    
    
    CONSTRAINT fk_payment_order
		FOREIGN KEY (order_id) REFERENCES Orders(order_id)
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);