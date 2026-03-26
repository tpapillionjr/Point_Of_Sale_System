import db from "../db/index.js";

const RANGE_DAYS = {
  today: 1,
  "7days": 7,
  "30days": 30,
};

function normalizeRange(range) {
  return RANGE_DAYS[range] ? range : "7days";
}

function rangeFilter(days, column = "created_at") {
  return `DATE(${column}) >= DATE_SUB(CURRENT_DATE, INTERVAL ${days - 1} DAY)`;
}

function createAction({ title, description, priority }) {
  return { title, description, priority };
}

function getInventoryStatus(amountAvailable, availabilityStatus) {
  if (!availabilityStatus || amountAvailable <= 0) {
    return "Unavailable";
  }

  if (amountAvailable <= 3) {
    return "Critical";
  }

  if (amountAvailable <= 10) {
    return "Low";
  }

  return "Healthy";
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getBackOfficeDashboard() {
  const [openTablesRows, openChecksRows, kitchenTicketRows, inventoryAlertRows, lowStockRows, staleTicketRows] =
    await Promise.all([
      db.query(
        `SELECT COUNT(*) AS count
         FROM Dining_Tables
         WHERE status = 'occupied'`
      ),
      db.query(
        `SELECT COUNT(*) AS count
         FROM Orders
         WHERE status IN ('Open', 'Sent', 'Completed')`
      ),
      db.query(
        `SELECT COUNT(*) AS count
         FROM Kitchen_Ticket
         WHERE status IN ('new', 'in_progress')`
      ),
      db.query(
        `SELECT COUNT(*) AS count
         FROM Inventory
         WHERE availability_status = FALSE
            OR amount_available <= 10`
      ),
      db.query(
        `SELECT inventory_item_name AS itemName, amount_available AS amountAvailable
         FROM Inventory
         WHERE availability_status = FALSE
            OR amount_available <= 10
         ORDER BY amount_available ASC, inventory_item_name ASC
         LIMIT 3`
      ),
      db.query(
        `SELECT kt.ticket_id AS ticketId,
                dt.table_number AS tableNumber,
                TIMESTAMPDIFF(MINUTE, kt.created_at, CURRENT_TIMESTAMP) AS ageMinutes
         FROM Kitchen_Ticket kt
         JOIN Dining_Tables dt ON dt.table_id = kt.table_id
         WHERE kt.status IN ('new', 'in_progress')
         ORDER BY kt.created_at ASC
         LIMIT 3`
      ),
    ]);

  const summary = {
    openTables: Number(openTablesRows[0]?.count ?? 0),
    openChecks: Number(openChecksRows[0]?.count ?? 0),
    kitchenTickets: Number(kitchenTicketRows[0]?.count ?? 0),
    inventoryAlerts: Number(inventoryAlertRows[0]?.count ?? 0),
  };

  const managerActions = [
    ...lowStockRows.map((row) =>
      createAction({
        title: `Replenish ${row.itemName}`,
        description: `${row.itemName} is at ${row.amountAvailable} on hand and may block menu availability soon.`,
        priority: Number(row.amountAvailable) <= 0 ? "High" : "Medium",
      })
    ),
    ...staleTicketRows.map((row) =>
      createAction({
        title: `Review kitchen ticket #${row.ticketId} for table ${row.tableNumber}`,
        description: `This ticket has been open for ${row.ageMinutes} minutes and may need manager follow-up.`,
        priority: Number(row.ageMinutes) >= 20 ? "High" : "Medium",
      })
    ),
  ].slice(0, 6);

  if (managerActions.length === 0) {
    managerActions.push(
      createAction({
        title: "No urgent manager actions",
        description: "Inventory, kitchen flow, and dining room counts are currently within expected ranges.",
        priority: "Low",
      })
    );
  }

  return { summary, managerActions };
}

async function getBackOfficeData(range) {
  const days = RANGE_DAYS[normalizeRange(range)];
  const inventoryRowsPromise = db.query(
    `SELECT
       i.inventory_item_name AS inventoryItemName,
       i.amount_available AS amountAvailable,
       i.availability_status AS availabilityStatus,
       i.menu_item_id AS menuItemId,
       mi.name AS linkedMenuItem,
       COALESCE(mi.category, 'Uncategorized') AS category,
       mi.base_price AS basePrice
     FROM Inventory i
     LEFT JOIN Menu_Item mi ON mi.menu_item_id = i.menu_item_id
     ORDER BY i.amount_available ASC, i.inventory_item_name ASC`
  );

  const inventoryUsagePromise = db.query(
    `SELECT
       i.inventory_item_name AS inventoryItemName,
       COALESCE(SUM(CASE WHEN o.status <> 'Void' AND ${rangeFilter(days, "o.created_at")} THEN oi.quantity ELSE 0 END), 0) AS unitsUsed,
       ROUND(COALESCE(SUM(CASE WHEN o.status <> 'Void' AND ${rangeFilter(days, "o.created_at")} THEN oi.quantity * oi.price ELSE 0 END), 0), 2) AS revenue,
       COUNT(DISTINCT CASE WHEN o.status <> 'Void' AND ${rangeFilter(days, "o.created_at")} THEN oi.order_id ELSE NULL END) AS orderCount
     FROM Inventory i
     LEFT JOIN Order_Item oi ON oi.menu_item_id = i.menu_item_id
     LEFT JOIN Orders o ON o.order_id = oi.order_id
     GROUP BY i.inventory_item_name
     ORDER BY unitsUsed DESC, revenue DESC, i.inventory_item_name ASC`
  );

  const inventoryUpdateStatsPromise = db.query(
    `SELECT MAX(created_at) AS lastOrderAt
     FROM Orders`
  );

  const laborRowsPromise = db.query(
    `SELECT
       u.user_id AS userId,
       u.name,
       u.role,
       es.scheduled_start AS scheduledStart,
       es.scheduled_end AS scheduledEnd,
       es.clock_in AS clockIn,
       es.clock_out AS clockOut,
       es.tip_declared_amount AS tipDeclaredAmount
     FROM Employee_Shift es
     JOIN Users u ON u.user_id = es.user_id
     WHERE ${rangeFilter(days, "es.scheduled_start")}
     ORDER BY es.scheduled_start DESC, u.name ASC`
  );

  const menuItemsPromise = db.query(
    `SELECT menu_item_id AS menuItemId, name, COALESCE(category, 'Uncategorized') AS category, base_price AS basePrice, is_active AS isActive
     FROM Menu_Item
     ORDER BY is_active DESC, name ASC`
  );

  const modifiersPromise = db.query(
    `SELECT modifier_id AS modifierId, name, price, is_active AS isActive
     FROM Modifier
     ORDER BY is_active DESC, name ASC`
  );

  const recentOrdersPromise = db.query(
    `SELECT
       o.order_id AS orderId,
       COALESCE(o.receipt_number, CONCAT('Order #', o.order_id)) AS receiptNumber,
       dt.table_number AS tableNumber,
       u.name AS employeeName,
       o.total,
       o.status,
       o.created_at AS createdAt
     FROM Orders o
     LEFT JOIN Dining_Tables dt ON dt.table_id = o.table_id
     LEFT JOIN Users u ON u.user_id = o.created_by
     WHERE ${rangeFilter(days, "o.created_at")}
     ORDER BY o.created_at DESC
     LIMIT 12`
  );

  const activeOrdersPromise = db.query(
    `SELECT
       o.order_id AS orderId,
       COALESCE(o.receipt_number, CONCAT('Order #', o.order_id)) AS receiptNumber,
       dt.table_number AS tableNumber,
       u.name AS employeeName,
       o.total,
       o.status,
       o.created_at AS createdAt
     FROM Orders o
     LEFT JOIN Dining_Tables dt ON dt.table_id = o.table_id
     LEFT JOIN Users u ON u.user_id = o.created_by
     WHERE o.status IN ('Open', 'Sent', 'Completed')
     ORDER BY o.created_at DESC`
  );

  const refundCountsPromise = db.query(
    `SELECT COUNT(*) AS refundCount
     FROM Payment
     WHERE status = 'refunded'
       AND ${rangeFilter(days, "paid_at")}`
  );

  const customerRowsPromise = db.query(
    `SELECT
       customer_num_id AS customerId,
       phone_number AS phoneNumber,
       points_balance AS pointsBalance
     FROM Customer
     ORDER BY points_balance DESC, customer_num_id ASC
     LIMIT 20`
  );

  const userCountsPromise = db.query(
    `SELECT role, COUNT(*) AS count
     FROM Users
     GROUP BY role`
  );

  const [inventoryRows, inventoryUsageRows, inventoryUpdateStatsRows, laborRows, menuItems, modifiers, recentOrders, activeOrders, refundCountsRows, customerRows, userCountsRows] =
    await Promise.all([
      inventoryRowsPromise,
      inventoryUsagePromise,
      inventoryUpdateStatsPromise,
      laborRowsPromise,
      menuItemsPromise,
      modifiersPromise,
      recentOrdersPromise,
      activeOrdersPromise,
      refundCountsPromise,
      customerRowsPromise,
      userCountsPromise,
    ]);

  const stockRows = inventoryRows.map((row) => ({
    inventoryItemName: row.inventoryItemName,
    linkedMenuItem: row.linkedMenuItem ?? "Unlinked",
    category: row.category,
    amountAvailable: Number(row.amountAvailable ?? 0),
    basePrice: Number(row.basePrice ?? 0),
    status: getInventoryStatus(Number(row.amountAvailable ?? 0), Boolean(row.availabilityStatus)),
    menuItemId: row.menuItemId,
  }));

  const lowStockCount = stockRows.filter((row) => row.status === "Low" || row.status === "Critical").length;
  const unavailableCount = stockRows.filter((row) => row.status === "Unavailable").length;
  const activeMenuLinks = stockRows.filter((row) => row.linkedMenuItem !== "Unlinked").length;
  const totalOnHandUnits = stockRows.reduce((sum, row) => sum + row.amountAvailable, 0);

  const usageRows = inventoryUsageRows.map((row) => {
    const stock = stockRows.find((item) => item.inventoryItemName === row.inventoryItemName);
    return {
      inventoryItemName: row.inventoryItemName,
      unitsUsed: Number(row.unitsUsed ?? 0),
      revenue: Number(row.revenue ?? 0),
      orderCount: Number(row.orderCount ?? 0),
      depletionRisk: stock?.status ?? "Healthy",
    };
  });

  const reorderRows = stockRows
    .filter((row) => row.status !== "Healthy")
    .map((row) => ({
      inventoryItemName: row.inventoryItemName,
      currentOnHand: row.amountAvailable,
      suggestedOrder: Math.max(12 - row.amountAvailable, 1),
      linkedMenuItem: row.linkedMenuItem,
      priority: row.status,
      estimatedCost: Number((Math.max(12 - row.amountAvailable, 1) * Math.max(row.basePrice || 1, 1)).toFixed(2)),
    }))
    .sort((a, b) => a.currentOnHand - b.currentOnHand);

  const laborByEmployee = new Map();
  for (const row of laborRows) {
    const existing = laborByEmployee.get(row.userId) ?? {
      userId: row.userId,
      name: row.name,
      role: row.role,
      shiftsScheduled: 0,
      shiftsClocked: 0,
      currentlyClockedIn: false,
      tipsDeclared: 0,
    };

    existing.shiftsScheduled += 1;
    if (row.clockIn) {
      existing.shiftsClocked += 1;
      existing.currentlyClockedIn = existing.currentlyClockedIn || !row.clockOut;
    }
    existing.tipsDeclared += Number(row.tipDeclaredAmount ?? 0);
    laborByEmployee.set(row.userId, existing);
  }

  const laborEmployees = [...laborByEmployee.values()].sort((a, b) => a.name.localeCompare(b.name));
  const activeStaff = laborEmployees.filter((row) => row.currentlyClockedIn).length;
  const scheduledToday = laborRows.filter((row) => {
    const scheduled = new Date(row.scheduledStart);
    const now = new Date();
    return (
      scheduled.getFullYear() === now.getFullYear() &&
      scheduled.getMonth() === now.getMonth() &&
      scheduled.getDate() === now.getDate()
    );
  }).length;
  const tipsPending = laborRows.filter((row) => row.clockOut && Number(row.tipDeclaredAmount ?? 0) === 0).length;

  const paidOrders = recentOrders.filter((row) => row.status === "Paid").length;
  const voidOrders = recentOrders.filter((row) => row.status === "Void").length;

  const userRoleCounts = Object.fromEntries(userCountsRows.map((row) => [row.role, Number(row.count ?? 0)]));
  const totalPoints = customerRows.reduce((sum, row) => sum + Number(row.pointsBalance ?? 0), 0);
  const averagePoints = customerRows.length ? totalPoints / customerRows.length : 0;

  return {
    inventory: {
      summaryCards: [
        { title: "Inventory SKUs", value: String(stockRows.length) },
        { title: "On Hand Units", value: String(totalOnHandUnits) },
        { title: "Low Stock Alerts", value: String(lowStockCount) },
        { title: "Unavailable Items", value: String(unavailableCount) },
        { title: "Menu Links Active", value: `${activeMenuLinks}/${stockRows.length}` },
      ],
      stockRows,
      usageSummary: [
        { title: "Tracked Items", value: String(usageRows.length) },
        { title: "Units Used", value: String(usageRows.reduce((sum, row) => sum + row.unitsUsed, 0)) },
        { title: "Revenue Tied to Inventory", value: formatCurrency(usageRows.reduce((sum, row) => sum + row.revenue, 0)) },
        { title: "Top Usage Item", value: usageRows[0]?.inventoryItemName ?? "No data" },
      ],
      usageRows,
      menuCoverageRows: stockRows,
      reorderRows,
      countSummary: [
        { title: "Items Tracked", value: String(stockRows.length) },
        { title: "Variance Flags", value: String(lowStockCount + unavailableCount) },
        { title: "Pending Recounts", value: String(unavailableCount) },
        { title: "Last Inventory Activity", value: formatDateTime(inventoryUpdateStatsRows[0]?.lastOrderAt) },
      ],
    },
    purchasing: {
      summaryCards: [
        { title: "Open Reorder Lines", value: String(reorderRows.length) },
        { title: "Critical Orders", value: String(reorderRows.filter((row) => row.priority === "Critical" || row.priority === "Unavailable").length) },
        { title: "Projected Cost", value: formatCurrency(reorderRows.reduce((sum, row) => sum + row.estimatedCost, 0)) },
        { title: "Menu Items Impacted", value: String(reorderRows.length) },
      ],
      reorderRows,
    },
    labor: {
      summaryCards: [
        { title: "Scheduled This Range", value: String(laborRows.length) },
        { title: "Active Staff", value: String(activeStaff) },
        { title: "Scheduled Today", value: String(scheduledToday) },
        { title: "Tips Pending", value: String(tipsPending) },
      ],
      employees: laborEmployees,
    },
    menu: {
      summaryCards: [
        { title: "Menu Items", value: String(menuItems.length) },
        { title: "Active Items", value: String(menuItems.filter((row) => row.isActive).length) },
        { title: "Inactive Items", value: String(menuItems.filter((row) => !row.isActive).length) },
        { title: "Modifiers", value: String(modifiers.length) },
      ],
      items: menuItems.map((row) => ({
        menuItemId: row.menuItemId,
        name: row.name,
        category: row.category,
        basePrice: Number(row.basePrice ?? 0),
        status: row.isActive ? "Active" : "Inactive",
      })),
      modifiers: modifiers.map((row) => ({
        modifierId: row.modifierId,
        name: row.name,
        price: Number(row.price ?? 0),
        status: row.isActive ? "Active" : "Inactive",
      })),
    },
    orders: {
      summaryCards: [
        { title: "Orders This Range", value: String(recentOrders.length) },
        { title: "Paid Orders", value: String(paidOrders) },
        { title: "Void Orders", value: String(voidOrders) },
        { title: "Refunds", value: String(Number(refundCountsRows[0]?.refundCount ?? 0)) },
      ],
      activeOrders: activeOrders.map((row) => ({
        orderId: row.orderId,
        receiptNumber: row.receiptNumber,
        tableNumber: row.tableNumber ?? "—",
        employeeName: row.employeeName ?? "Unknown",
        total: Number(row.total ?? 0),
        status: row.status,
        createdAt: formatDateTime(row.createdAt),
      })),
      recentOrders: recentOrders.map((row) => ({
        orderId: row.orderId,
        receiptNumber: row.receiptNumber,
        tableNumber: row.tableNumber ?? "—",
        employeeName: row.employeeName ?? "Unknown",
        total: Number(row.total ?? 0),
        status: row.status,
        createdAt: formatDateTime(row.createdAt),
      })),
    },
    customers: {
      summaryCards: [
        { title: "Customer Records", value: String(customerRows.length) },
        { title: "Total Points", value: String(totalPoints) },
        { title: "Average Points", value: averagePoints ? averagePoints.toFixed(1) : "0.0" },
        { title: "Top Balance", value: String(Math.max(...customerRows.map((row) => Number(row.pointsBalance ?? 0)), 0)) },
      ],
      customers: customerRows.map((row) => ({
        customerId: row.customerId,
        phoneNumber: row.phoneNumber,
        pointsBalance: Number(row.pointsBalance ?? 0),
      })),
    },
    settings: {
      summaryCards: [
        { title: "Manager Accounts", value: String(userRoleCounts.manager ?? 0) },
        { title: "Kitchen Accounts", value: String(userRoleCounts.kitchen ?? 0) },
        { title: "Server Accounts", value: String(userRoleCounts.employee ?? 0) },
        { title: "Persisted Settings", value: "0" },
      ],
      notes: [
        "No dedicated settings table exists yet; current behavior is driven by schema defaults and backend rules.",
        "Manager-only access to Back Office and Reports is enforced in the frontend route guard.",
        "Kitchen tickets can be closed by kitchen staff or managers.",
        "To persist taxes, receipt prefixes, and approval rules, add a configuration table and manager-only update endpoints.",
      ],
    },
  };
}

export { getBackOfficeDashboard, getBackOfficeData };
