import db from "../db/index.js";

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function normalizeReportFilters(input) {
  if (typeof input === "string") {
    const numericDays = Number.parseInt(input, 10);

    if (Number.isInteger(numericDays) && numericDays >= 1 && numericDays <= 365) {
      return {
        mode: "days",
        days: numericDays,
        startDate: null,
        endDate: null,
      };
    }

    if (isValidDateOnly(input)) {
      return {
        mode: "dates",
        days: null,
        startDate: input,
        endDate: input,
      };
    }

    return {
      mode: "days",
      days: 30,
      startDate: null,
      endDate: null,
    };
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
    return {
      mode: "days",
      days: numericDays,
      startDate: null,
      endDate: null,
    };
  }

  return {
    mode: "days",
    days: 30,
    startDate: null,
    endDate: null,
  };
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

function buildRangeFilter(filters, column = "created_at") {
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

function buildCurrentWeekFilter(column = "created_at") {
  return `DATE(${column}) >= DATE_SUB(CURRENT_DATE, INTERVAL (DAYOFWEEK(CURRENT_DATE) - 1) DAY)
    AND DATE(${column}) < DATE_ADD(DATE_SUB(CURRENT_DATE, INTERVAL (DAYOFWEEK(CURRENT_DATE) - 1) DAY), INTERVAL 7 DAY)`;
}

function hoursBetween(start, end) {
  if (!start || !end) {
    return 0;
  }

  return Math.max((new Date(end).getTime() - new Date(start).getTime()) / 3600000, 0);
}

function bandHour(hour) {
  if (hour === null || hour === undefined) {
    return "Unknown";
  }

  const normalizedHour = Number(hour);
  const startHour = normalizedHour % 24;
  const endHour = (startHour + 2) % 24;

  const format = (value) => {
    const suffix = value >= 12 ? "PM" : "AM";
    const hour12 = value % 12 === 0 ? 12 : value % 12;
    return `${hour12}:00 ${suffix}`;
  };

  return `${format(startHour)} - ${format(endHour)}`;
}

async function getSummaryForFilters(filters) {
  const [orderRows, tipRows] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(total), 0) AS revenue,
         COUNT(*) AS orders
       FROM (
         SELECT o.total, o.created_at AS createdAt
         FROM Orders o
         WHERE o.status <> 'Void'

         UNION ALL

         SELECT oo.total, oo.created_at AS createdAt
         FROM Online_Orders oo
       ) all_orders
       WHERE ${buildRangeFilter(filters, "createdAt")}`
    ),
    db.query(
      `SELECT COALESCE(SUM(tip_amount), 0) AS tips
       FROM Payment
       WHERE status = 'approved'
         AND ${buildRangeFilter(filters, "paid_at")}`
    ),
  ]);

  return {
    revenue: Number(orderRows[0]?.revenue ?? 0),
    orders: Number(orderRows[0]?.orders ?? 0),
    tips: Number(tipRows[0]?.tips ?? 0),
  };
}

async function getRevenueTrend(filters) {
  return db.query(
    `SELECT
       DATE_FORMAT(createdAt, '%b %e') AS date,
       ROUND(COALESCE(SUM(total), 0), 2) AS revenue
     FROM (
       SELECT total, created_at AS createdAt
       FROM Orders
       WHERE status <> 'Void'

       UNION ALL

       SELECT total, created_at AS createdAt
       FROM Online_Orders
     ) all_orders
     WHERE ${buildRangeFilter(filters, "createdAt")}
     GROUP BY DATE(createdAt), DATE_FORMAT(createdAt, '%b %e')
     ORDER BY DATE(createdAt) ASC`
  );
}

async function getTopSellingItems(limit = 5, filters) {
  return db.query(
    `SELECT
       item_sales.name AS name,
       COALESCE(SUM(item_sales.quantity), 0) AS sold,
       ROUND(COALESCE(SUM(item_sales.quantity * item_sales.price), 0), 2) AS revenue
     FROM (
       SELECT mi.menu_item_id AS menuItemId, mi.name, oi.quantity, oi.price, o.created_at AS createdAt
       FROM Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       JOIN Orders o ON o.order_id = oi.order_id
       WHERE o.status <> 'Void'

       UNION ALL

       SELECT mi.menu_item_id AS menuItemId, mi.name, ooi.quantity, ooi.price, oo.created_at AS createdAt
       FROM Online_Order_Item ooi
       JOIN Menu_Item mi ON mi.menu_item_id = ooi.menu_item_id
       JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
     ) item_sales
     WHERE ${buildRangeFilter(filters, "item_sales.createdAt")}
     GROUP BY item_sales.menuItemId, item_sales.name
     ORDER BY sold DESC, revenue DESC, item_sales.name ASC
     LIMIT ${Number(limit)}`
  );
}

async function getLowInventoryItems(limit = 5) {
  return db.query(
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
     LIMIT ${Number(limit)}`
  );
}

