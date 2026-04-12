import db from "../db/index.js";
import { createValidationError, validateOrderPayload } from "../validation/business-rules.js";

async function ensureUserExists(connection, userId) {
  const [rows] = await connection.execute(
    "SELECT user_id, role, is_active FROM Users WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (rows.length === 0) {
    throw createValidationError("createdBy user does not exist.");
  }

  if (!rows[0].is_active) {
    throw createValidationError("createdBy user must be active.");
  }

  return rows[0];
}

async function ensureTableAvailable(connection, tableId) {
  const [rows] = await connection.execute(
    "SELECT table_id, status FROM Dining_Tables WHERE table_id = ? LIMIT 1",
    [tableId]
  );

  if (rows.length === 0) {
    throw createValidationError("tableId does not exist.");
  }

  if (rows[0].status === "inactive") {
    throw createValidationError("Selected dining table is inactive.");
  }
}

async function ensureTableCanBeReseated(connection, tableId) {
  const [rows] = await connection.execute(
    `SELECT order_id
     FROM Orders
     WHERE table_id = ?
       AND status IN ('Open', 'Sent', 'Completed')
     LIMIT 1`,
    [tableId]
  );

  if (rows.length > 0) {
    throw createValidationError("Table must be closed before reseating.");
  }
}

async function fetchMenuItems(connection, itemIds) {
  const placeholders = itemIds.map(() => "?").join(", ");
  const [rows] = await connection.execute(
    `SELECT menu_item_id, name, is_active
     FROM Menu_Item
     WHERE menu_item_id IN (${placeholders})`,
    itemIds
  );

  return new Map(rows.map((row) => [row.menu_item_id, row]));
}

async function fetchInventoryRows(connection, itemIds) {
  const placeholders = itemIds.map(() => "?").join(", ");
  const [rows] = await connection.execute(
    `SELECT inventory_item_name, menu_item_id, amount_available, availability_status
     FROM Inventory
     WHERE menu_item_id IN (${placeholders})
     FOR UPDATE`,
    itemIds
  );

  return new Map(rows.map((row) => [row.menu_item_id, row]));
}

async function fetchUtensilRow(connection, utensilName) {
  const [rows] = await connection.execute(
    `SELECT utensil_id, utensil_name, amount_available, availability_status
     FROM Utensil_Inventory
     WHERE utensil_name = ?
     LIMIT 1
     FOR UPDATE`,
    [utensilName]
  );

  return rows[0] ?? null;
}

