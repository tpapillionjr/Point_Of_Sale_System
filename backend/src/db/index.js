import mysql from "mysql2/promise";

const LEGACY_TABLE_NAME_MAP = new Map([
  ["Approval_Rule", "approval_rule"],
  ["Back_Office_Settings", "back_office_settings"],
  ["Customer", "customer"],
  ["Customer_Reservation", "customer_reservation"],
  ["Device_Defaults", "device_defaults"],
  ["Dining_Tables", "dining_tables"],
  ["Employee_Shift", "employee_shift"],
  ["Inventory", "inventory"],
  ["Kitchen_Ticket", "kitchen_ticket"],
  ["Login_Audit", "login_audit"],
  ["Loyalty_Rewards", "loyalty_rewards"],
  ["Loyalty_Transactions", "loyalty_transactions"],
  ["Manager_Notification", "manager_notification"],
  ["Menu_Item", "menu_item"],
  ["Menu_Item_Modifier", "menu_item_modifier"],
  ["Modifier", "modifier"],
  ["Online_Order_Item", "online_order_item"],
  ["Online_Orders", "online_orders"],
  ["Order_Item", "order_item"],
  ["Orders", "orders"],
  ["Payment", "payment"],
  ["Receipt_Settings", "receipt_settings"],
  ["Settings_Audit_Log", "settings_audit_log"],
  ["System_Settings", "system_settings"],
  ["Tax_Configuration", "tax_configuration"],
  ["Users", "users"],
  ["Utensil_Inventory", "utensil_inventory"],
]);

function normalizeSqlIdentifiers(sql) {
  if (typeof sql !== "string" || sql.length === 0) {
    return sql;
  }

  let normalizedSql = sql;

  for (const [legacyName, lowercaseName] of LEGACY_TABLE_NAME_MAP.entries()) {
    normalizedSql = normalizedSql.replace(
      new RegExp(`\\b${legacyName}\\b`, "g"),
      lowercaseName
    );
  }

  return normalizedSql;
}

function wrapConnection(connection) {
  const originalExecute = connection.execute.bind(connection);
  connection.execute = (sql, params) => originalExecute(normalizeSqlIdentifiers(sql), params);

  if (typeof connection.query === "function") {
    const originalQuery = connection.query.bind(connection);
    connection.query = (sql, params) => originalQuery(normalizeSqlIdentifiers(sql), params);
  }

  return connection;
}

function buildSslConfig() {
  const sslEnabled = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";

  if (!sslEnabled) {
    return undefined;
  }

  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" ||
    process.env.DB_SSL_REJECT_UNAUTHORIZED === "1";

  return {
    rejectUnauthorized,
  };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pos_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: buildSslConfig(),
});

const originalPoolExecute = pool.execute.bind(pool);
pool.execute = (sql, params) => originalPoolExecute(normalizeSqlIdentifiers(sql), params);

const originalPoolQuery = pool.query.bind(pool);
pool.query = (sql, params) => originalPoolQuery(normalizeSqlIdentifiers(sql), params);

async function query(sql, params = []) {
  const [rows] = await pool.execute(normalizeSqlIdentifiers(sql), params);
  return rows;
}

async function withTransaction(callback) {
  const connection = wrapConnection(await pool.getConnection());

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const db = {
  pool,
  query,
  withTransaction,
};

export default db;