async function getSalesByCategory(filters) {
  return db.query(
    `SELECT
       category_sales.category AS category,
       ROUND(COALESCE(SUM(category_sales.quantity * category_sales.price), 0), 2) AS revenue
     FROM (
       SELECT COALESCE(mi.category, 'Uncategorized') AS category, oi.quantity, oi.price, o.created_at AS createdAt
       FROM Order_Item oi
       JOIN Orders o ON o.order_id = oi.order_id
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       WHERE o.status <> 'Void'

       UNION ALL

       SELECT COALESCE(mi.category, 'Uncategorized') AS category, ooi.quantity, ooi.price, oo.created_at AS createdAt
       FROM Online_Order_Item ooi
       JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
       JOIN Menu_Item mi ON mi.menu_item_id = ooi.menu_item_id
     ) category_sales
     WHERE ${buildRangeFilter(filters, "category_sales.createdAt")}
     GROUP BY category_sales.category
     ORDER BY revenue DESC, category ASC`
  );
}

async function getSalesByServer(filters) {
  return db.query(
    `SELECT name, ROUND(COALESCE(SUM(total), 0), 2) AS revenue, COUNT(*) AS orders
     FROM (
       SELECT u.name AS name, o.total, o.created_at AS createdAt
       FROM Orders o
       JOIN Users u ON u.user_id = o.created_by
       WHERE o.status <> 'Void'

       UNION ALL

       SELECT 'Online Ordering' AS name, oo.total, oo.created_at AS createdAt
       FROM Online_Orders oo
     ) server_sales
     WHERE ${buildRangeFilter(filters, "createdAt")}
     GROUP BY name
     ORDER BY revenue DESC, name ASC`
  );
}

