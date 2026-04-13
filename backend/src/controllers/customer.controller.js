import db from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const CUSTOMER_JWT_SECRET = process.env.JWT_SECRET;
const CUSTOMER_JWT_EXPIRES_IN = "7d";

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

    // Validate name characters - only allow alphanumeric, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z0-9\s\-']*$/.test(firstName.trim())) {
      return res.status(400).json({ error: "First name contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed." });
    }

    if (!/^[a-zA-Z0-9\s\-']*$/.test(lastName.trim())) {
      return res.status(400).json({ error: "Last name contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed." });
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
      `SELECT customer_num_id, first_name, last_name, email, password_hash, points_balance
       FROM Customer WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const customer = rows[0];
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
      pointsBalance: customer.points_balance,
    });
  } catch (error) {
    console.error("loginCustomer error:", error);
    res.status(500).json({ error: "Failed to login." });
  }
}

const TAX_RATE = 0.0825;

function normalizeCategory(value) {
  const category = value || "Other";
  return String(category).toLowerCase() === "entree" ? "Entrees" : category;
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

      await connection.execute(
        `INSERT INTO Kitchen_Ticket (order_id, online_order_id, table_id, status, created_at, updated_at)
         VALUES (NULL, ?, 1, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [onlineOrderId]
      );

      // If paying online, mark as paid immediately — triggers loyalty points award
      if (paymentPreference === "online" && orderCustomerId) {
        await connection.execute(
          `UPDATE Online_Orders SET payment_status = 'paid' WHERE online_order_id = ?`,
          [onlineOrderId]
        );
      }

      // If a reward was selected, deduct points and log the transaction now that we have the order ID
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

    res.json({ orderId, status: rows[0].customer_status });
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

    const grouped = {};
    for (const item of rows) {
      const cat = normalizeCategory(item.category);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    res.json(grouped);
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
       WHERE customer_status != 'picked_up'
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

    await db.query(
      `UPDATE Online_Orders SET customer_status = 'confirmed' WHERE online_order_id = ?`,
      [orderId]
    );

    res.json({ orderId, customer_status: "confirmed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm order." });
  }
}

async function markOrderPickedUp(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
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

    res.json({ ...rows[0], items });
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
      `SELECT payment_status FROM Online_Orders WHERE online_order_id = ? LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (rows[0].payment_status === "paid") {
      return res.status(400).json({ error: "Order is already paid." });
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
      return { ...order, items };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order history." });
  }
}

export { getCustomerMenu, createCustomerOrder, getCustomerOrderStatus, getOnlineOrders, confirmOnlineOrder, denyOnlineOrder, registerCustomer, loginCustomer, getOnlineOrderById, markOnlineOrderPaid, markOrderPickedUp, getCustomerOrderHistory };
