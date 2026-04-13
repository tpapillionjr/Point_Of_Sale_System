import db from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const CUSTOMER_JWT_SECRET = process.env.JWT_SECRET;
const CUSTOMER_JWT_EXPIRES_IN = "7d";
const ONLINE_ORDER_CANCELED_STATUSES = new Set(["canceled", "denied"]);

function isCanceledOnlineOrderStatus(status) {
  return ONLINE_ORDER_CANCELED_STATUSES.has(status);
}

function normalizeCustomerFacingOnlineStatus(status) {
  return isCanceledOnlineOrderStatus(status) ? "canceled" : status;
}

function getCustomerFromAuthHeader(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const decoded = jwt.verify(authHeader.slice(7), CUSTOMER_JWT_SECRET);
  if (!decoded.customerId) {
    const error = new Error("Invalid customer token.");
    error.statusCode = 401;
    throw error;
  }

  return decoded;
}

async function registerCustomer(req, res) {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.replace(/\D/g, "") : "";

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!/^[a-zA-Z]+$/.test(firstName.trim())) {
      return res.status(400).json({ error: "First name can only contain letters." });
    }

    if (!/^[a-zA-Z]+$/.test(lastName.trim())) {
      return res.status(400).json({ error: "Last name can only contain letters." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Valid email required." });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: "10-digit phone number required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existingRows = await db.query(
      `SELECT email, phone_number AS phoneNumber
       FROM Customer
       WHERE LOWER(email) = LOWER(?) OR phone_number = ?
       LIMIT 1`,
      [normalizedEmail, normalizedPhone]
    );

    if (existingRows.length > 0) {
      if (String(existingRows[0].email).toLowerCase() === normalizedEmail) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      return res.status(409).json({ error: "An account with this phone number already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO Customer (first_name, last_name, email, password_hash, phone_number)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), normalizedEmail, passwordHash, normalizedPhone]
    );

    const customerId = result.insertId;
    const token = jwt.sign({ customerId, email: normalizedEmail }, CUSTOMER_JWT_SECRET, { expiresIn: CUSTOMER_JWT_EXPIRES_IN });

    res.status(201).json({
      token,
      customerId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error("registerCustomer error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email or phone number already exists." });
    }

    res.status(500).json({ error: "Failed to register." });
  }
}

async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const rows = await db.query(
      `SELECT customer_num_id, first_name, last_name, email, phone_number, password_hash, points_balance, is_active
       FROM Customer WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const customer = rows[0];

    if (!customer.is_active) {
      return res.status(403).json({ error: "This account has been deactivated. Please contact the restaurant." });
    }

    const valid = await bcrypt.compare(password, customer.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { customerId: customer.customer_num_id, email: customer.email },
      CUSTOMER_JWT_SECRET,
      { expiresIn: CUSTOMER_JWT_EXPIRES_IN }
    );

    res.json({
      token,
      customerId: customer.customer_num_id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone_number,
      pointsBalance: customer.points_balance,
    });
  } catch (error) {
    console.error("loginCustomer error:", error);
    res.status(500).json({ error: "Failed to login." });
  }
}

const TAX_RATE = 0.0825;
const MENU_CATEGORIES = ["Entrees", "Waffles", "Bowls", "Sandwiches", "Sides", "Beverages"];
const CATEGORY_ALIASES = {
  beverages: "Beverages",
  beverage: "Beverages",
  drinks: "Beverages",
  drink: "Beverages",
  entrees: "Entrees",
  entree: "Entrees",
  sandwiches: "Sandwiches",
  sandwich: "Sandwiches",
  waffles: "Waffles",
  waffle: "Waffles",
  bowls: "Bowls",
  bowl: "Bowls",
  sides: "Sides",
  side: "Sides",
  appetizers: "Sides",
  appetizer: "Sides",
};

function normalizeCategory(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (!key) {
    return "Entrees";
  }

  return CATEGORY_ALIASES[key] || "Entrees";
}

async function createCustomerOrder(req, res) {
  try {

    const { firstName, lastName, email, phone, note, cart, paymentPreference, customerId, rewardId } = req.body;
    const authenticatedCustomer = getCustomerFromAuthHeader(req);
    const orderCustomerId = authenticatedCustomer?.customerId ?? null;

    if (!authenticatedCustomer && (customerId || rewardId)) {
      return res.status(401).json({ error: "Customer login required for account orders and rewards." });
    }

    if (!firstName || !lastName || !email || !phone || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const subtotal = cart.reduce((sum, item) => sum + Number(item.base_price) * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const result = await db.withTransaction(async (connection) => {
      const [orderResult] = await connection.execute(
        `INSERT INTO Online_Orders (customer_num_id, first_name, last_name, email, phone, order_note, customer_status, payment_preference, subtotal, tax, total)
         VALUES (?, ?, ?, ?, ?, ?, 'placed', ?, ?, ?, ?)`,
        [orderCustomerId, firstName.trim(), lastName.trim(), email.trim(), phone.trim(), note ?? null, paymentPreference ?? "in_store", subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2)]
      );

      const onlineOrderId = orderResult.insertId;

      for (const item of cart) {
        await connection.execute(
          `INSERT INTO Online_Order_Item (online_order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [onlineOrderId, item.menu_item_id, item.quantity, Number(item.base_price)]
        );
      }

      if (paymentPreference === "online" && orderCustomerId) {
        await connection.execute(
          `UPDATE Online_Orders SET payment_status = 'paid' WHERE online_order_id = ?`,
          [onlineOrderId]
        );
      }

      if (rewardId && orderCustomerId) {
        const [rewardRows] = await connection.execute(
          `SELECT reward_id, name, points_cost, is_active FROM Loyalty_Rewards WHERE reward_id = ? LIMIT 1`,
          [rewardId]
        );

        if (rewardRows.length > 0 && rewardRows[0].is_active) {
          const reward = rewardRows[0];
          const [customerRows] = await connection.execute(
            `SELECT points_balance FROM Customer WHERE customer_num_id = ? LIMIT 1`,
            [orderCustomerId]
          );

          if (customerRows.length > 0 && customerRows[0].points_balance >= reward.points_cost) {
            await connection.execute(
              `UPDATE Customer SET points_balance = points_balance - ? WHERE customer_num_id = ?`,
              [reward.points_cost, orderCustomerId]
            );
            await connection.execute(
              `INSERT INTO Loyalty_Transactions (customer_num_id, online_order_id, type, points, description)
               VALUES (?, ?, 'redeemed', ?, ?)`,
              [orderCustomerId, onlineOrderId, reward.points_cost, `Redeemed: ${reward.name}`]
            );
          }
        }
      }

      return onlineOrderId;
    });

    res.status(201).json({ orderId: result });
  } catch (error) {
    console.error("createCustomerOrder error:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired customer token." });
    }

    res.status(500).json({ error: "Failed to place order." });
  }
}

