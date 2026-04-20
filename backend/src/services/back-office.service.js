import db from "../db/index.js";
import { getBackOfficeSettings } from "./settings.service.js";

const LEGACY_RANGE_DAYS = {
  today: 1,
  "7days": 7,
  "30days": 30,
};

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function normalizeBackOfficeFilters(input) {
  if (typeof input === "string") {
    const numericDays = Number.parseInt(input, 10);

    if (Number.isInteger(numericDays) && numericDays >= 1 && numericDays <= 365) {
      return { mode: "days", days: numericDays, startDate: null, endDate: null };
    }

    if (LEGACY_RANGE_DAYS[input]) {
      return { mode: "days", days: LEGACY_RANGE_DAYS[input], startDate: null, endDate: null };
    }
  }

  const numericDays = Number.parseInt(input?.days, 10);
  const startDate = isValidDateOnly(input?.startDate) ? input.startDate : null;
  const endDate = isValidDateOnly(input?.endDate) ? input.endDate : null;

  if (startDate || endDate) {
    const normalizedStart = startDate && endDate && startDate > endDate ? endDate : startDate;
    const normalizedEnd = startDate && endDate && startDate > endDate ? startDate : endDate;

    return {
      mode: "dates",
      days: null,
      startDate: normalizedStart,
      endDate: normalizedEnd,
    };
  }

  if (Number.isInteger(numericDays) && numericDays >= 1 && numericDays <= 365) {
    return { mode: "days", days: numericDays, startDate: null, endDate: null };
  }

  return { mode: "days", days: 7, startDate: null, endDate: null };
}

