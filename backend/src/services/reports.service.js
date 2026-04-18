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
       item_sales.category AS category,
       COALESCE(SUM(item_sales.quantity), 0) AS sold,
       ROUND(COALESCE(SUM(item_sales.quantity * item_sales.price), 0), 2) AS revenue,
       COALESCE(MAX(i.amount_available), 0) AS quantity,
       DATE_FORMAT(MAX(item_sales.createdAt), '%Y-%m-%d') AS lastPurchased
     FROM (
       SELECT mi.menu_item_id AS menuItemId, mi.name, COALESCE(mi.category, 'Restaurant') AS category, oi.quantity, oi.price, o.created_at AS createdAt
       FROM Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       JOIN Orders o ON o.order_id = oi.order_id
       WHERE o.status <> 'Void'

       UNION ALL

       SELECT mi.menu_item_id AS menuItemId, mi.name, COALESCE(mi.category, 'Restaurant') AS category, ooi.quantity, ooi.price, oo.created_at AS createdAt
       FROM Online_Order_Item ooi
       JOIN Menu_Item mi ON mi.menu_item_id = ooi.menu_item_id
       JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
     ) item_sales
     LEFT JOIN Inventory i ON i.menu_item_id = item_sales.menuItemId
     WHERE ${buildRangeFilter(filters, "item_sales.createdAt")}
     GROUP BY item_sales.menuItemId, item_sales.name, item_sales.category
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
      getTopSellingItems(30, filters),
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
    topItems: topItems.map((row) => ({
      name: row.name,
      category: row.category ?? "Restaurant",
      sold: Number(row.sold || 0),
      revenue: Number(row.revenue || 0),
      quantity: Number(row.quantity || 0),
      lastPurchased: row.lastPurchased ?? "No purchases",
    })),
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

async function getRevenueReport(range, revenueType = "all") {
  const filters = normalizeReportFilters(range);
  const baseSubquery = `
    SELECT total, created_at AS createdAt, order_type AS type
    FROM Orders
    WHERE status <> 'Void'

    UNION ALL

    SELECT total, created_at AS createdAt, 'Online' AS type
    FROM Online_Orders
  `;

  const typeCondition =
    revenueType === "dine_in"
      ? "AND type = 'Dine_in'"
      : revenueType === "takeout"
        ? "AND type = 'Takeout'"
        : revenueType === "online"
          ? "AND type = 'Online'"
          : "";

  const dateFilter = buildRangeFilter(filters, "createdAt");

  const [summaryRows, byTypeRows, trendRows, tipRows, paymentRows] = await Promise.all([
    db.query(
      `SELECT
         ROUND(COALESCE(SUM(total), 0), 2) AS totalRevenue,
         COUNT(*) AS totalOrders,
         ROUND(COALESCE(AVG(total), 0), 2) AS avgOrderValue
       FROM (${baseSubquery}) all_orders
       WHERE ${dateFilter} ${typeCondition}`
    ),
    db.query(
      `SELECT
         type AS orderType,
         COUNT(*) AS orders,
         ROUND(COALESCE(SUM(total), 0), 2) AS revenue
       FROM (${baseSubquery}) all_orders
       WHERE ${dateFilter}
       GROUP BY type
       ORDER BY revenue DESC`
    ),
    db.query(
      `SELECT
         DATE_FORMAT(createdAt, '%b %e') AS date,
         ROUND(COALESCE(SUM(total), 0), 2) AS revenue,
         COUNT(*) AS orders
       FROM (${baseSubquery}) all_orders
       WHERE ${dateFilter} ${typeCondition}
       GROUP BY DATE(createdAt), DATE_FORMAT(createdAt, '%b %e')
       ORDER BY DATE(createdAt) ASC`
    ),
    db.query(
      `SELECT COALESCE(SUM(tip_amount), 0) AS totalTips
       FROM Payment
       WHERE status = 'approved'
         AND ${buildRangeFilter(filters, "paid_at")}`
    ),
    db.query(
      `SELECT
         payment_type AS method,
         COUNT(*) AS transactions,
         ROUND(COALESCE(SUM(amount), 0), 2) AS revenue
       FROM Payment
       WHERE status = 'approved'
         AND ${buildRangeFilter(filters, "paid_at")}
       GROUP BY payment_type
       ORDER BY revenue DESC`
    ),
  ]);

  return {
    summary: {
      totalRevenue: Number(summaryRows[0]?.totalRevenue ?? 0),
      totalOrders: Number(summaryRows[0]?.totalOrders ?? 0),
      avgOrderValue: Number(summaryRows[0]?.avgOrderValue ?? 0),
      totalTips: Number(tipRows[0]?.totalTips ?? 0),
    },
    byOrderType: byTypeRows.map((row) => ({
      type: row.orderType,
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    byPaymentMethod: paymentRows.map((row) => ({
      method: row.method,
      transactions: Number(row.transactions || 0),
      revenue: Number(row.revenue || 0),
    })),
    trend: trendRows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    })),
  };
}