async function createOrder(payload) {
  const order = validateOrderPayload(payload);

  return db.withTransaction(async (connection) => {
    const user = await ensureUserExists(connection, order.createdBy);
    const isTakeoutTable = order.tableId === 10000;
    await ensureTableAvailable(connection, order.tableId);
    if (!isTakeoutTable) {
      await ensureTableCanBeReseated(connection, order.tableId);
    }

    if (user.role === "employee" && order.discountAmount > 0) {
      throw createValidationError("Servers cannot apply discounts.");
    }

    const itemIds = [...new Set(order.items.map((item) => item.menuItemId))];
    const menuItems = await fetchMenuItems(connection, itemIds);
    const inventoryRows = await fetchInventoryRows(connection, itemIds);
    const requiresToGoUtensils = order.orderType === "Takeout" || order.orderType === "Delivery";
    const toGoUtensilQty = Math.max(order.guestCount, 1);
    const toGoUtensilRow = requiresToGoUtensils
      ? await fetchUtensilRow(connection, "To-Go Utensil Kits")
      : null;
    const issues = [];

    for (const item of order.items) {
      const menuItem = menuItems.get(item.menuItemId);
      if (!menuItem) {
        issues.push(`Menu item ${item.menuItemId} does not exist.`);
        continue;
      }

      if (!menuItem.is_active) {
        issues.push(`Menu item ${menuItem.name} is inactive.`);
      }

      const inventory = inventoryRows.get(item.menuItemId);
      if (!inventory) {
        issues.push(`Inventory is not configured for menu item ${menuItem.name}.`);
        continue;
      }

      if (!inventory.availability_status) {
        issues.push(`Inventory item ${inventory.inventory_item_name} is unavailable.`);
      }

      if (inventory.amount_available < item.quantity) {
        issues.push(
          `Not enough inventory for ${menuItem.name}. Requested ${item.quantity}, available ${inventory.amount_available}.`
        );
      }
    }

    if (requiresToGoUtensils) {
      if (!toGoUtensilRow) {
        issues.push("Utensil inventory is not configured for To-Go Utensil Kits.");
      } else {
        if (!toGoUtensilRow.availability_status) {
          issues.push("To-Go Utensil Kits are unavailable.");
        }

        if (toGoUtensilRow.amount_available < toGoUtensilQty) {
          issues.push(
            `Not enough To-Go Utensil Kits. Requested ${toGoUtensilQty}, available ${toGoUtensilRow.amount_available}.`
          );
        }
      }
    }

    if (issues.length > 0) {
      throw createValidationError("Order validation failed.", issues);
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO Orders (
        table_id,
        created_by,
        receipt_number,
        order_note,
        order_type,
        guest_count,
        is_split_check,
        takeout_name,
        takeout_phone,
        subtotal,
        discount_amount,
        tax,
        service_charge,
        total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.tableId,
        order.createdBy,
        order.receiptNumber,
        order.orderNote,
        order.orderType,
        order.guestCount,
        order.isSplitCheck,
        order.takeoutName,
        order.takeoutPhone,
        order.subtotal,
        order.discountAmount,
        order.tax,
        order.serviceCharge,
        order.total,
      ]
    );

    for (const item of order.items) {
      await connection.execute(
        `INSERT INTO Order_Item (order_id, menu_item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderResult.insertId, item.menuItemId, item.quantity, item.price]
      );

      await connection.execute(
        `UPDATE Inventory
         SET amount_available = amount_available - ?,
             availability_status = CASE
               WHEN amount_available - ? > 0 THEN TRUE
               ELSE FALSE
             END
         WHERE menu_item_id = ?`,
        [item.quantity, item.quantity, item.menuItemId]
      );
    }

    if (requiresToGoUtensils) {
      await connection.execute(
        `UPDATE Utensil_Inventory
         SET amount_available = amount_available - ?,
             availability_status = CASE
               WHEN amount_available - ? > 0 THEN TRUE
               ELSE FALSE
             END
         WHERE utensil_name = ?`,
        [toGoUtensilQty, toGoUtensilQty, "To-Go Utensil Kits"]
      );
    }

    if (!isTakeoutTable) {
      await connection.execute(
        `UPDATE Dining_Tables
         SET status = CASE
           WHEN status = 'available' THEN 'occupied'
           ELSE status
         END
         WHERE table_id = ?`,
        [order.tableId]
      );
    }

    await connection.execute(
      `INSERT INTO Kitchen_Ticket (order_id, table_id, status, created_at, updated_at)
       VALUES (?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [orderResult.insertId, order.tableId]
    );

    return {
      orderId: orderResult.insertId,
      ...order,
    };
  });
}

async function addItemsToOrder(orderId, items, userId) {
  if (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
    throw createValidationError("orderId must be a positive integer.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw createValidationError("At least one item is required.");
  }

  return db.withTransaction(async (connection) => {
    await ensureUserExists(connection, userId);

    const [orderRows] = await connection.execute(
      `SELECT order_id, table_id, status, subtotal, discount_amount, tax, service_charge, total
       FROM Orders
       WHERE order_id = ? LIMIT 1`,
      [orderId]
    );

    if (orderRows.length === 0) {
      throw createValidationError("Order not found.");
    }

    const order = orderRows[0];

    if (!["Open", "Sent", "Completed"].includes(order.status)) {
      throw createValidationError("Cannot add items to a closed or voided order.");
    }

    const itemIds = [...new Set(items.map((i) => i.menuItemId))];
    const menuItems = await fetchMenuItems(connection, itemIds);
    const inventoryRows = await fetchInventoryRows(connection, itemIds);
    const issues = [];

    for (const item of items) {
      const menuItem = menuItems.get(item.menuItemId);
      if (!menuItem) { issues.push(`Menu item ${item.menuItemId} does not exist.`); continue; }
      if (!menuItem.is_active) { issues.push(`Menu item ${menuItem.name} is inactive.`); }
      const inventory = inventoryRows.get(item.menuItemId);
      if (!inventory) { issues.push(`Inventory not configured for ${menuItem.name}.`); continue; }
      if (!inventory.availability_status) { issues.push(`${inventory.inventory_item_name} is unavailable.`); }
      if (inventory.amount_available < item.quantity) {
        issues.push(`Not enough inventory for ${menuItem.name}. Requested ${item.quantity}, available ${inventory.amount_available}.`);
      }
    }

    if (issues.length > 0) {
      throw createValidationError("Order validation failed.", issues);
    }

    let addedSubtotal = 0;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO Order_Item (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.menuItemId, item.quantity, item.price]
      );

      await connection.execute(
        `UPDATE Inventory
         SET amount_available = amount_available - ?,
             availability_status = CASE WHEN amount_available - ? > 0 THEN TRUE ELSE FALSE END
         WHERE menu_item_id = ?`,
        [item.quantity, item.quantity, item.menuItemId]
      );

      addedSubtotal += item.price * item.quantity;
    }

    const newSubtotal = Number(order.subtotal) + addedSubtotal;
    const newTotal = newSubtotal - Number(order.discount_amount) + Number(order.tax) + Number(order.service_charge);

    await connection.execute(
      `UPDATE Orders SET subtotal = ?, total = ? WHERE order_id = ?`,
      [newSubtotal.toFixed(2), newTotal.toFixed(2), orderId]
    );

    await connection.execute(
      `INSERT INTO Kitchen_Ticket (order_id, table_id, status, created_at, updated_at)
       VALUES (?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [orderId, order.table_id]
    );

    return { orderId: Number(orderId), addedItems: items.length, newTotal: newTotal.toFixed(2) };
  });
}

async function cancelOrder(payload) {
  const orderId = Number.parseInt(payload?.orderId, 10);
  const voidedBy = Number.parseInt(payload?.voidedBy, 10);
  const voidReason = payload?.voidReason?.trim() || "Manager canceled order";

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createValidationError("orderId must be a positive integer.");
  }

  if (!Number.isInteger(voidedBy) || voidedBy <= 0) {
    throw createValidationError("voidedBy must be a positive integer.");
  }

  return db.withTransaction(async (connection) => {
    const user = await ensureUserExists(connection, voidedBy);
    if (user.role !== "manager") {
      throw createValidationError("Only managers can cancel an order.");
    }

    const [orderRows] = await connection.execute(
      `SELECT order_id, table_id, status, order_type, guest_count
       FROM Orders
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (orderRows.length === 0) {
      throw createValidationError("Order not found.");
    }

    if (orderRows[0].status === "Paid") {
      throw createValidationError("Paid orders cannot be canceled from this screen.");
    }

    if (orderRows[0].status === "Void") {
      throw createValidationError("Order is already voided.");
    }

    const [orderItemRows] = await connection.execute(
      `SELECT menu_item_id, quantity
       FROM Order_Item
       WHERE order_id = ?`,
      [orderId]
    );

    for (const item of orderItemRows) {
      await connection.execute(
        `UPDATE Inventory
         SET amount_available = amount_available + ?,
             availability_status = TRUE
         WHERE menu_item_id = ?`,
        [item.quantity, item.menu_item_id]
      );
    }

    if (orderRows[0].order_type === "Takeout" || orderRows[0].order_type === "Delivery") {
      const toGoUtensilQty = Math.max(Number(orderRows[0].guest_count ?? 1), 1);
      await connection.execute(
        `UPDATE Utensil_Inventory
         SET amount_available = amount_available + ?,
             availability_status = TRUE
         WHERE utensil_name = ?`,
        [toGoUtensilQty, "To-Go Utensil Kits"]
      );
    }

    await connection.execute(
      `UPDATE Orders
       SET status = 'Void',
           void_reason = ?,
           voided_by = ?,
           closed_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [voidReason, voidedBy, orderId]
    );

    const [activeRows] = await connection.execute(
      `SELECT order_id
       FROM Orders
       WHERE table_id = ?
         AND status IN ('Open', 'Sent', 'Completed')
       LIMIT 1`,
      [orderRows[0].table_id]
    );

    if (activeRows.length === 0) {
      await connection.execute(
        `UPDATE Dining_Tables
         SET status = 'available'
         WHERE table_id = ?`,
        [orderRows[0].table_id]
      );
    }

    return {
      orderId,
      tableId: orderRows[0].table_id,
      status: "Void",
      voidReason,
    };
  });
}

async function findActiveOrderByTableNumber(tableNumber) {
  const parsedTableNumber = Number.parseInt(tableNumber, 10);

  if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 0) {
    throw createValidationError("tableNumber must be a non-negative integer.");
  }

  const rows = await db.query(
    `SELECT
      o.order_id AS orderId,
      o.table_id AS tableId,
      dt.table_number AS tableNumber,
      o.status,
      o.subtotal,
      o.tax,
      o.total,
      o.takeout_name AS takeoutName,
      o.takeout_phone AS takeoutPhone,
      o.created_at AS createdAt
     FROM Orders o
     JOIN Dining_Tables dt ON dt.table_id = o.table_id
     WHERE dt.table_number = ?
       AND o.status IN ('Open', 'Sent', 'Completed')
     ORDER BY o.created_at DESC
     LIMIT 1`,
    [parsedTableNumber]
  );

  if (rows.length === 0) {
    throw createValidationError("No active backend order was found for that table.");
  }

  const order = rows[0];

  const itemRows = await db.query(
    `SELECT
      oi.order_item_id AS orderItemId,
      mi.menu_item_id AS menuItemId,
      mi.name,
      oi.quantity,
      oi.price
     FROM Order_Item oi
     JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
     WHERE oi.order_id = ?
     ORDER BY oi.order_item_id ASC`,
    [order.orderId]
  );

  return { ...order, items: itemRows };
}

async function getActiveTakeoutOrders() {
  const rows = await db.query(
    `SELECT
      o.order_id AS orderId,
      o.takeout_name AS takeoutName,
      o.takeout_phone AS takeoutPhone,
      o.status,
      o.total,
      o.created_at AS createdAt,
      kt.status AS kitchenStatus
     FROM Orders o
     LEFT JOIN Kitchen_Ticket kt ON kt.order_id = o.order_id
     WHERE o.table_id = 10000
       AND o.status IN ('Open', 'Sent', 'Completed')
     ORDER BY o.created_at ASC`
  );

  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.orderId);
  const placeholders = orderIds.map(() => "?").join(", ");
  const itemRows = await db.query(
    `SELECT oi.order_id AS orderId, mi.name, oi.quantity, oi.price
     FROM Order_Item oi
     JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
     WHERE oi.order_id IN (${placeholders})
     ORDER BY oi.order_item_id ASC`,
    orderIds
  );

  const itemsByOrder = {};
  for (const item of itemRows) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(item);
  }

  return rows.map((r) => ({ ...r, items: itemsByOrder[r.orderId] ?? [] }));
}

export { createOrder, addItemsToOrder, cancelOrder, findActiveOrderByTableNumber, getActiveTakeoutOrders };