function rangeFilter(filters, column = "created_at") {
  if (filters.mode === "dates") {
    if (filters.startDate && filters.endDate) {
      return `DATE(${column}) BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
    }

    if (filters.startDate) {
      return `DATE(${column}) >= '${filters.startDate}'`;
    }

    if (filters.endDate) {
      return `DATE(${column}) <= '${filters.endDate}'`;
    }
  }

  const days = filters.days ?? 7;
  return `DATE(${column}) >= DATE_SUB(CURRENT_DATE, INTERVAL ${days - 1} DAY)`;
}

function currentWeekFilter(column = "created_at") {
  return `DATE(${column}) >= DATE_SUB(CURRENT_DATE, INTERVAL (DAYOFWEEK(CURRENT_DATE) - 1) DAY)
    AND DATE(${column}) < DATE_ADD(DATE_SUB(CURRENT_DATE, INTERVAL (DAYOFWEEK(CURRENT_DATE) - 1) DAY), INTERVAL 7 DAY)`;
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

function normalizeCategory(value) {
  const category = value || "Uncategorized";
  return String(category).toLowerCase() === "entree" ? "Entrees" : category;
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

function hoursBetween(start, end) {
  if (!start || !end) {
    return 0;
  }

  return Math.max((new Date(end).getTime() - new Date(start).getTime()) / 3600000, 0);
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

function normalizeInventoryType(type) {
  return type === "utensils" ? "utensils" : "menu";
}

function normalizeInventoryName(value, label = "inventoryItemName") {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    throw error;
  }

  return name;
}

function normalizeNonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    const error = new Error(`${label} must be a non-negative integer.`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function normalizeOptionalDateTime(value, label) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${label} must be a valid date/time.`);
    error.statusCode = 400;
    throw error;
  }

  const pad = (part) => String(part).padStart(2, "0");
  return [
    parsed.getFullYear(),
    pad(parsed.getMonth() + 1),
    pad(parsed.getDate()),
  ].join("-") + ` ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

function normalizeOptionalNonNegativeNumber(value, label) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(`${label} must be a non-negative number.`);
    error.statusCode = 400;
    throw error;
  }

  return Number(parsed.toFixed(2));
}

async function createLaborShift(payload = {}) {
  const userId = Number(payload.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("userId must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  const scheduledStart = normalizeOptionalDateTime(payload.scheduledStart, "scheduledStart");
  const scheduledEnd = normalizeOptionalDateTime(payload.scheduledEnd, "scheduledEnd");
  if (!scheduledStart || !scheduledEnd || scheduledEnd <= scheduledStart) {
    const error = new Error("scheduledStart and scheduledEnd are required and scheduledEnd must be after scheduledStart.");
    error.statusCode = 400;
    throw error;
  }

  const [userRows] = await db.pool.execute(
    `SELECT user_id FROM Users WHERE user_id = ? AND is_active = true LIMIT 1`,
    [userId]
  );
  if (userRows.length === 0) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const [existingShiftRows] = await db.pool.execute(
    `SELECT shift_id AS shiftId
     FROM Employee_Shift
     WHERE user_id = ?
       AND DATE(scheduled_start) = DATE(?)
     ORDER BY scheduled_start DESC
     LIMIT 1`,
    [userId, scheduledStart]
  );

  if (existingShiftRows.length > 0) {
    const shiftId = existingShiftRows[0].shiftId;
    await db.pool.execute(
      `UPDATE Employee_Shift
       SET scheduled_start = ?,
           scheduled_end = ?
       WHERE shift_id = ?`,
      [scheduledStart, scheduledEnd, shiftId]
    );

    return {
      shiftId,
      userId,
      scheduledStart,
      scheduledEnd,
      updated: true,
    };
  }

  const [result] = await db.pool.execute(
    `INSERT INTO Employee_Shift (user_id, scheduled_start, scheduled_end, tip_declared_amount)
     VALUES (?, ?, ?, 0.00)`,
    [userId, scheduledStart, scheduledEnd]
  );

  return {
    shiftId: result.insertId,
    userId,
    scheduledStart,
    scheduledEnd,
  };
}

async function updateLaborShift(shiftIdInput, payload = {}) {
  const shiftId = Number(shiftIdInput);
  if (!Number.isInteger(shiftId) || shiftId <= 0) {
    const error = new Error("shiftId must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  const [existingShiftRows] = await db.pool.execute(
    `SELECT
       shift_id AS shiftId,
       scheduled_start AS scheduledStart,
       scheduled_end AS scheduledEnd
     FROM Employee_Shift
     WHERE shift_id = ?
     LIMIT 1`,
    [shiftId]
  );

  if (existingShiftRows.length === 0) {
    const error = new Error("Labor shift not found.");
    error.statusCode = 404;
    throw error;
  }

  const existingShift = existingShiftRows[0];
  const updates = [];
  const params = [];
  let nextScheduledStart = normalizeOptionalDateTime(existingShift.scheduledStart, "scheduledStart");
  let nextScheduledEnd = normalizeOptionalDateTime(existingShift.scheduledEnd, "scheduledEnd");

  if (Object.hasOwn(payload, "userId")) {
    const userId = Number(payload.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      const error = new Error("userId must be a positive integer.");
      error.statusCode = 400;
      throw error;
    }

    const [userRows] = await db.pool.execute(
      `SELECT user_id FROM Users WHERE user_id = ? AND is_active = true LIMIT 1`,
      [userId]
    );
    if (userRows.length === 0) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    updates.push("user_id = ?");
    params.push(userId);
  }

  if (Object.hasOwn(payload, "scheduledStart")) {
    nextScheduledStart = normalizeOptionalDateTime(payload.scheduledStart, "scheduledStart");
    updates.push("scheduled_start = ?");
    params.push(nextScheduledStart);
  }

  if (Object.hasOwn(payload, "scheduledEnd")) {
    nextScheduledEnd = normalizeOptionalDateTime(payload.scheduledEnd, "scheduledEnd");
    updates.push("scheduled_end = ?");
    params.push(nextScheduledEnd);
  }

  if (Object.hasOwn(payload, "clockIn")) {
    updates.push("clock_in = ?");
    params.push(normalizeOptionalDateTime(payload.clockIn, "clockIn"));
  }

  if (Object.hasOwn(payload, "clockOut")) {
    updates.push("clock_out = ?");
    params.push(normalizeOptionalDateTime(payload.clockOut, "clockOut"));
  }

  if (Object.hasOwn(payload, "tipDeclaredAmount")) {
    const tipDeclaredAmount = normalizeOptionalNonNegativeNumber(payload.tipDeclaredAmount, "tipDeclaredAmount") ?? 0;
    updates.push("tip_declared_amount = ?");
    params.push(tipDeclaredAmount);
    updates.push("tip_declared_at = CASE WHEN ? IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END");
    params.push(payload.tipDeclaredAmount == null || payload.tipDeclaredAmount === "" ? null : tipDeclaredAmount);
  }

  if (updates.length === 0) {
    const error = new Error("At least one labor field is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!nextScheduledStart || !nextScheduledEnd || new Date(nextScheduledEnd) <= new Date(nextScheduledStart)) {
    const error = new Error("scheduledEnd must be after scheduledStart.");
    error.statusCode = 400;
    throw error;
  }

  params.push(shiftId);
  const [result] = await db.pool.execute(
    `UPDATE Employee_Shift
     SET ${updates.join(", ")}
     WHERE shift_id = ?`,
    params
  );
  return { shiftId, status: "updated" };
}

async function createInventoryItem(payload = {}) {
  const type = normalizeInventoryType(payload.type);
  const amountAvailable = normalizeNonNegativeInteger(payload.amountAvailable, "amountAvailable");
  const availabilityStatus = typeof payload.availabilityStatus === "boolean" ? payload.availabilityStatus : true;

  if (type === "utensils") {
    const utensilName = normalizeInventoryName(payload.inventoryItemName, "utensilName");
    const reorderThreshold = normalizeNonNegativeInteger(payload.reorderThreshold ?? 10, "reorderThreshold");

    await db.pool.execute(
      `INSERT INTO Utensil_Inventory (utensil_name, amount_available, reorder_threshold, availability_status)
       VALUES (?, ?, ?, ?)`,
      [utensilName, amountAvailable, reorderThreshold, availabilityStatus]
    );

    return {
      type,
      inventoryItemName: utensilName,
      amountAvailable,
      reorderThreshold,
      availabilityStatus,
    };
  }

  const inventoryItemName = normalizeInventoryName(payload.inventoryItemName);
  const menuItemId = Number(payload.menuItemId);
  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    const error = new Error("menuItemId must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  const menuRows = await db.query(
    `SELECT menu_item_id FROM Menu_Item WHERE menu_item_id = ? LIMIT 1`,
    [menuItemId]
  );
  if (menuRows.length === 0) {
    const error = new Error("Linked menu item was not found.");
    error.statusCode = 404;
    throw error;
  }

  await db.pool.execute(
    `INSERT INTO Inventory (inventory_item_name, amount_available, menu_item_id, availability_status)
     VALUES (?, ?, ?, ?)`,
    [inventoryItemName, amountAvailable, menuItemId, availabilityStatus]
  );

  return {
    type,
    inventoryItemName,
    amountAvailable,
    menuItemId,
    availabilityStatus,
  };
}

async function deleteInventoryItem(typeInput, inventoryItemNameInput) {
  const type = normalizeInventoryType(typeInput);
  const inventoryItemName = normalizeInventoryName(inventoryItemNameInput);

  if (type === "utensils") {
    const [result] = await db.pool.execute(
      `DELETE FROM Utensil_Inventory WHERE utensil_name = ?`,
      [inventoryItemName]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Inventory item not found.");
      error.statusCode = 404;
      throw error;
    }

    return { type, inventoryItemName };
  }

  await db.withTransaction(async (connection) => {
    await connection.execute(
      `DELETE FROM Manager_Notification WHERE inventory_item_name = ?`,
      [inventoryItemName]
    );

    const [result] = await connection.execute(
      `DELETE FROM Inventory WHERE inventory_item_name = ?`,
      [inventoryItemName]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Inventory item not found.");
      error.statusCode = 404;
      throw error;
    }
  });

  return { type, inventoryItemName };
}

async function updateInventoryItemAmount(typeInput, inventoryItemNameInput, amountAvailableInput) {
  const type = normalizeInventoryType(typeInput);
  const inventoryItemName = normalizeInventoryName(inventoryItemNameInput);
  const amountAvailable = normalizeNonNegativeInteger(amountAvailableInput, "amountAvailable");

  if (type === "utensils") {
    const [result] = await db.pool.execute(
      `UPDATE Utensil_Inventory SET amount_available = ? WHERE utensil_name = ?`,
      [amountAvailable, inventoryItemName]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Inventory item not found.");
      error.statusCode = 404;
      throw error;
    }

    return { type, inventoryItemName, amountAvailable };
  }

  const [result] = await db.pool.execute(
    `UPDATE Inventory SET amount_available = ? WHERE inventory_item_name = ?`,
    [amountAvailable, inventoryItemName]
  );

  if (result.affectedRows === 0) {
    const error = new Error("Inventory item not found.");
    error.statusCode = 404;
    throw error;
  }

  return { type, inventoryItemName, amountAvailable };
}

async function receivePurchasingStock(payload = {}) {
  const type = normalizeInventoryType(payload.type);
  const inventoryItemName = normalizeInventoryName(payload.inventoryItemName);
  const quantityReceived = normalizeNonNegativeInteger(payload.quantityReceived, "quantityReceived");

  if (quantityReceived <= 0) {
    const error = new Error("quantityReceived must be greater than zero.");
    error.statusCode = 400;
    throw error;
  }

  if (type === "utensils") {
    const [result] = await db.pool.execute(
      `UPDATE Utensil_Inventory
       SET amount_available = amount_available + ?,
           availability_status = TRUE
       WHERE utensil_name = ?`,
      [quantityReceived, inventoryItemName]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Inventory item not found.");
      error.statusCode = 404;
      throw error;
    }
  } else {
    const [result] = await db.pool.execute(
      `UPDATE Inventory
       SET amount_available = amount_available + ?,
           availability_status = TRUE
       WHERE inventory_item_name = ?`,
      [quantityReceived, inventoryItemName]
    );

    if (result.affectedRows === 0) {
      const error = new Error("Inventory item not found.");
      error.statusCode = 404;
      throw error;
    }
  }

  return { type, inventoryItemName, quantityReceived };
}

async function getBackOfficeData(range) {
  const filters = normalizeBackOfficeFilters(range);
  const settingsPromise = getBackOfficeSettings();
  const inventoryRowsPromise = db.query(
    `SELECT *
     FROM (
       SELECT
         i.inventory_item_name AS inventoryItemName,
         i.amount_available AS amountAvailable,
         i.availability_status AS availabilityStatus,
         i.menu_item_id AS menuItemId,
         mi.name AS linkedMenuItem,
         COALESCE(mi.category, 'Uncategorized') AS category,
         mi.base_price AS basePrice
       FROM Inventory i
       LEFT JOIN Menu_Item mi ON mi.menu_item_id = i.menu_item_id

       UNION ALL

       SELECT
         ui.utensil_name AS inventoryItemName,
         ui.amount_available AS amountAvailable,
         ui.availability_status AS availabilityStatus,
         NULL AS menuItemId,
         'Utensil Stock' AS linkedMenuItem,
         'Utensils' AS category,
         0.00 AS basePrice
       FROM Utensil_Inventory ui
     ) inventory_rows
     ORDER BY amountAvailable ASC, inventoryItemName ASC`
  );

  const inventoryUsagePromise = db.query(
    `SELECT *
     FROM (
       SELECT
         i.inventory_item_name AS inventoryItemName,
         COALESCE(SUM(CASE WHEN order_usage.inRange THEN order_usage.quantity ELSE 0 END), 0) AS unitsUsed,
         ROUND(COALESCE(SUM(CASE WHEN order_usage.inRange THEN order_usage.quantity * order_usage.price ELSE 0 END), 0), 2) AS revenue,
         COUNT(DISTINCT CASE WHEN order_usage.inRange THEN order_usage.orderKey ELSE NULL END) AS orderCount
       FROM Inventory i
       LEFT JOIN (
         SELECT
           CONCAT('pos-', oi.order_id) AS orderKey,
           oi.menu_item_id AS menuItemId,
           oi.quantity,
           oi.price,
           (${rangeFilter(filters, "o.created_at")}) AS inRange
         FROM Order_Item oi
         JOIN Orders o ON o.order_id = oi.order_id
         WHERE o.status <> 'Void'

         UNION ALL

         SELECT
           CONCAT('online-', ooi.online_order_id) AS orderKey,
           ooi.menu_item_id AS menuItemId,
           ooi.quantity,
           ooi.price,
           (${rangeFilter(filters, "oo.created_at")}) AS inRange
         FROM Online_Order_Item ooi
         JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
       ) order_usage ON order_usage.menuItemId = i.menu_item_id
       GROUP BY i.inventory_item_name

       UNION ALL

       SELECT
         ui.utensil_name AS inventoryItemName,
         0 AS unitsUsed,
         0.00 AS revenue,
         0 AS orderCount
       FROM Utensil_Inventory ui
     ) usage_rows
     ORDER BY unitsUsed DESC, revenue DESC, inventoryItemName ASC`
  );

  const inventoryUpdateStatsPromise = db.query(
    `SELECT MAX(createdAt) AS lastOrderAt
     FROM (
       SELECT created_at AS createdAt FROM Orders
       UNION ALL
       SELECT created_at AS createdAt FROM Online_Orders
     ) all_orders`
  );

  const laborRowsPromise = db.query(
    `SELECT
       es.shift_id AS shiftId,
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
     WHERE ${rangeFilter(filters, "es.scheduled_start")}
     ORDER BY es.scheduled_start DESC, u.name ASC`
  );

  const weeklyLaborRowsPromise = db.query(
    `SELECT
       u.user_id AS userId,
       u.name,
       u.role,
       es.clock_in AS clockIn,
       es.clock_out AS clockOut
     FROM Employee_Shift es
     JOIN Users u ON u.user_id = es.user_id
     WHERE ${currentWeekFilter("es.scheduled_start")}
     ORDER BY u.name ASC, es.scheduled_start DESC`
  );

  const menuItemsPromise = db.query(
    `SELECT menu_item_id AS menuItemId, name, COALESCE(category, 'Uncategorized') AS category,
            base_price AS basePrice, description, photo_url AS photoUrl,
            common_allergens AS commonAllergens, is_active AS isActive
     FROM Menu_Item
     ORDER BY is_active DESC, name ASC`
  );

  const modifiersPromise = db.query(
    `SELECT modifier_id AS modifierId, name, price, is_active AS isActive
     FROM Modifier
     ORDER BY is_active DESC, name ASC`
  );

  const recentOrdersPromise = db.query(
    `SELECT *
     FROM (
       SELECT
         o.order_id AS orderId,
         COALESCE(o.receipt_number, CONCAT('Order #', o.order_id)) AS receiptNumber,
         dt.table_number AS tableNumber,
         u.name AS employeeName,
         o.total,
         o.status,
         o.void_reason AS voidReason,
         NULL AS customerStatus,
         NULL AS paymentStatus,
         o.created_at AS createdAt,
         'In Store' AS channel
       FROM Orders o
       LEFT JOIN Dining_Tables dt ON dt.table_id = o.table_id
       LEFT JOIN Users u ON u.user_id = o.created_by
       WHERE ${rangeFilter(filters, "o.created_at")}

       UNION ALL

       SELECT
         oo.online_order_id AS orderId,
         CONCAT('Online #', oo.online_order_id) AS receiptNumber,
         'Online' AS tableNumber,
         CONCAT(oo.first_name, ' ', oo.last_name) AS employeeName,
         oo.total,
         CASE
           WHEN oo.customer_status IN ('canceled', 'denied') THEN 'Canceled'
           WHEN oo.customer_status = 'picked_up' THEN 'Picked Up'
           WHEN oo.payment_status = 'paid' THEN 'Paid Online'
           ELSE CONCAT(UPPER(LEFT(oo.customer_status, 1)), SUBSTRING(oo.customer_status, 2))
         END AS status,
         NULL AS voidReason,
         oo.customer_status AS customerStatus,
         oo.payment_status AS paymentStatus,
         oo.created_at AS createdAt,
         'Online' AS channel
       FROM Online_Orders oo
       WHERE ${rangeFilter(filters, "oo.created_at")}
     ) combined_orders
     ORDER BY createdAt DESC
     LIMIT 12`
  );

  const activeOrdersPromise = db.query(
    `SELECT *
     FROM (
       SELECT
         o.order_id AS orderId,
         COALESCE(o.receipt_number, CONCAT('Order #', o.order_id)) AS receiptNumber,
         dt.table_number AS tableNumber,
         u.name AS employeeName,
         o.total,
         o.status,
         o.void_reason AS voidReason,
         NULL AS customerStatus,
         NULL AS paymentStatus,
         o.created_at AS createdAt,
         'In Store' AS channel
       FROM Orders o
       LEFT JOIN Dining_Tables dt ON dt.table_id = o.table_id
       LEFT JOIN Users u ON u.user_id = o.created_by
       WHERE o.status IN ('Open', 'Sent', 'Completed')

       UNION ALL

       SELECT
         oo.online_order_id AS orderId,
         CONCAT('Online #', oo.online_order_id) AS receiptNumber,
         'Online' AS tableNumber,
         CONCAT(oo.first_name, ' ', oo.last_name) AS employeeName,
         oo.total,
         CASE
           WHEN oo.customer_status IN ('canceled', 'denied') THEN 'Canceled'
           WHEN oo.customer_status = 'picked_up' THEN 'Picked Up'
           WHEN oo.payment_status = 'paid' THEN 'Paid Online'
           ELSE CONCAT(UPPER(LEFT(oo.customer_status, 1)), SUBSTRING(oo.customer_status, 2))
         END AS status,
         NULL AS voidReason,
         oo.customer_status AS customerStatus,
         oo.payment_status AS paymentStatus,
         oo.created_at AS createdAt,
         'Online' AS channel
       FROM Online_Orders oo
       WHERE oo.customer_status NOT IN ('picked_up', 'canceled', 'denied')
     ) active_orders
     ORDER BY createdAt DESC`
  );

  const refundCountsPromise = db.query(
    `SELECT COUNT(*) AS refundCount
     FROM Payment
     WHERE status = 'refunded'
       AND ${rangeFilter(filters, "paid_at")}`
  );

  const customerRowsPromise = db.query(
    `SELECT
       customer_num_id AS customerId,
       first_name AS firstName,
       last_name AS lastName,
       email,
       phone_number AS phoneNumber,
       points_balance AS pointsBalance,
       is_active AS isActive
     FROM Customer
     ORDER BY is_active DESC, points_balance DESC, customer_num_id ASC`
  );

  const userCountsPromise = db.query(
    `SELECT role, COUNT(*) AS count
     FROM Users
     GROUP BY role`
  );

  const [settingsData, inventoryRows, inventoryUsageRows, inventoryUpdateStatsRows, laborRows, weeklyLaborRows, menuItems, modifiers, recentOrders, activeOrders, refundCountsRows, customerRows, userCountsRows] =
    await Promise.all([
      settingsPromise,
      inventoryRowsPromise,
      inventoryUsagePromise,
      inventoryUpdateStatsPromise,
      laborRowsPromise,
      weeklyLaborRowsPromise,
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
    category: normalizeCategory(row.category),
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
      category: normalizeCategory(row.category),
      priority: row.status,
      estimatedCost: Number((Math.max(12 - row.amountAvailable, 1) * Math.max(row.basePrice || 1, 1)).toFixed(2)),
    }))
    .sort((a, b) => a.currentOnHand - b.currentOnHand);

  const weeklyHoursByEmployee = new Map();
  for (const row of weeklyLaborRows) {
    const existing = weeklyHoursByEmployee.get(row.userId) ?? {
      userId: row.userId,
      name: row.name,
      role: row.role,
      hoursWorkedThisWeek: 0,
    };
    const workedHours = row.clockIn ? hoursBetween(row.clockIn, row.clockOut ?? new Date().toISOString()) : 0;
    existing.hoursWorkedThisWeek += workedHours;
    weeklyHoursByEmployee.set(row.userId, existing);
  }

  const weeklyHourRows = [...weeklyHoursByEmployee.values()]
    .map((row) => ({
      ...row,
      hoursWorkedThisWeek: Number(row.hoursWorkedThisWeek.toFixed(1)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
      hoursWorkedThisWeek: weeklyHoursByEmployee.get(row.userId)?.hoursWorkedThisWeek
        ? Number(weeklyHoursByEmployee.get(row.userId).hoursWorkedThisWeek.toFixed(1))
        : 0,
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
  const hoursWorkedThisWeek = weeklyHourRows.reduce((sum, row) => sum + row.hoursWorkedThisWeek, 0);
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

  const paidOrders = recentOrders.filter((row) => row.status === "Paid" || row.status === "Paid Online").length;
  const voidOrders = recentOrders.filter((row) => row.status === "Void").length;

  const userRoleCounts = Object.fromEntries(userCountsRows.map((row) => [row.role, Number(row.count ?? 0)]));
  const totalPoints = customerRows.reduce((sum, row) => sum + Number(row.pointsBalance ?? 0), 0);
  const averagePoints = customerRows.length ? totalPoints / customerRows.length : 0;
  const orderRowsForItems = [...activeOrders, ...recentOrders];
  const inStoreOrderIds = [...new Set(orderRowsForItems.filter((row) => row.channel === "In Store").map((row) => row.orderId))];
  const onlineOrderIds = [...new Set(orderRowsForItems.filter((row) => row.channel === "Online").map((row) => row.orderId))];
  const itemsByOrderKey = {};

  if (inStoreOrderIds.length > 0) {
    const placeholders = inStoreOrderIds.map(() => "?").join(",");
    const itemRows = await db.query(
      `SELECT oi.order_id AS orderId, mi.name, oi.quantity, oi.price
       FROM Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.order_id ASC, mi.name ASC`,
      inStoreOrderIds
    );

    for (const item of itemRows) {
      const key = `In Store:${item.orderId}`;
      if (!itemsByOrderKey[key]) itemsByOrderKey[key] = [];
      itemsByOrderKey[key].push({ name: item.name, quantity: Number(item.quantity), price: Number(item.price) });
    }
  }

  if (onlineOrderIds.length > 0) {
    const placeholders = onlineOrderIds.map(() => "?").join(",");
    const itemRows = await db.query(
      `SELECT oi.online_order_id AS orderId, mi.name, oi.quantity, oi.price
       FROM Online_Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       WHERE oi.online_order_id IN (${placeholders})
       ORDER BY oi.online_order_id ASC, mi.name ASC`,
      onlineOrderIds
    );

    for (const item of itemRows) {
      const key = `Online:${item.orderId}`;
      if (!itemsByOrderKey[key]) itemsByOrderKey[key] = [];
      itemsByOrderKey[key].push({ name: item.name, quantity: Number(item.quantity), price: Number(item.price) });
    }
  }

  const mapOrderRow = (row) => ({
    orderId: row.orderId,
    receiptNumber: row.receiptNumber,
    tableNumber: row.tableNumber ?? "—",
    employeeName: row.employeeName ?? "Unknown",
    total: Number(row.total ?? 0),
    status: row.status,
    voidReason: row.voidReason ?? "",
    customerStatus: row.customerStatus,
    paymentStatus: row.paymentStatus,
    channel: row.channel,
    createdAt: formatDateTime(row.createdAt),
    items: itemsByOrderKey[`${row.channel}:${row.orderId}`] ?? [],
  });

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
        { title: "Hours This Week", value: hoursWorkedThisWeek.toFixed(1) },
        { title: "Tips Pending", value: String(tipsPending) },
      ],
      employees: laborEmployees,
      weeklyHours: weeklyHourRows,
      shifts: laborRows.map((row) => ({
        shiftId: row.shiftId,
        userId: row.userId,
        name: row.name,
        role: row.role,
        scheduledStart: row.scheduledStart,
        scheduledEnd: row.scheduledEnd,
        clockIn: row.clockIn,
        clockOut: row.clockOut,
        tipDeclaredAmount: Number(row.tipDeclaredAmount ?? 0),
      })),
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
        category: normalizeCategory(row.category),
        basePrice: Number(row.basePrice ?? 0),
        description: row.description ?? "",
        photoUrl: row.photoUrl ?? "",
        commonAllergens: row.commonAllergens ?? "",
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
      activeOrders: activeOrders.map(mapOrderRow),
      recentOrders: recentOrders.map(mapOrderRow),
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
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phoneNumber: row.phoneNumber,
        pointsBalance: Number(row.pointsBalance ?? 0),
        isActive: row.isActive,
      })),
    },
    settings: {
      summaryCards: [
        { title: "Manager Accounts", value: String(userRoleCounts.manager ?? 0) },
        { title: "Kitchen Accounts", value: String(userRoleCounts.kitchen ?? 0) },
        { title: "Server Accounts", value: String(userRoleCounts.employee ?? 0) },
        { title: "Persisted Settings", value: String(settingsData.persistedCount) },
      ],
      values: settingsData.settings,
      metadata: settingsData.metadata,
      notes: ["Configuration values are manager-managed via Back_Office_Settings."],
    },
  };
}

async function getCustomerOrders(customerIdInput) {
  const customerId = Number(customerIdInput);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw { status: 400, message: "Invalid customer ID." };
  }

  const customerRows = await db.query(
    `SELECT customer_num_id AS customerId, first_name AS firstName, last_name AS lastName,
            email, phone_number AS phoneNumber, points_balance AS pointsBalance
     FROM Customer WHERE customer_num_id = ? LIMIT 1`,
    [customerId]
  );
  if (customerRows.length === 0) throw { status: 404, message: "Customer not found." };

  const orderRows = await db.query(
    `SELECT oo.online_order_id AS orderId, oo.created_at AS createdAt,
            oo.total, oo.customer_status AS status,
            oo.payment_preference AS paymentPreference
     FROM Online_Orders oo
     WHERE oo.customer_num_id = ?
     ORDER BY oo.created_at DESC
     LIMIT 50`,
    [customerId]
  );

  const orderIds = orderRows.map((o) => o.orderId);
  let itemsByOrder = {};
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => "?").join(",");
    const itemRows = await db.query(
      `SELECT oi.online_order_id AS orderId, mi.name, oi.quantity, oi.price
       FROM Online_Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       WHERE oi.online_order_id IN (${placeholders})`,
      orderIds
    );
    for (const item of itemRows) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
      itemsByOrder[item.orderId].push({ name: item.name, quantity: item.quantity, price: Number(item.price) });
    }
  }

  return {
    customer: customerRows[0],
    orders: orderRows.map((o) => ({
      orderId: o.orderId,
      createdAt: o.createdAt,
      total: Number(o.total),
      status: o.status,
      paymentPreference: o.paymentPreference,
      items: itemsByOrder[o.orderId] ?? [],
    })),
  };
}

async function getReservations({ status, date } = {}) {
  const conditions = [];
  const params = [];

  if (status && status !== "all") {
    conditions.push("cr.status = ?");
    params.push(status);
  }

  if (date) {
    conditions.push("DATE(cr.reservation_date) = ?");
    params.push(date);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return db.query(
    `SELECT
       cr.reservation_id AS reservationId,
       DATE_FORMAT(cr.reservation_date, '%Y-%m-%d') AS date,
       TIME_FORMAT(cr.reservation_time, '%H:%i') AS time,
       cr.party_size AS partySize,
       cr.phone,
       cr.occasion,
       cr.notes,
       cr.status,
       cr.created_at AS createdAt,
       c.first_name AS firstName,
       c.last_name AS lastName,
       c.email
     FROM Customer_Reservation cr
     JOIN Customer c ON c.customer_num_id = cr.customer_num_id
     ${where}
     ORDER BY cr.reservation_date ASC, cr.reservation_time ASC`,
    params
  );
}

async function confirmReservation(reservationId) {
  const id = Number(reservationId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid reservation ID.");
    error.statusCode = 400;
    throw error;
  }

  const rows = await db.query(
    `SELECT reservation_id AS reservationId, reservation_date AS date, reservation_time AS time,
            party_size AS partySize, status
     FROM Customer_Reservation WHERE reservation_id = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Reservation not found.");
    error.statusCode = 404;
    throw error;
  }

  const reservation = rows[0];

  if (reservation.status !== "requested") {
    const error = new Error(`Cannot confirm a reservation with status '${reservation.status}'.`);
    error.statusCode = 409;
    throw error;
  }

  const [capacityRows, bookedRows] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(capacity), 0) AS totalCapacity
       FROM Dining_Tables
       WHERE status != 'Inactive'`
    ),
    db.query(
      `SELECT COALESCE(SUM(party_size), 0) AS bookedSeats
       FROM Customer_Reservation
       WHERE reservation_date = ?
         AND reservation_time = ?
         AND status = 'confirmed'
         AND reservation_id != ?`,
      [reservation.date, reservation.time, id]
    ),
  ]);

  const totalCapacity = Number(capacityRows[0]?.totalCapacity ?? 0);
  const bookedSeats = Number(bookedRows[0]?.bookedSeats ?? 0);

  if (bookedSeats + reservation.partySize > totalCapacity) {
    const error = new Error(
      `That time slot is full. ${bookedSeats} of ${totalCapacity} seats are already booked.`
    );
    error.statusCode = 409;
    throw error;
  }

  await db.query(
    `UPDATE Customer_Reservation SET status = 'confirmed' WHERE reservation_id = ?`,
    [id]
  );

  return { reservationId: id, status: "confirmed" };
}

async function cancelReservation(reservationId) {
  const id = Number(reservationId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid reservation ID.");
    error.statusCode = 400;
    throw error;
  }

  const rows = await db.query(
    `SELECT reservation_id AS reservationId, status FROM Customer_Reservation WHERE reservation_id = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Reservation not found.");
    error.statusCode = 404;
    throw error;
  }

  if (rows[0].status === "cancelled") {
    const error = new Error("Reservation is already cancelled.");
    error.statusCode = 409;
    throw error;
  }

  await db.query(
    `UPDATE Customer_Reservation SET status = 'cancelled' WHERE reservation_id = ?`,
    [id]
  );

  return { reservationId: id, status: "cancelled" };
}

export {
  createLaborShift,
  createInventoryItem,
  deleteInventoryItem,
  getBackOfficeDashboard,
  getBackOfficeData,
  getCustomerOrders,
  getReservations,
  confirmReservation,
  cancelReservation,
  receivePurchasingStock,
  updateLaborShift,
  updateInventoryItemAmount,
};
