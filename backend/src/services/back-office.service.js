import db from "../db/index.js";

function createAction({ title, description, priority }) {
  return { title, description, priority };
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
        priority: row.amountAvailable <= 0 ? "High" : "Medium",
      })
    ),
    ...staleTicketRows.map((row) =>
      createAction({
        title: `Review kitchen ticket #${row.ticketId} for table ${row.tableNumber}`,
        description: `This ticket has been open for ${row.ageMinutes} minutes and may need manager follow-up.`,
        priority: row.ageMinutes >= 20 ? "High" : "Medium",
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

export { getBackOfficeDashboard };
