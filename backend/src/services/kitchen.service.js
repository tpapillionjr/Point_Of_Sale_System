import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

async function getActiveTickets() {
  return db.query(
    `SELECT
      kt.ticket_id AS ticketId,
      kt.order_id AS orderId,
      dt.table_number AS tableNumber,
      kt.status,
      kt.created_at AS createdAt,
      kt.updated_at AS updatedAt,
      GROUP_CONCAT(CONCAT(mi.name, ' x', oi.quantity) ORDER BY oi.order_item_id SEPARATOR '||') AS items
     FROM Kitchen_Ticket kt
     JOIN Orders o ON o.order_id = kt.order_id
     JOIN Dining_Tables dt ON dt.table_id = kt.table_id
     LEFT JOIN Order_Item oi ON oi.order_id = o.order_id
     LEFT JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
     WHERE kt.status IN ('new', 'in_progress')
     GROUP BY kt.ticket_id, kt.order_id, dt.table_number, kt.status, kt.created_at, kt.updated_at
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
      `SELECT ticket_id, order_id, table_id, status
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

    if (status === "done") {
      await connection.execute(
        `UPDATE Orders
         SET status = 'Completed'
         WHERE order_id = ?
           AND status IN ('Open', 'Sent')`,
        [ticketRows[0].order_id]
      );
    }

    if (status === "canceled") {
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

export { getActiveTickets, updateTicketStatus };
