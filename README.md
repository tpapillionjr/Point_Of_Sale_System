![image](https://github.com/user-attachments/assets/ef5656e2-88e5-408d-b0a3-65fc9ea31668)
<h1 align="center">
    Lumi Point of Sale System
</h1>

# Project Requirements

1. [User Authentication for Different User Roles](#user-authentication-for-different-user-roles)
2. [Data Entry Forms to Add New Data, Modify Existing Data, and 'Delete' Data](#data-entry-forms-to-add-new-data-modify-existing-data-and-delete-data)
3. [At Least 2 Triggers](#triggers)
4. [At Least 3 Queries](#queries)
5. [At Least 3 Reports](#reports)

## **Hosting locally**
In regards to locally installing the repository:

1. Clone the repository in your IDE
2. Install the backend dependencies uping 
3. Install the frontend dependencies
4. Open a new terminal and run the backend server:
- cd backend
- npm run dev
5. On a separate terminal run the frontend:
- cd frontend
- npm run dev


## **Technologies**

- **Frontend**: ![Next.js Badge](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **Backend**: ![Node.js Badge](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Express Badge](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
- **Database**: ![MySQL Badge](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
- **Authentication**: ![JWT Badge](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
- **Deployment**: ![Vercel Badge](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
- **Version Control**: ![GitHub Badge](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Git Badge](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

You can also add links to relevant documentation for each technology:
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## **User Authentication for Different User Roles**
We have 4 different user roles implemented. They are managers, employees, kitchen staff, and customers.
- Manager: Managers can access the back office, reports, employee management, inventory, purchasing, menu management, customer loyalty tools, settings, and restricted order actions.
- Employee: Employees can clock in, open tables, create dine-in or takeout orders, send orders to the kitchen, and close checks.
- Kitchen: Kitchen staff can view kitchen tickets and update ticket statuses.
- Customer: Customers can create accounts, log in, place online orders, track active orders, make reservations, view order history, and use loyalty rewards.

## **Data Entry Forms to Add New Data, Modify Existing Data, and 'Delete' Data**
### Customers:
- [Customer Sign Up/Login](/customer/login): This page allows customers to sign up or log into their account.
- [Customer Menu](/customer/menu): This page allows customers to browse the menu and add items to an online order.
- [Customer Checkout](/customer/customer-checkout): This page allows customers to submit an online pickup order.
- [Reservations](/customer/reservation): This page allows customers to create a reservation.
- [Customer Dashboard](/customer/dashboard): This page allows customers to view active orders, order history, loyalty points, and rewards.

### Employees
- [Clock In](/clock-in): This page allows employees to authenticate and clock in.
- [Tables](/tables): This page allows employees to view table status and select a table for service.
- [Server Order](/server-order): This page allows employees to add menu items to a dine-in or takeout order.
- [Checkout](/checkout): This page allows employees to close an order with cash, card, or split payment.
- [Online Orders](/online-orders): This page allows staff to confirm, deny, cancel, mark paid, and mark picked up for online orders.

### Managers
- [Back Office Dashboard](/back-office): This page gives managers a summary of restaurant activity.
- [Inventory](/back-office/inventory): This page allows managers to add, edit, and remove inventory items.
- [Purchasing](/back-office/purchasing): This page allows managers to receive stock and review reorder needs.
- [Menu Management](/back-office/menu-management): This page allows managers to add, edit, activate, deactivate, and upload photos for menu items.
- [Order History](/back-office/order-history): This page allows managers to review active and recent orders.
- [Labor](/back-office/labor): This page allows managers to create and edit employee shifts.
- [Create Employees](/back-office/create-employees): This page allows managers to create employees, deactivate employees, and reset passwords.
- [Customer Loyalty](/back-office/customer-loyalty): This page allows managers to manage customer accounts, rewards, and loyalty point adjustments.
- [Settings](/back-office/settings): This page allows managers to update tax rate, receipt prefix, and approval settings.

## **Triggers**

### Low Inventory Notification Trigger
This trigger is designed to notify managers when an inventory item drops to 10 or fewer available units.
```sql
CREATE TRIGGER trg_inventory_low_stock_notify
AFTER UPDATE ON inventory
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
END;
```

### Online Order to Kitchen Ticket Trigger
This trigger is designed to create a kitchen ticket when an online order is confirmed.
```sql
CREATE TRIGGER trg_create_kitchen_ticket_on_online_confirm
AFTER UPDATE ON online_orders
FOR EACH ROW
BEGIN
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
END;
```

### Kitchen Ticket Ready Trigger
This trigger is designed to update an online order to ready when its kitchen ticket is marked done.
```sql
CREATE TRIGGER trg_order_ready
AFTER UPDATE ON kitchen_ticket
FOR EACH ROW
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    UPDATE Online_Orders
    SET customer_status = 'ready'
    WHERE online_order_id = NEW.online_order_id
      AND customer_status = 'preparing';
  END IF;
END;
```

### Failed Login Trigger
This trigger is designed to increment a user's failed login count when a failed login attempt is inserted into the login audit table.
```sql
CREATE TRIGGER trg_increment_failed_login
BEFORE INSERT ON login_audit
FOR EACH ROW
BEGIN
    IF NEW.attempt_type = 'failed' THEN
        UPDATE Users
        SET failed_pin_attempts = failed_pin_attempts + 1
        WHERE user_id = NEW.user_id;
    END IF;
END;
```

## **Queries**
We have several queries that let us view information about the restaurant along with queries for reports. Here are three of the best examples.

### Daily Revenue Query:
- This query shows daily revenue and order count for the restaurant.
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

### Top Selling Menu Items Query:
- This query shows which menu items sold the most and how much revenue each item generated.
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

### Employee Sales Performance Query:
- This query shows how many orders each employee handled and the revenue connected to those orders.
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

## **Reports**
We have several data reports. The three main reports are Sales, Inventory, and Labor.

### Sales Reports:
This report shows revenue, order totals, top selling items, sales by category, server performance, and tips. It helps managers understand what menu items are selling, how much money the restaurant is making, and which employees are handling the most sales.

### Inventory Reports:
This report shows current stock levels, low stock items, unavailable items, ingredient usage, top items, waste/risk indicators, menu coverage, and reorder queues. It helps managers know what needs to be restocked and which menu items may be affected by inventory problems.

### Labor Reports:
This report shows employee hours, scheduled shifts, worked shifts, latest clock activity, and labor performance. It helps managers review staffing, shift activity, and employee performance.
