import db from "../db/index.js";

const RANGE_DAYS = {
  today: 1,
  "7days": 7,
  "30days": 30,
};

function normalizeRange(range) {
  return RANGE_DAYS[range] ? range : "7days";
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function buildSummaryCards(prefix, revenue, orders, tips) {
  return [
    { title: `${prefix}Revenue`, value: formatCurrency(revenue) },
    { title: `${prefix}Orders`, value: String(Number(orders || 0)) },
    { title: `${prefix}Tips`, value: formatCurrency(tips) },
  ];
}

async function getSummaryForDays(days) {
  const [rows] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(o.total), 0) AS revenue,
         COUNT(*) AS orders,
         COALESCE(SUM(p.tip_amount), 0) AS tips
       FROM Orders o
       LEFT JOIN Payment p
         ON p.order_id = o.order_id
        AND p.status = 'approved'
       WHERE o.status <> 'Void'
         AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? - 1 DAY)`,
      [days]
    ),
  ]);

  return rows[0] ?? { revenue: 0, orders: 0, tips: 0 };
}

async function getRevenueTrend(range) {
  const days = RANGE_DAYS[normalizeRange(range)];

  return db.query(
    `SELECT
       DATE_FORMAT(created_at, '%b %e') AS date,
       ROUND(COALESCE(SUM(total), 0), 2) AS revenue
     FROM Orders
     WHERE status <> 'Void'
       AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? - 1 DAY)
     GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%b %e')
     ORDER BY DATE(created_at) ASC`,
    [days]
  );
}

async function getTopSellingItems(limit = 5) {
  return db.query(
    `SELECT
       mi.name AS name,
       COALESCE(SUM(oi.quantity), 0) AS sold,
       ROUND(COALESCE(SUM(oi.quantity * oi.price), 0), 2) AS revenue
     FROM Order_Item oi
     JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
     JOIN Orders o ON o.order_id = oi.order_id
     WHERE o.status <> 'Void'
     GROUP BY mi.menu_item_id, mi.name
     ORDER BY sold DESC, revenue DESC, mi.name ASC
     LIMIT ?`,
    [limit]
  );
}

async function getLowInventoryItems(limit = 5) {
  const rows = await db.query(
    `SELECT
       inventory_item_name AS itemName,
       amount_available AS amountAvailable,
       CASE
         WHEN amount_available <= 3 OR availability_status = FALSE THEN 'Critical'
         ELSE 'Low'
       END AS status
     FROM Inventory
     WHERE availability_status = FALSE
        OR amount_available <= 10
     ORDER BY amount_available ASC, inventory_item_name ASC
     LIMIT ?`,
    [limit]
  );

  return rows;
}

async function getReportsOverview(range) {
  const normalizedRange = normalizeRange(range);
  const [today, weekly, monthly, revenueTrend, topItems, lowInventory] = await Promise.all([
    getSummaryForDays(1),
    getSummaryForDays(7),
    getSummaryForDays(30),
    getRevenueTrend(normalizedRange),
    getTopSellingItems(5),
    getLowInventoryItems(5),
  ]);

  return {
    todaySummary: buildSummaryCards("Today ", today.revenue, today.orders, today.tips),
    weeklySummary: buildSummaryCards("Weekly ", weekly.revenue, weekly.orders, weekly.tips),
    monthlySummary: buildSummaryCards("Monthly ", monthly.revenue, monthly.orders, monthly.tips),
    revenueTrend: revenueTrend.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
    })),
    topItems: topItems.map((row) => ({
      name: row.name,
      sold: Number(row.sold || 0),
      revenue: Number(row.revenue || 0),
    })),
    lowInventory: lowInventory.map((row) => ({
      itemName: row.itemName,
      amountAvailable: Number(row.amountAvailable || 0),
      status: row.status,
    })),
  };
}

export { getReportsOverview };
