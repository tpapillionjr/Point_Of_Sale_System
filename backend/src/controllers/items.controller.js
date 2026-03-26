import db from "../db/index.js";

async function getItems(req, res) {
  try {
    const rows = await db.query(
      `SELECT id, name, sku, category, price, stock_quantity, created_at, updated_at
       FROM items
       ORDER BY id ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch items:", error.message);
    res.status(500).json({ error: "Failed to fetch items" });
  }
}

export { getItems };