async function getTipSummary(filters) {
  const [totalRows, dailyRows] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(tip_amount), 0) AS totalTips
       FROM Payment
       WHERE status = 'approved'
         AND ${buildRangeFilter(filters, "paid_at")}`
    ),
    db.query(
      `SELECT COALESCE(SUM(tip_amount), 0) AS dailyTips
       FROM Payment
       WHERE status = 'approved'
         AND ${buildRangeFilter(filters, "paid_at")}
       GROUP BY DATE(paid_at)`
    ),
  ]);

  const totalTips = Number(totalRows[0]?.totalTips ?? 0);
  const averageTips =
    dailyRows.length > 0
      ? dailyRows.reduce((sum, row) => sum + Number(row.dailyTips || 0), 0) / dailyRows.length
      : 0;

  return { totalTips, averageTips };
}

async function getLaborRows(filters) {
  return db.query(
    `SELECT
       u.name,
       es.scheduled_start AS scheduledStart,
       es.scheduled_end AS scheduledEnd,
       es.clock_in AS clockIn,
       es.clock_out AS clockOut
     FROM Employee_Shift es
     JOIN Users u ON u.user_id = es.user_id
     WHERE ${buildRangeFilter(filters, "es.scheduled_start")}
     ORDER BY u.name ASC, es.scheduled_start DESC`
  );
}

async function getCurrentWeekLaborRows() {
  return db.query(
    `SELECT
       u.name,
       es.clock_in AS clockIn,
       es.clock_out AS clockOut
     FROM Employee_Shift es
     JOIN Users u ON u.user_id = es.user_id
     WHERE ${buildCurrentWeekFilter("es.scheduled_start")}
     ORDER BY u.name ASC, es.scheduled_start DESC`
  );
}

async function getLatestClockRows() {
  return db.query(
    `SELECT
       u.name,
       es.clock_in AS clockIn,
       es.clock_out AS clockOut
     FROM Employee_Shift es
     JOIN Users u ON u.user_id = es.user_id
     JOIN (
       SELECT user_id, MAX(scheduled_start) AS latestScheduledStart
       FROM Employee_Shift
       GROUP BY user_id
     ) latest
       ON latest.user_id = es.user_id
      AND latest.latestScheduledStart = es.scheduled_start
     ORDER BY u.name ASC`
  );
}

async function getVoidRows(filters) {
  return db.query(
    `SELECT
       COALESCE(o.receipt_number, CONCAT('Order #', o.order_id)) AS orderLabel,
       o.void_reason AS reason,
       COALESCE(u.name, 'Unknown') AS employee,
       ROUND(o.total, 2) AS amount
     FROM Orders o
     LEFT JOIN Users u ON u.user_id = o.voided_by
     WHERE o.status = 'Void'
       AND ${buildRangeFilter(filters, "o.created_at")}
     ORDER BY o.created_at DESC
     LIMIT 10`
  );
}

async function getDiscountRows(filters) {
  return db.query(
    `SELECT
       discount_type AS type,
       COUNT(*) AS count,
       ROUND(COALESCE(SUM(discount_amount), 0), 2) AS amount
     FROM Orders
     WHERE discount_amount > 0
       AND ${buildRangeFilter(filters)}
     GROUP BY discount_type
     ORDER BY amount DESC, type ASC`
  );
}

async function getRefundRows(filters) {
  return db.query(
    `SELECT
       CONCAT('Order #', p.order_id) AS orderLabel,
       COALESCE(p.refund_reason, 'Refunded') AS reason,
       ROUND(p.amount, 2) AS amount,
       p.status AS status
     FROM Payment p
     WHERE p.status = 'refunded'
       AND ${buildRangeFilter(filters, "p.paid_at")}
     ORDER BY p.paid_at DESC
     LIMIT 10`
  );
}

async function getPaymentMethodRows(filters) {
  return db.query(
    `SELECT method, COUNT(*) AS count, ROUND(COALESCE(SUM(amount), 0), 2) AS amount
     FROM (
       SELECT
         CONCAT(UPPER(LEFT(payment_type, 1)), LOWER(SUBSTRING(payment_type, 2))) AS method,
         amount,
         paid_at AS paidAt
       FROM Payment
       WHERE status = 'approved'

       UNION ALL

       SELECT
         'Online' AS method,
         total AS amount,
         created_at AS paidAt
       FROM Online_Orders
       WHERE payment_status = 'paid'
     ) payments
     WHERE ${buildRangeFilter(filters, "paidAt")}
     GROUP BY method
     ORDER BY amount DESC`
  );
}

async function getCustomerSummary(filters) {
  const [customerRows, favoriteRows, partyRows, timeRows] = await Promise.all([
    db.query(
      `SELECT
         COUNT(*) AS activeCustomers,
         COALESCE(SUM(points_balance), 0) AS totalPoints
       FROM Customer`
    ),
    db.query(
      `SELECT name
       FROM (
         SELECT mi.menu_item_id AS menuItemId, mi.name, oi.quantity, o.created_at AS createdAt
         FROM Order_Item oi
         JOIN Orders o ON o.order_id = oi.order_id
         JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE o.status <> 'Void'

         UNION ALL

         SELECT mi.menu_item_id AS menuItemId, mi.name, ooi.quantity, oo.created_at AS createdAt
         FROM Online_Order_Item ooi
         JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
         JOIN Menu_Item mi ON mi.menu_item_id = ooi.menu_item_id
       ) favorites
       WHERE ${buildRangeFilter(filters, "createdAt")}
       GROUP BY menuItemId, name
       ORDER BY SUM(quantity) DESC, name ASC
       LIMIT 1`
    ),
    db.query(
      `SELECT ROUND(COALESCE(AVG(guest_count), 0), 1) AS averagePartySize
       FROM Orders
       WHERE status <> 'Void'
         AND ${buildRangeFilter(filters)}`
    ),
    db.query(
      `SELECT HOUR(createdAt) AS orderHour, COUNT(*) AS orderCount
       FROM (
         SELECT created_at AS createdAt
         FROM Orders
         WHERE status <> 'Void'

         UNION ALL

         SELECT created_at AS createdAt
         FROM Online_Orders
       ) all_orders
       WHERE ${buildRangeFilter(filters, "createdAt")}
       GROUP BY HOUR(createdAt)
       ORDER BY orderCount DESC, orderHour ASC
       LIMIT 1`
    ),
  ]);

  return {
    activeCustomers: Number(customerRows[0]?.activeCustomers ?? 0),
    totalPoints: Number(customerRows[0]?.totalPoints ?? 0),
    favoriteItem: favoriteRows[0]?.name ?? "No order data",
    averagePartySize: Number(partyRows[0]?.averagePartySize ?? 0),
    commonTime: bandHour(timeRows[0]?.orderHour),
  };
}

async function getReportsDashboard(range) {
  const filters = normalizeReportFilters(range);
  const [summary, revenueTrend, topItems, lowInventory, salesCategories, salesServers, tipSummary, laborRows, currentWeekLaborRows, latestClockRows, voidRows, discountRows, refundRows, paymentMethodRows, customerSummary] =
    await Promise.all([
      getSummaryForFilters(filters),
      getRevenueTrend(filters),
      getTopSellingItems(5, filters),
      getLowInventoryItems(5),
      getSalesByCategory(filters),
      getSalesByServer(filters),
      getTipSummary(filters),
      getLaborRows(filters),
      getCurrentWeekLaborRows(),
      getLatestClockRows(),
      getVoidRows(filters),
      getDiscountRows(filters),
      getRefundRows(filters),
      getPaymentMethodRows(filters),
      getCustomerSummary(filters),
    ]);

  const weeklyHoursByEmployee = new Map();
  for (const row of currentWeekLaborRows) {
    const existing = weeklyHoursByEmployee.get(row.name) ?? {
      name: row.name,
      hoursWorkedThisWeek: 0,
    };
    const workedHours = row.clockIn ? hoursBetween(row.clockIn, row.clockOut ?? new Date().toISOString()) : 0;
    existing.hoursWorkedThisWeek += workedHours;
    weeklyHoursByEmployee.set(row.name, existing);
  }

  const laborWeeklyHours = [...weeklyHoursByEmployee.values()]
    .map((row) => ({
      ...row,
      hoursWorkedThisWeek: Number(row.hoursWorkedThisWeek.toFixed(1)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const laborByEmployee = new Map();
  for (const row of laborRows) {
    const existing = laborByEmployee.get(row.name) ?? {
      name: row.name,
      scheduled: 0,
      worked: 0,
      hoursWorkedThisWeek: 0,
      clockIns: 0,
      performance: "Average",
    };

    existing.scheduled += hoursBetween(row.scheduledStart, row.scheduledEnd);
    existing.worked += row.clockIn ? hoursBetween(row.clockIn, row.clockOut ?? new Date().toISOString()) : 0;
    existing.clockIns += row.clockIn ? 1 : 0;
    laborByEmployee.set(row.name, existing);
  }

  const laborOverview = [...laborByEmployee.values()]
    .map((row) => {
      const roundedScheduled = Number(row.scheduled.toFixed(1));
      const roundedWorked = Number(row.worked.toFixed(1));
      const performance =
        roundedWorked >= roundedScheduled
          ? "Strong"
          : roundedWorked >= Math.max(roundedScheduled - 1, 0)
            ? "Good"
            : "Needs review";

      return {
        ...row,
        scheduled: roundedScheduled,
        worked: roundedWorked,
        hoursWorkedThisWeek: weeklyHoursByEmployee.get(row.name)?.hoursWorkedThisWeek
          ? Number(weeklyHoursByEmployee.get(row.name).hoursWorkedThisWeek.toFixed(1))
          : 0,
        performance,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const laborClock = latestClockRows.map((row) => ({
    name: row.name,
    lastClockIn: row.clockIn ? new Date(row.clockIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—",
    lastClockOut: row.clockOut ? new Date(row.clockOut).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—",
    status: row.clockIn && !row.clockOut ? "Clocked In" : "Clocked Out",
  }));

  return {
    customSummary: buildSummaryCards(
      filters.mode === "dates" ? "Selected Range " : `${filters.days} Day `,
      summary.revenue,
      summary.orders,
      summary.tips
    ),
    revenueTrend: revenueTrend.map((row) => ({ date: row.date, revenue: Number(row.revenue || 0) })),
    topItems: topItems.map((row) => ({ name: row.name, sold: Number(row.sold || 0), revenue: Number(row.revenue || 0) })),
    lowInventory: lowInventory.map((row) => ({
      itemName: row.itemName,
      amountAvailable: Number(row.amountAvailable || 0),
      status: row.status,
    })),
    salesCategories: salesCategories.map((row) => ({
      category: row.category,
      revenue: Number(row.revenue || 0),
    })),
    salesServers: salesServers.map((row) => ({
      name: row.name,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    })),
    tipSummary: {
      totalTips: Number(tipSummary.totalTips || 0),
      averageTips: Number(tipSummary.averageTips || 0),
    },
    laborOverview,
    laborWeeklyHours,
    laborClock,
    inventoryUsage: topItems.map((row) => ({
      itemName: row.name,
      amountUsed: Number(row.sold || 0),
    })),
    inventoryWaste: {
      highWasteItem: voidRows[0]?.reason ? voidRows[0].reason : "No waste data",
      mostEfficientItem: topItems[topItems.length - 1]?.name ?? "No sales data",
      reorderPriority: lowInventory.map((row) => row.itemName).join(", ") || "No reorder alerts",
    },
    operationalSummary: [
      { label: "Voids", value: String(voidRows.length) },
      { label: "Discounts", value: String(discountRows.reduce((sum, row) => sum + Number(row.count || 0), 0)) },
      { label: "Refunds", value: String(refundRows.length) },
      { label: "Cash Payments", value: String(paymentMethodRows.find((row) => row.method.toLowerCase() === "cash")?.count ?? 0) },
      { label: "Card Payments", value: String(paymentMethodRows.find((row) => row.method.toLowerCase() === "card")?.count ?? 0) },
    ],
    voids: voidRows.map((row) => ({
      order: row.orderLabel,
      reason: row.reason || "No reason provided",
      employee: row.employee,
      amount: formatCurrency(row.amount),
    })),
    discounts: discountRows.map((row) => ({
      type: row.type,
      count: Number(row.count || 0),
      amount: formatCurrency(row.amount),
    })),
    refunds: refundRows.map((row) => ({
      order: row.orderLabel,
      reason: row.reason,
      amount: formatCurrency(row.amount),
      status: row.status,
    })),
    paymentMethods: paymentMethodRows.map((row) => ({
      method: row.method,
      count: Number(row.count || 0),
      amount: formatCurrency(row.amount),
    })),
    customerOverview: [
      { label: "Loyalty Members", value: String(customerSummary.activeCustomers) },
      { label: "Favorite Item", value: customerSummary.favoriteItem },
      { label: "Average Party Size", value: customerSummary.averagePartySize ? String(customerSummary.averagePartySize) : "0" },
    ],
    customerHabits: [
      { label: "Most Common Order", value: customerSummary.favoriteItem },
      { label: "Most Common Time", value: customerSummary.commonTime },
      { label: "Average Party Size", value: customerSummary.averagePartySize ? String(customerSummary.averagePartySize) : "0" },
    ],
    customerLoyalty: [
      { label: "Active Loyalty Members", value: String(customerSummary.activeCustomers) },
      { label: "Total Points Balance", value: String(customerSummary.totalPoints) },
      { label: "Favorite Item", value: customerSummary.favoriteItem },
    ],
    repeatCustomers: [],
  };
}

async function getReportsOverview(range) {
  const dashboard = await getReportsDashboard(range);

  return {
    customSummary: dashboard.customSummary,
    revenueTrend: dashboard.revenueTrend,
    topItems: dashboard.topItems,
    lowInventory: dashboard.lowInventory,
  };
}

export { getReportsDashboard, getReportsOverview };
