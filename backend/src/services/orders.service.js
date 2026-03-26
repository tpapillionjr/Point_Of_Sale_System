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

async function createOrder(payload) {
  const order = validateOrderPayload(payload);

  return db.withTransaction(async (connection) => {
    const user = await ensureUserExists(connection, order.createdBy);
    await ensureTableAvailable(connection, order.tableId);
    await ensureTableCanBeReseated(connection, order.tableId);

    if (user.role === "employee" && order.discountAmount > 0) {
      throw createValidationError("Servers cannot apply discounts.");
    }

    const itemIds = [...new Set(order.items.map((item) => item.menuItemId))];
    const menuItems = await fetchMenuItems(connection, itemIds);
    const inventoryRows = await fetchInventoryRows(connection, itemIds);
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
        order_channel,
        guest_count,
        is_split_check,
        subtotal,
        discount_amount,
        tax,
        service_charge,
        total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.tableId,
        order.createdBy,
        order.receiptNumber,
        order.orderNote,
        order.orderType,
        order.orderChannel,
        order.guestCount,
        order.isSplitCheck,
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

    await connection.execute(
      `UPDATE Dining_Tables
       SET status = CASE
         WHEN status = 'available' THEN 'occupied'
         ELSE status
       END
       WHERE table_id = ?`,
      [order.tableId]
    );

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
      `SELECT order_id, table_id, status
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

  if (!Number.isInteger(parsedTableNumber) || parsedTableNumber <= 0) {
    throw createValidationError("tableNumber must be a positive integer.");
  }

  const rows = await db.query(
    `SELECT
      o.order_id AS orderId,
      o.table_id AS tableId,
      dt.table_number AS tableNumber,
      o.status
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

  return rows[0];
}

export { createOrder, cancelOrder, findActiveOrderByTableNumber };
