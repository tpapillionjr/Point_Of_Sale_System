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

## **Live Website**
[Lumi POS](https://lumipos.vercel.app)

## **Hosting locally**
In regards to locally installing the repository:

1. Clone the repository in your IDE using 'git clone https://github.com/tpapillionjr/Point_Of_Sale_System.git'
2. cd Point_Of_Sale_System
3. Install the backend dependencies using npm install
4. Install the frontend dependencies npm install 
5. Open a new terminal and run the backend server:
- cd backend
- npm run dev
6. On a separate terminal run the frontend:
- cd frontend
- npm run dev


## **Technologies**

- **Frontend**: ![Next.js Badge](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
 - **Backend**: ![Node.js Badge](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)  <!--![Express Badge](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) -->
- **Database**: ![MySQL Badge](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
- **Authentication**: ![JWT Badge](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
- **Deployment**: ![Vercel Badge](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
- **Version Control**: ![GitHub Badge](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Git Badge](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

Links to relevant documentation for each technology:
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
- [Customer Sign Up/Login](https://lumipos.vercel.app/customer/login): This page allows customers to sign up or log into their account.
- [Customer Menu](https://lumipos.vercel.app/customer/menu): This page allows customers to browse the menu and add items to an online order.
- [Customer Checkout](https://lumipos.vercel.app/customer/customer-checkout): This page allows customers to submit an online pickup order.
- [Reservations](https://lumipos.vercel.app/customer/reservation): This page allows customers to create a reservation.
- [Customer Dashboard](https://lumipos.vercel.app/customer/dashboard): This page allows customers to view active orders, order history, loyalty points, and rewards.

### Employees
- [Clock In](https://lumipos.vercel.app/clock-in): This page allows employees to authenticate and clock in.
- [Tables](https://lumipos.vercel.app/tables): This page allows employees to view table status and select a table for service.
- [Server Order](https://lumipos.vercel.app/server-order): This page allows employees to add menu items to a dine-in or takeout order.
- [Checkout](https://lumipos.vercel.app/checkout): This page allows employees to close an order with cash, card, or split payment.
- [Online Orders](https://lumipos.vercel.app/online-orders): This page allows staff to confirm, deny, cancel, mark paid, and mark picked up for online orders.

### Managers
- [Back Office Dashboard](https://lumipos.vercel.app/back-office): This page gives managers a summary of restaurant activity.
- [Inventory](https://lumipos.vercel.app/back-office/inventory): This page allows managers to add, edit, and remove inventory items.
- [Purchasing](https://lumipos.vercel.app/back-office/purchasing): This page allows managers to receive stock and review reorder needs.
- [Menu Management](https://lumipos.vercel.app/back-office/menu-management): This page allows managers to add, edit, activate, deactivate, and upload photos for menu items.
- [Order History](https://lumipos.vercel.app/back-office/order-history): This page allows managers to review active and recent orders.
- [Labor](https://lumipos.vercel.app/back-office/labor): This page allows managers to create and edit employee shifts.
- [Create Employees](https://lumipos.vercel.app/back-office/create-employees): This page allows managers to create employees, deactivate employees, and reset passwords.
- [Customer Loyalty](https://lumipos.vercel.app/back-office/customer-loyalty): This page allows managers to manage customer accounts, rewards, and loyalty point adjustments.
- [Settings](https://lumipos.vercel.app/back-office/settings): This page allows managers to update tax rate, receipt prefix, and approval settings.

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

<!-- ### Online Order to Kitchen Ticket Trigger
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
-->

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

## **Queries**
We have several queries that let us view information about the restaurant along with queries for reports. Here are three of the best examples.

### Daily Revenue Query:
- This query powers the Revenue Report trend chart. It shows daily revenue and order count for both in-store and online orders.
```sql
SELECT
  DATE(createdAt) AS sales_date,
  ROUND(SUM(total), 2) AS revenue,
  COUNT(*) AS orders
FROM (
  SELECT total, created_at AS createdAt
  FROM Orders
  WHERE status <> 'Void'

  UNION ALL

  SELECT total, created_at AS createdAt
  FROM Online_Orders
) all_orders
GROUP BY DATE(createdAt)
ORDER BY sales_date DESC;
```

### Top Selling Menu Items Query:
- This query powers the Item Report. It shows which menu items sold the most, how much revenue each item generated, and includes both in-store and online orders.
```sql
SELECT
  item_sales.name,
  SUM(item_sales.quantity) AS units_sold,
  ROUND(SUM(item_sales.quantity * item_sales.price), 2) AS revenue
FROM (
  SELECT mi.menu_item_id, mi.name, oi.quantity, oi.price
  FROM Order_Item oi
  JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
  JOIN Orders o ON o.order_id = oi.order_id
  WHERE o.status <> 'Void'

  UNION ALL

  SELECT mi.menu_item_id, mi.name, ooi.quantity, ooi.price
  FROM Online_Order_Item ooi
  JOIN Menu_Item mi ON mi.menu_item_id = ooi.menu_item_id
  JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
) item_sales
GROUP BY item_sales.menu_item_id, item_sales.name
ORDER BY units_sold DESC, revenue DESC;
```

### Customer Loyalty Query:
- This query powers the Customer Loyalty Report. It shows which customers earned the most points in the selected date range and helps identify the most loyal customer.
```sql
SELECT
  c.customer_num_id,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  c.email,
  COALESCE(SUM(CASE WHEN lt.type = 'earned' THEN lt.points ELSE 0 END), 0) AS points_earned,
  COALESCE(SUM(CASE WHEN lt.type = 'redeemed' THEN lt.points ELSE 0 END), 0) AS points_redeemed,
  c.points_balance AS current_balance,
  COUNT(DISTINCT lt.online_order_id) AS orders
FROM Customer c
LEFT JOIN Loyalty_Transactions lt
  ON lt.customer_num_id = c.customer_num_id
WHERE c.is_active = TRUE
GROUP BY c.customer_num_id, c.first_name, c.last_name, c.email, c.points_balance
ORDER BY points_earned DESC, current_balance DESC
LIMIT 10;
```

## **Reports**
We have three main data reports for managers. These reports are focused on restaurant revenue, customer loyalty, and menu item performance.

### [Revenue Report](https://lumipos.vercel.app/reports/revenue):
This report summarizes restaurant revenue for the selected date range. It shows total revenue, total orders, average order value, tips, revenue trends over time, revenue by order type, payment method breakdowns, and detailed revenue components such as gross menu sales, discounts, tax collected, service charges, refunds, and net restaurant sales. Managers can filter the report by date range and revenue type, including dine-in, takeout, and online orders.

![Revenue Report](https://stzldvawzsb6psiq.public.blob.vercel-storage.com/readme-photos/ReadMe_RevenueReport.png)

### [Customer Loyalty Report](https://lumipos.vercel.app/reports/customer-loyalty):
This report tracks customer loyalty activity for the selected date range. It shows total loyalty members, points issued, points redeemed, total points balance, the most loyal customer, point activity over time, top customers by points earned, and recent point activity. Managers can use this report to see which customers are most engaged during different time periods.

![Customer Loyalty Report](https://stzldvawzsb6psiq.public.blob.vercel-storage.com/readme-photos/ReadMe_CustomerLoyaltyReport.png)

### [Item Report](https://lumipos.vercel.app/reports/item-report):
This report shows how each menu item is performing. It includes total items, most popular item, highest revenue item, least popular item, items needing restocking, top 10 items by units sold, item revenue, current stock, and restock alerts. Managers can filter by date range and menu item category to review which items are selling well and which items need inventory attention.

![Item Report](https://stzldvawzsb6psiq.public.blob.vercel-storage.com/readme-photos/ReadMe_ItemReport.png)
