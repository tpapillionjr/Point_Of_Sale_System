CREATE TABLE Orders (
	order_id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    created_by INT NOT NULL,
    sent_to_kitchen_at DATETIME NULL,

    receipt_number VARCHAR(30),
    order_note VARCHAR(255),

    order_type ENUM('Dine_in', 'Takeout', 'Delivery') NOT NULL DEFAULT 'Dine_in',
    order_channel ENUM('In_Store','Phone','Online') NOT NULL DEFAULT 'In_store',
    guest_count SMALLINT NOT NULL DEFAULT 1,

    is_split_check BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM('Open', 'Sent', 'Completed', 'Paid', 'Void')
		NOT NULL DEFAULT 'Open',

	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,

    subtotal DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('None','Promo','Mnager_comp','Employee_meal') NOT NULL DEFAULT 'none',
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

    Customer_num_id INT PRIMARY KEY,
    Phone_number VARCHAR(10) NOT NULL UNIQUE,
    Points_balance INT DEFAULT 0 CHECK (Points_balance >= 0)
);

CREATE TABLE Inventory (
    Item_name VARCHAR(100) PRIMARY KEY,
    Amount_available INT NOT NULL CHECK (Amount_available >= 0),
    Menu_item_id INT NOT NULL,
    Availability_status BOOLEAN DEFAULT TRUE
    FOREIGN KEY (Menu_item_id)
        REFERENCES Menu_Item(Menu_item_id)
);

CREATE Table User (
    User_Id INT PRIMARY KEY,
    Name  NOT NULL VARCHAR(50),
    Email UNIQUE NOT NULL VARCHAR(250),
    Password SMALLINT VARCHAR(5),
    Role ENUM('employee','manager','kitchen') SMALLINT NOT NULL,
    Is_active BOOLEAN,

);

CREATE TABLE Table (
    Table_Id INT PRIMARY KEY,
    Table_number SMALLINT UNIQUE NOT NULL,
    capacity SMALLINT NULL,
    Status ENUM ('available','occupied','reserved','inactive'),
);

Create TABLE Menu_Item (
    menu_Item_id int Primary Key,
    Name varchar(50) not Null,
    Caretgory smallint(),
    Base_price float(),
    Is_active bool
);

Create Table Modifier (
Modifier_id int primary key,
name varchar(50) not Null,
Price double,
Is_active bool
);

Create TABLE Menu_Item_Modifier (
    Menu_item_id int foreign key references menu_item(Menu_item_id),
    modifier_id int foreign key references menu_item(Menu_item_id),

    constraint modifierid foreign key (menu_item)
        references Menu_item(Menu_item_id)
    constraint menumodifier foreign key (Modifier)
        references Modifier(Modifier_id)
);

CREATE TABLE Kitchen_Ticket (
                Ticket_id int Primary Key Auto_increment,
                Order_id int,
                Table_id smallint,
                status varchar,
                created_at time,
                updated_at time,
             constraint kitchenorder foreign key (Order_id)
                references Order(order_id)
        constraint kitchenTable foreign key (Table_id)
        references Table(Table_id)
);