async function getCustomerLoyaltyReport(range) {
  const filters = normalizeReportFilters(range);
  const [summaryRows, topCustomersRows, trendRows, recentActivityRows] = await Promise.all([
    db.query(
      `SELECT
         COUNT(DISTINCT c.customer_num_id) AS totalMembers,
         COALESCE(SUM(c.points_balance), 0) AS totalPointsBalance,
         COALESCE(SUM(CASE WHEN lt.type = 'earned' THEN lt.points ELSE 0 END), 0) AS totalPointsEarned,
         COALESCE(SUM(CASE WHEN lt.type = 'redeemed' THEN lt.points ELSE 0 END), 0) AS totalPointsRedeemed
       FROM Customer c
       LEFT JOIN Loyalty_Transactions lt
         ON lt.customer_num_id = c.customer_num_id
         AND ${buildRangeFilter(filters, "lt.created_at")}
       WHERE c.is_active = TRUE`
    ),
    db.query(
      `SELECT
         c.customer_num_id AS customerId,
         CONCAT(c.first_name, ' ', c.last_name) AS customerName,
         c.email,
         COALESCE(SUM(CASE WHEN lt.type = 'earned' THEN lt.points ELSE 0 END), 0) AS pointsEarned,
         COALESCE(SUM(CASE WHEN lt.type = 'redeemed' THEN lt.points ELSE 0 END), 0) AS pointsRedeemed,
         c.points_balance AS currentBalance,
         COUNT(DISTINCT lt.online_order_id) AS orders
       FROM Customer c
       LEFT JOIN Loyalty_Transactions lt
         ON lt.customer_num_id = c.customer_num_id
         AND ${buildRangeFilter(filters, "lt.created_at")}
       WHERE c.is_active = TRUE
       GROUP BY c.customer_num_id, c.first_name, c.last_name, c.email, c.points_balance
       ORDER BY pointsEarned DESC, currentBalance DESC
       LIMIT 10`
    ),
    db.query(
      `SELECT
         DATE_FORMAT(created_at, '%b %e') AS date,
         COALESCE(SUM(CASE WHEN type = 'earned' THEN points ELSE 0 END), 0) AS pointsEarned,
         COALESCE(SUM(CASE WHEN type = 'redeemed' THEN points ELSE 0 END), 0) AS pointsRedeemed
       FROM Loyalty_Transactions
       WHERE ${buildRangeFilter(filters, "created_at")}
       GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%b %e')
       ORDER BY DATE(created_at) ASC`
    ),
    db.query(
      `SELECT
         CONCAT(c.first_name, ' ', c.last_name) AS customerName,
         lt.type,
         lt.points,
         lt.description,
         lt.created_at AS date
       FROM Loyalty_Transactions lt
       JOIN Customer c ON c.customer_num_id = lt.customer_num_id
       WHERE c.is_active = TRUE
         AND ${buildRangeFilter(filters, "lt.created_at")}
       ORDER BY lt.created_at DESC
       LIMIT 20`
    ),
  ]);

  return {
    summary: {
      totalMembers: Number(summaryRows[0]?.totalMembers ?? 0),
      totalPointsBalance: Number(summaryRows[0]?.totalPointsBalance ?? 0),
      totalPointsEarned: Number(summaryRows[0]?.totalPointsEarned ?? 0),
      totalPointsRedeemed: Number(summaryRows[0]?.totalPointsRedeemed ?? 0),
    },
    mostLoyalCustomer: topCustomersRows[0]
      ? {
          name: topCustomersRows[0].customerName,
          email: topCustomersRows[0].email,
          pointsEarned: Number(topCustomersRows[0].pointsEarned || 0),
          currentBalance: Number(topCustomersRows[0].currentBalance || 0),
          orders: Number(topCustomersRows[0].orders || 0),
        }
      : null,
    topCustomers: topCustomersRows.map((row) => ({
      name: row.customerName,
      email: row.email,
      pointsEarned: Number(row.pointsEarned || 0),
      pointsRedeemed: Number(row.pointsRedeemed || 0),
      currentBalance: Number(row.currentBalance || 0),
      orders: Number(row.orders || 0),
    })),
    trend: trendRows.map((row) => ({
      date: row.date,
      pointsEarned: Number(row.pointsEarned || 0),
      pointsRedeemed: Number(row.pointsRedeemed || 0),
    })),
    recentActivity: recentActivityRows.map((row) => ({
      customerName: row.customerName,
      type: row.type,
      points: Number(row.points || 0),
      description: row.description,
      date: row.date,
    })),
  };
}

