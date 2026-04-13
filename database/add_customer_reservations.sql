CREATE TABLE IF NOT EXISTS Customer_Reservation (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_num_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size SMALLINT NOT NULL,
    phone VARCHAR(10) NULL,
    occasion VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    status ENUM('requested','confirmed','seated','cancelled') NOT NULL DEFAULT 'requested',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reservation_party_size CHECK (party_size BETWEEN 1 AND 8),
    CONSTRAINT chk_reservation_phone_digits CHECK (phone IS NULL OR phone REGEXP '^[0-9]{10}$'),
    CONSTRAINT fk_customer_reservation_customer
        FOREIGN KEY (customer_num_id) REFERENCES Customer(customer_num_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
