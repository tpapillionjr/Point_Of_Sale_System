-- =========================
-- RESET DATA (child -> parent)
-- =========================
DELETE FROM Kitchen_Ticket;
DELETE FROM Payment;
DELETE FROM Orders;
DELETE FROM Inventory;
DELETE FROM Menu_Item_Modifier;
DELETE FROM Modifier;
DELETE FROM Menu_Item;
DELETE FROM Customer;
DELETE FROM Users;
DELETE FROM Dining_Tables;

-- =========================
-- DINING TABLES
-- =========================
INSERT INTO Dining_Tables (table_id, table_number, capacity, status) VALUES
(1, 1, 2, 'available'),
(2, 2, 4, 'occupied'),
(3, 3, 6, 'reserved'),
(4, 4, 4, 'available');

-- =========================
-- USERS
-- =========================
INSERT INTO Users (user_id, name, email, password_hash, role, is_active) VALUES
(1, 'Theron Papillion', 'theron.manager@pos.local', 'hash_manager_demo', 'manager', TRUE),
(2, 'Ava Carter', 'ava.employee@pos.local', 'hash_employee_demo', 'employee', TRUE),
(3, 'Leo Nguyen', 'leo.kitchen@pos.local', 'hash_kitchen_demo', 'kitchen', TRUE);

-- =========================
-- MENU + MODIFIERS
-- =========================
INSERT INTO Menu_Item (menu_item_id, name, category, base_price, is_active) VALUES
(1, 'Cheeseburger', 'Entree', 12.99, TRUE),
(2, 'Fries', 'Sides', 3.99, TRUE),
(3, 'Iced Tea', 'Drinks', 2.49, TRUE);

INSERT INTO Modifier (modifier_id, name, price, is_active) VALUES
(1, 'Extra Cheese', 1.25, TRUE),
(2, 'No Onions', 0.00, TRUE),
(3, 'Large Size', 1.50, TRUE);

INSERT INTO Menu_Item_Modifier (menu_item_id, modifier_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 3);

-- =========================
-- INVENTORY
-- =========================
INSERT INTO Inventory (inventory_item_name, amount_available, menu_item_id, availability_status) VALUES
('Burger Patty', 50, 1, TRUE),
('French Fries Portion', 120, 2, TRUE),
('Tea Bags', 200, 3, TRUE);

-- =========================
-- CUSTOMERS
-- =========================
INSERT INTO Customer (customer_num_id, phone_number, points_balance) VALUES
(1001, '7135550101', 120),
(1002, '7135550102', 45);

-- =========================
-- ORDERS
-- =========================
INSERT INTO Orders (
    order_id, table_id, created_by, sent_to_kitchen_at, receipt_number, order_note,
    order_type, order_channel, guest_count, is_split_check, status, created_at, closed_at,
    subtotal, discount_amount, discount_type, tax, service_charge, total, void_reason, voided_by
) VALUES
(1, 2, 2, '2026-03-04 18:10:00', 'R-0001', 'No pickles on burger',
 'Dine_in', 'In_Store', 2, FALSE, 'Paid', '2026-03-04 18:05:00', '2026-03-04 18:25:00',
 16.98, 0.00, 'None', 1.40, 0.00, 18.38, NULL, NULL),

(2, 3, 2, '2026-03-04 19:00:00', 'R-0002', 'Rush order',
 'Takeout', 'Phone', 1, FALSE, 'Sent', '2026-03-04 18:58:00', NULL,
 12.99, 0.00, 'None', 1.07, 0.00, 14.06, NULL, NULL);

-- =========================
-- PAYMENTS
-- =========================
INSERT INTO Payment (
    payment_id, order_id, register_id, served_by, payment_type, card_type, card_last4,
    amount, paid_at, tip_amount, tendered_amount, change_given, status, voided_at, refund_reason
) VALUES
(1, 1, 'REG-01', 2, 'card', 'visa', '4242',
 18.38, '2026-03-04 18:25:00', 2.00, 0.00, 0.00, 'approved', NULL, NULL);

-- =========================
-- KITCHEN TICKETS
-- =========================
INSERT INTO Kitchen_Ticket (ticket_id, order_id, table_id, status, created_at, updated_at) VALUES
(1, 1, 2, 'done', '2026-03-04 18:10:05', '2026-03-04 18:20:00'),
(2, 2, 3, 'in_progress', '2026-03-04 19:00:05', '2026-03-04 19:05:00');