async function getItemReport(range, category = "all") {
  const filters = normalizeReportFilters(range);
  const safeCategory = category.replace(/[^a-zA-Z0-9\s\-&]/g, "").trim();
  const categoryCondition = safeCategory && safeCategory !== "all"
    ? `AND COALESCE(mi.category, 'Uncategorized') = '${safeCategory}'`
    : "";

  const [itemRows, categoryRows, lowStockRows] = await Promise.all([
    db.query(
      `SELECT
         mi.menu_item_id AS itemId,
         mi.name,
         COALESCE(mi.category, 'Uncategorized') AS category,
         mi.base_price AS basePrice,
         COALESCE(SUM(sales.quantity), 0) AS unitsSold,
         ROUND(COALESCE(SUM(sales.quantity * sales.price), 0), 2) AS revenue,
         COALESCE(MAX(inv.amount_available), 0) AS stock,
         COALESCE(MAX(inv.availability_status), TRUE) AS inStock
       FROM Menu_Item mi
       LEFT JOIN (
         SELECT oi.menu_item_id, oi.quantity, oi.price, o.created_at AS createdAt
         FROM Order_Item oi
         JOIN Orders o ON o.order_id = oi.order_id
         WHERE o.status <> 'Void'

         UNION ALL

         SELECT ooi.menu_item_id, ooi.quantity, ooi.price, oo.created_at AS createdAt
         FROM Online_Order_Item ooi
         JOIN Online_Orders oo ON oo.online_order_id = ooi.online_order_id
       ) sales ON sales.menu_item_id = mi.menu_item_id
         AND ${buildRangeFilter(filters, "sales.createdAt")}
       LEFT JOIN Inventory inv ON inv.menu_item_id = mi.menu_item_id
       WHERE mi.is_active = TRUE ${categoryCondition}
       GROUP BY mi.menu_item_id, mi.name, mi.category, mi.base_price
       ORDER BY unitsSold DESC, revenue DESC, mi.name ASC`
    ),
    db.query(
      `SELECT DISTINCT COALESCE(category, 'Uncategorized') AS category
       FROM Menu_Item
       WHERE is_active = TRUE
       ORDER BY category ASC`
    ),
    db.query(
      `SELECT
         i.inventory_item_name AS itemName,
         i.amount_available AS stock,
         mi.name AS menuItemName,
         COALESCE(mi.category, 'Uncategorized') AS category,
         CASE
           WHEN i.amount_available <= 3 OR i.availability_status = FALSE THEN 'Critical'
           ELSE 'Low'
         END AS status
       FROM Inventory i
       JOIN Menu_Item mi ON mi.menu_item_id = i.menu_item_id
       WHERE i.availability_status = FALSE OR i.amount_available <= 10
       ORDER BY i.amount_available ASC`
    ),
  ]);

  const withSales = itemRows.filter((r) => Number(r.unitsSold) > 0);
  const mostPopular = withSales[0] ?? null;
  const leastPopular = withSales.length > 1 ? withSales[withSales.length - 1] : null;

  return {
    summary: {
      totalItems: itemRows.length,
      itemsNeedingRestock: lowStockRows.length,
      mostPopularItem: mostPopular ? { name: mostPopular.name, unitsSold: Number(mostPopular.unitsSold) } : null,
      leastPopularItem: leastPopular ? { name: leastPopular.name, unitsSold: Number(leastPopular.unitsSold) } : null,
    },
    items: itemRows.map((row) => ({
      name: row.name,
      category: row.category,
      basePrice: Number(row.basePrice || 0),
      unitsSold: Number(row.unitsSold || 0),
      revenue: Number(row.revenue || 0),
      stock: Number(row.stock || 0),
      inStock: Boolean(row.inStock),
    })),
    categories: categoryRows.map((r) => r.category),
    lowStockItems: lowStockRows.map((row) => ({
      itemName: row.itemName,
      menuItemName: row.menuItemName,
      category: row.category,
      stock: Number(row.stock || 0),
      status: row.status,
    })),
  };
}

export { getReportsDashboard, getReportsOverview, getRevenueReport, getCustomerLoyaltyReport, getItemReport };
