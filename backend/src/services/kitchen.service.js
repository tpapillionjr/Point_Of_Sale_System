import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

async function getActiveTickets() {
  return db.query(
    `SELECT
      kt.ticket_id AS ticketId,
      kt.order_id AS orderId,
      kt.online_order_id AS onlineOrderId,
      CASE WHEN kt.online_order_id IS NOT NULL THEN 'Online' ELSE dt.table_number END AS tableNumber,
      o.takeout_name AS takeoutName,
      kt.status,
      kt.created_at AS createdAt,
      kt.updated_at AS updatedAt,
      GREATEST(TIMESTAMPDIFF(SECOND, kt.created_at, CURRENT_TIMESTAMP), 0) AS ageSeconds,
      CASE
        WHEN kt.online_order_id IS NOT NULL THEN
          GROUP_CONCAT(CONCAT(mi.name, ' x', ooi.quantity) ORDER BY ooi.online_order_item_id SEPARATOR '||')
        ELSE
          GROUP_CONCAT(CONCAT(mi.name, ' x', oi.quantity) ORDER BY oi.order_item_id SEPARATOR '||')
      END AS items
     FROM Kitchen_Ticket kt
     LEFT JOIN Orders o ON o.order_id = kt.order_id
     LEFT JOIN Online_Orders oo ON oo.online_order_id = kt.online_order_id
     LEFT JOIN Dining_Tables dt ON dt.table_id = kt.table_id
     LEFT JOIN Order_Item oi ON oi.order_id = o.order_id AND kt.online_order_id IS NULL
     LEFT JOIN Online_Order_Item ooi ON ooi.online_order_id = kt.online_order_id AND kt.online_order_id IS NOT NULL
     LEFT JOIN Menu_Item mi ON mi.menu_item_id = COALESCE(oi.menu_item_id, ooi.menu_item_id)
     WHERE kt.status IN ('new', 'in_progress')
       AND (
         kt.online_order_id IS NULL
         OR oo.customer_status IN ('confirmed', 'preparing', 'ready')
       )
     GROUP BY kt.ticket_id, kt.order_id, kt.online_order_id, tableNumber, o.takeout_name, kt.status, kt.created_at, kt.updated_at
     ORDER BY kt.created_at ASC`
  );
}

async function updateTicketStatus(payload) {
  const ticketId = Number.parseInt(payload?.ticketId, 10);
  const userId = Number.parseInt(payload?.userId, 10);
  const status = payload?.status;

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw createValidationError("ticketId must be a positive integer.");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createValidationError("userId must be a positive integer.");
  }

  if (!["in_progress", "done", "canceled"].includes(status)) {
    throw createValidationError("status must be in_progress, done, or canceled.");
  }

  return db.withTransaction(async (connection) => {
    const [userRows] = await connection.execute(
      "SELECT role, is_active FROM Users WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
      throw createValidationError("Active user required.");
    }

    if (status === "done" && !["kitchen", "manager"].includes(userRows[0].role)) {
      throw createValidationError("Only kitchen staff or managers can close tickets.");
    }

    const [ticketRows] = await connection.execute(
      `SELECT ticket_id, order_id, online_order_id, table_id, status
       FROM Kitchen_Ticket
       WHERE ticket_id = ?
       LIMIT 1`,
      [ticketId]
    );

    if (ticketRows.length === 0) {
      throw createValidationError("Ticket not found.");
    }

    await connection.execute(
      `UPDATE Kitchen_Ticket
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = ?`,
      [status, ticketId]
    );

    if (ticketRows[0].online_order_id) {
      const customerStatusMap = { in_progress: "preparing", done: "ready", canceled: "denied" };
      const newCustomerStatus = customerStatusMap[status];
      if (newCustomerStatus) {
        await connection.execute(
          `UPDATE Online_Orders SET customer_status = ? WHERE online_order_id = ?`,
          [newCustomerStatus, ticketRows[0].online_order_id]
        );
      }
    }

    if (status === "done") {
      await connection.execute(
        `UPDATE Orders
         SET status = 'Completed'
         WHERE order_id = ?
           AND status IN ('Open', 'Sent')`,
        [ticketRows[0].order_id]
      );
    }

    if (status === "canceled" && ticketRows[0].order_id) {
      await connection.execute(
        `UPDATE Orders
         SET status = 'Void',
             void_reason = 'Kitchen ticket canceled',
             voided_by = ?,
             closed_at = CURRENT_TIMESTAMP
         WHERE order_id = ?`,
        [userId, ticketRows[0].order_id]
      );
    }

    const [updatedRows] = await connection.execute(
      `SELECT
        kt.ticket_id AS ticketId,
        kt.order_id AS orderId,
        dt.table_number AS tableNumber,
        kt.status,
        kt.created_at AS createdAt,
        kt.updated_at AS updatedAt
       FROM Kitchen_Ticket kt
       JOIN Dining_Tables dt ON dt.table_id = kt.table_id
       WHERE kt.ticket_id = ?
       LIMIT 1`,
      [ticketId]
    );

    return updatedRows[0];
  });
}

async function removeTicket(payload) {
  const ticketId = Number.parseInt(payload?.ticketId, 10);
  const userId = Number.parseInt(payload?.userId, 10);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw createValidationError("ticketId must be a positive integer.");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createValidationError("userId must be a positive integer.");
  }

  return db.withTransaction(async (connection) => {
    const [userRows] = await connection.execute(
      "SELECT role, is_active FROM Users WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].is_active) {
      throw createValidationError("Active user required.");
    }

    if (!["kitchen", "manager"].includes(userRows[0].role)) {
      throw createValidationError("Only kitchen staff or managers can remove tickets.");
    }

    const [result] = await connection.execute(
      "DELETE FROM Kitchen_Ticket WHERE ticket_id = ?",
      [ticketId]
    );

    if (result.affectedRows === 0) {
      throw createValidationError("Ticket not found.");
    }

    return { ticketId, removed: true };
  });
}

export { getActiveTickets, updateTicketStatus, removeTicket };
