<img width="200" height="200" alt="1lumi" src="https://github.com/user-attachments/assets/ef5656e2-88e5-408d-b0a3-65fc9ea31668" />

# Point_Of_Sale_System (POS)

## Tech Stack: 
## Tech Stack: 
- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express
- Database: MySql

## Project Overview
- frontend/ -> Next.js app
- backend/ -> Express API
- database / -> SQL Schema & seed scripts 

## User Authentication
 employees will enter a numeric pin to clock in, log in, and clock out

##  Triggers


### 1. Update Table Status When Order Opens

```sql
CREATE TRIGGER trg_order_open_sets_table_occupied
AFTER INSERT ON Orders
FOR EACH ROW
UPDATE Dining_Tables
SET status = 'occupied'
WHERE table_id = NEW.table_id
	AND NEW.status IN ('Open', 'Sent', 'Completed');
```

### 2. Return Table To Available When Order Is Paid

```sql
CREATE TRIGGER trg_order_paid_sets_table_available
AFTER UPDATE ON Orders
FOR EACH ROW
UPDATE Dining_Tables
SET status = 'available'
WHERE table_id = NEW.table_id
	AND NEW.status = 'Paid'
	AND OLD.status <> 'Paid';
```

### 3. Mark Inventory Unavailable When Stock Hits Zero

```sql
CREATE TRIGGER trg_inventory_zero_marks_unavailable
BEFORE UPDATE ON Inventory
FOR EACH ROW
SET NEW.availability_status = CASE
	WHEN NEW.amount_available <= 0 THEN FALSE
	ELSE TRUE
END;
```

##  Queries



### 1. Daily Revenue

```sql
SELECT
	DATE(created_at) AS sales_date,
	ROUND(SUM(total), 2) AS revenue,
	COUNT(*) AS orders
FROM Orders
WHERE status <> 'Void'
GROUP BY DATE(created_at)
ORDER BY sales_date DESC;
```

### 2. Top Selling Menu Items

```sql
SELECT
	mi.name,
	SUM(oi.quantity) AS units_sold,
	ROUND(SUM(oi.quantity * oi.price), 2) AS revenue
FROM Order_Item oi
JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
JOIN Orders o ON o.order_id = oi.order_id
WHERE o.status <> 'Void'
GROUP BY mi.menu_item_id, mi.name
ORDER BY units_sold DESC, revenue DESC;
```

### 3. Employee Sales Performance

```sql
SELECT
	u.name,
	COUNT(o.order_id) AS orders_taken,
	ROUND(SUM(o.total), 2) AS revenue
FROM Orders o
JOIN Users u ON u.user_id = o.created_by
WHERE o.status <> 'Void'
GROUP BY u.user_id, u.name
ORDER BY revenue DESC;
```

### 4. Low Inventory Check

```sql
SELECT
	inventory_item_name,
	amount_available,
	availability_status
FROM Inventory
WHERE amount_available <= 10
	 OR availability_status = FALSE
ORDER BY amount_available ASC, inventory_item_name ASC;
```

##  Reports



### 1. Sales Summary Report

- Uses today, weekly, and monthly revenue/order/tip totals.
- Includes revenue trend data over the selected date range.
- Built from `Orders` and `Payment` data.

### 2. Inventory Report

- Shows top-selling items and low inventory items.
- Helps identify reorder priority and item movement.
- Built from `Inventory`, `Order_Item`, and `Menu_Item`.

### 3. Labor And Operations Report

- Tracks scheduled hours, worked hours, and latest clock-in/clock-out activity.
- Summarizes voids, discounts, refunds, and payment method mix.
- Built from `Employee_Shift`, `Orders`, `Payment`, and `Users`.

## Report Endpoints

```bash
GET /api/reports/dashboard
GET /api/reports/overview
GET /api/back-office/dashboard
```