async function getCustomerOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    const customerId = Number(req.customer?.customerId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(401).json({ error: "Customer login required." });
    }

    const rows = await db.query(
      `SELECT customer_status, customer_num_id AS customerId
       FROM Online_Orders
       WHERE online_order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (Number(rows[0].customerId) !== customerId) {
      return res.status(403).json({ error: "You do not have access to this order." });
    }

    res.json({ orderId, status: normalizeCustomerFacingOnlineStatus(rows[0].customer_status) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order status." });
  }
}

async function getCustomerMenu(req, res) {
  try {
    const rows = await db.query(
      `SELECT menu_item_id, name, category, base_price, description,
              photo_url, common_allergens
       FROM Menu_Item
       WHERE is_active = true
       ORDER BY category ASC, name ASC`
    );

    const grouped = MENU_CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: [] }), {});
    for (const item of rows) {
      const cat = normalizeCategory(item.category);
      grouped[cat].push({ ...item, category: cat });
    }

    const ordered = {};
    for (const category of MENU_CATEGORIES) {
      if (grouped[category].length > 0) {
        ordered[category] = grouped[category];
      }
    }

    res.json(ordered);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu." });
  }
}

async function getOnlineOrders(req, res) {
  try {
    const rows = await db.query(
      `SELECT online_order_id, first_name, last_name, phone, order_note,
              subtotal, tax, total, customer_status, payment_preference, payment_status, created_at
       FROM Online_Orders
       WHERE customer_status NOT IN ('picked_up', 'canceled', 'denied')
       ORDER BY created_at DESC`
    );

    const ordersWithItems = await Promise.all(rows.map(async (order) => {
      const items = await db.query(
        `SELECT mi.name, oi.quantity, oi.price
         FROM Online_Order_Item oi
         JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE oi.online_order_id = ?`,
        [order.online_order_id]
      );
      return { ...order, order_id: order.online_order_id, items };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error("getOnlineOrders error:", error);
    res.status(500).json({ error: "Failed to fetch online orders." });
  }
}

async function confirmOnlineOrder(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT customer_status
       FROM Online_Orders
       WHERE online_order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (isCanceledOnlineOrderStatus(rows[0].customer_status)) {
      return res.status(400).json({ error: "Canceled orders cannot be confirmed." });
    }

    await db.query(
      `UPDATE Online_Orders SET customer_status = 'confirmed' WHERE online_order_id = ?`,
      [orderId]
    );

    res.json({ orderId, customer_status: "confirmed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm order." });
  }
}

async function cancelOnlineOrder(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT customer_status, payment_status
       FROM Online_Orders
       WHERE online_order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (rows[0].customer_status === "picked_up") {
      return res.status(400).json({ error: "Picked up orders cannot be canceled." });
    }

    if (isCanceledOnlineOrderStatus(rows[0].customer_status)) {
      return res.status(400).json({ error: "Order is already canceled." });
    }

    await db.withTransaction(async (connection) => {
      await connection.execute(
        `UPDATE Online_Orders
         SET customer_status = 'denied'
         WHERE online_order_id = ?`,
        [orderId]
      );

      await connection.execute(
        `UPDATE Kitchen_Ticket
         SET status = 'canceled',
             updated_at = CURRENT_TIMESTAMP
         WHERE online_order_id = ?
           AND status IN ('new', 'in_progress')`,
        [orderId]
      );
    });

    res.json({
      orderId,
      customer_status: "canceled",
      payment_status: rows[0].payment_status,
    });
  } catch (error) {
    console.error("cancelOnlineOrder error:", error);
    res.status(500).json({ error: "Failed to cancel order." });
  }
}

async function markOrderPickedUp(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT customer_status
       FROM Online_Orders
       WHERE online_order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (isCanceledOnlineOrderStatus(rows[0].customer_status)) {
      return res.status(400).json({ error: "Canceled orders cannot be marked picked up." });
    }

    await db.query(
      `UPDATE Online_Orders SET customer_status = 'picked_up' WHERE online_order_id = ?`,
      [orderId]
    );

    res.json({ orderId, customer_status: "picked_up" });
  } catch (error) {
    console.error("markOrderPickedUp error:", error);
    res.status(500).json({ error: "Failed to mark order as picked up." });
  }
}

async function getOnlineOrderById(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT online_order_id, customer_num_id, first_name, last_name, email, phone,
              order_note, customer_status, payment_preference, payment_status,
              subtotal, tax, total, created_at
       FROM Online_Orders WHERE online_order_id = ? LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const items = await db.query(
      `SELECT mi.name, oi.quantity, oi.price
       FROM Online_Order_Item oi
       JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
       WHERE oi.online_order_id = ?`,
      [orderId]
    );

    res.json({
      ...rows[0],
      customer_status: normalizeCustomerFacingOnlineStatus(rows[0].customer_status),
      items,
    });
  } catch (error) {
    console.error("getOnlineOrderById error:", error);
    res.status(500).json({ error: "Failed to fetch order." });
  }
}

async function denyOnlineOrder(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    await db.query(
      `UPDATE Online_Orders SET customer_status = 'denied' WHERE online_order_id = ? AND customer_status = 'placed'`,
      [orderId]
    );

    res.json({ orderId, customer_status: "denied" });
  } catch (error) {
    res.status(500).json({ error: "Failed to deny order." });
  }
}

async function markOnlineOrderPaid(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT customer_status, payment_status
       FROM Online_Orders
       WHERE online_order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (rows[0].payment_status === "paid") {
      return res.status(400).json({ error: "Order is already paid." });
    }

    if (isCanceledOnlineOrderStatus(rows[0].customer_status)) {
      return res.status(400).json({ error: "Canceled orders cannot be marked paid." });
    }

    await db.query(
      `UPDATE Online_Orders SET payment_status = 'paid' WHERE online_order_id = ?`,
      [orderId]
    );

    res.json({ orderId, payment_status: "paid" });
  } catch (error) {
    console.error("markOnlineOrderPaid error:", error);
    res.status(500).json({ error: "Failed to mark order as paid." });
  }
}

async function deleteOnlineOrder(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const deleted = await db.withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT online_order_id FROM Online_Orders WHERE online_order_id = ? LIMIT 1`,
        [orderId]
      );

      if (rows.length === 0) {
        return false;
      }

      await connection.execute(
        `DELETE FROM Kitchen_Ticket WHERE online_order_id = ?`,
        [orderId]
      );

      await connection.execute(
        `DELETE FROM Online_Orders WHERE online_order_id = ?`,
        [orderId]
      );

      return true;
    });

    if (!deleted) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ orderId, deleted: true });
  } catch (error) {
    console.error("deleteOnlineOrder error:", error);
    res.status(500).json({ error: "Failed to delete online order." });
  }
}

