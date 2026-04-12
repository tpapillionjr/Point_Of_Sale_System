import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

async function getTables(_req, res) {
  try {
    const rows = await db.query(
      `SELECT
        table_id AS tableId,
        table_number AS tableNumber,
        capacity,
        status
       FROM Dining_Tables
       WHERE table_number >= 1
       ORDER BY table_number ASC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tables." });
  }
}

async function updateTableStatus(req, res) {
  try {
    const tableId = Number.parseInt(req.params.tableId, 10);
    const allowedStatuses = new Set(["available", "occupied", "reserved", "inactive"]);
    const { status } = req.body ?? {};

    if (!Number.isInteger(tableId) || tableId <= 0) {
      throw createValidationError("tableId must be a positive integer.");
    }

    if (!allowedStatuses.has(status)) {
      throw createValidationError(
        "status must be one of available, occupied, reserved, or inactive."
      );
    }

    const result = await db.withTransaction(async (connection) => {
      const [tableRows] = await connection.execute(
        `SELECT table_id AS tableId, table_number AS tableNumber, capacity, status
         FROM Dining_Tables
         WHERE table_id = ?
           AND table_number >= 1
         LIMIT 1`,
        [tableId]
      );

      if (tableRows.length === 0) {
        throw createValidationError("Table not found.");
      }

      if (status === "available") {
        const [openOrderRows] = await connection.execute(
          `SELECT order_id
           FROM Orders
           WHERE table_id = ?
             AND status IN ('Open', 'Sent', 'Completed')
           LIMIT 1`,
          [tableId]
        );

        if (openOrderRows.length > 0) {
          throw createValidationError(
            "Cannot mark a table available while it still has an active order."
          );
        }
      }

      await connection.execute(
        "UPDATE Dining_Tables SET status = ? WHERE table_id = ?",
        [status, tableId]
      );

      const [updatedRows] = await connection.execute(
        `SELECT table_id AS tableId, table_number AS tableNumber, capacity, status
         FROM Dining_Tables
         WHERE table_id = ?
           AND table_number >= 1
         LIMIT 1`,
        [tableId]
      );

      return updatedRows[0];
    });

    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to update table status.",
      details: error.details ?? [],
    });
  }
}

export { getTables, updateTableStatus };
