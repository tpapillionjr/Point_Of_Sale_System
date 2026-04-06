import db from "../db/index.js";

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

export { getCustomerMenu };