async function getCustomerOrderHistory(req, res) {
  try {
    const customerId = req.customer.customerId;

    const orders = await db.query(
      `SELECT online_order_id, customer_status, payment_status, payment_preference,
              subtotal, tax, total, created_at
       FROM Online_Orders
       WHERE customer_num_id = ?
       ORDER BY created_at DESC`,
      [customerId]
    );

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await db.query(
        `SELECT mi.name, oi.quantity, oi.price
         FROM Online_Order_Item oi
         JOIN Menu_Item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE oi.online_order_id = ?`,
        [order.online_order_id]
      );
      return {
        ...order,
        customer_status: normalizeCustomerFacingOnlineStatus(order.customer_status),
        items,
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order history." });
  }
}

async function createCustomerReservation(req, res) {
  try {
    const customerId = Number(req.customer?.customerId);
    const { date, time, partySize, phone, occasion, notes } = req.body;
    const normalizedPhone = typeof phone === "string" && phone.trim() ? phone.replace(/\D/g, "") : null;
    const normalizedOccasion = typeof occasion === "string" && occasion.trim() ? occasion.trim().slice(0, 100) : null;
    const normalizedNotes = typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 255) : null;
    const parsedPartySize = Number(partySize);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(401).json({ error: "Customer login required." });
    }

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Reservation date is required." });
    }

    if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: "Reservation time is required." });
    }

    if (!Number.isInteger(parsedPartySize) || parsedPartySize < 1 || parsedPartySize > 8) {
      return res.status(400).json({ error: "Party size must be between 1 and 8." });
    }

    if (!normalizedPhone || !/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
    }

    const reservationDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(reservationDateTime.getTime())) {
      return res.status(400).json({ error: "Choose a valid reservation date and time." });
    }

    const result = await db.query(
      `INSERT INTO Customer_Reservation
       (customer_num_id, reservation_date, reservation_time, party_size, phone, occasion, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, date, time, parsedPartySize, normalizedPhone, normalizedOccasion, normalizedNotes]
    );

    const rows = await db.query(
      `SELECT cr.reservation_id AS reservationId,
              DATE_FORMAT(cr.reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(cr.reservation_time, '%H:%i') AS time,
              cr.party_size AS partySize, cr.phone, cr.occasion, cr.notes,
              cr.status, cr.created_at AS createdAt,
              c.first_name AS firstName, c.last_name AS lastName, c.email
       FROM Customer_Reservation cr
       JOIN Customer c ON c.customer_num_id = cr.customer_num_id
       WHERE cr.reservation_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createCustomerReservation error:", error);
    res.status(500).json({ error: "Failed to create reservation." });
  }
}

async function deactivateCustomer(req, res) {
  try {
    const customerId = Number.parseInt(req.params.customerId, 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    const rows = await db.query(
      `SELECT customer_num_id, is_active FROM Customer WHERE customer_num_id = ? LIMIT 1`,
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const newStatus = !rows[0].is_active;

    await db.query(
      `UPDATE Customer SET is_active = ? WHERE customer_num_id = ?`,
      [newStatus, customerId]
    );

    res.json({ customerId, is_active: newStatus });
  } catch (error) {
    console.error("deactivateCustomer error:", error);
    res.status(500).json({ error: "Failed to update customer status." });
  }
}

export {
  getCustomerMenu,
  createCustomerOrder,
  getCustomerOrderStatus,
  getOnlineOrders,
  confirmOnlineOrder,
  cancelOnlineOrder,
  denyOnlineOrder,
  registerCustomer,
  loginCustomer,
  getOnlineOrderById,
  markOnlineOrderPaid,
  markOrderPickedUp,
  deleteOnlineOrder,
  getCustomerOrderHistory,
  createCustomerReservation,
  deactivateCustomer,
};
