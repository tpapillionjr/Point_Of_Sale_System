import db from "../db/index.js";

const ONLINE_TABLE_ID = 9999;
const SYSTEM_USER_ID = 9999;
const TAX_RATE = 0.0825;

async function createCustomerOrder(req, res) {
  try {
    const { firstName, lastName, email, phone, note, cart, paymentPreference } = req.body;

    if (!firstName || !lastName || !email || !phone || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const payment = paymentPreference === "online" ? "online" : "in_store";

    const subtotal = cart.reduce((sum, item) => sum + Number(item.base_price) * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const orderNote = `${firstName} ${lastName} | ${phone}${note ? " | " + note : ""}`;

    const result = await db.withTransaction(async (connection) => {
      const [orderResult] = await connection.execute(
        `INSERT INTO Orders (table_id, created_by, order_note, order_type, guest_count, subtotal, tax, total, customer_status, payment_preference)
         VALUES (?, ?, ?, 'Online', 1, ?, ?, ?, 'placed', ?)`,
        [ONLINE_TABLE_ID, SYSTEM_USER_ID, orderNote, subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2), payment]
      );

      const orderId = orderResult.insertId;

      for (const item of cart) {
        await connection.execute(
          `INSERT INTO Order_Item (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [orderId, item.menu_item_id, item.quantity, Number(item.base_price)]
        );
      }

      await connection.execute(
        `INSERT INTO Kitchen_Ticket (order_id, table_id, status, created_at, updated_at)
         VALUES (?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [orderId, ONLINE_TABLE_ID]
      );

      return orderId;
    });

    res.status(201).json({ orderId: result });
  } catch (error) {
    console.error("createCustomerOrder error:", error);
    res.status(500).json({ error: "Failed to place order." });
  }
}

async function getCustomerOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const rows = await db.query(
      `SELECT customer_status FROM Orders WHERE order_id = ? LIMIT 1`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ orderId, status: rows[0].customer_status });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order status." });
  }
}

async function getCustomerMenu(req, res) {
  try {
    const rows = await db.query(
      `SELECT menu_item_id, name, category, base_price
       FROM Menu_Item
       WHERE is_active = true
       ORDER BY category ASC, name ASC`
    );

    const grouped = {};
    for (const item of rows) {
      const cat = item.category ?? "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu." });
  }
}

export { getCustomerMenu, createCustomerOrder, getCustomerOrderStatus };
