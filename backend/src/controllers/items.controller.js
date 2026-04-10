import db from "../db/index.js";

async function getItems(req, res) {
  try {
    const rows = await db.query(
      `SELECT menu_item_id AS menuItemId, name, COALESCE(category, 'Uncategorized') AS category,
              base_price AS basePrice, is_active AS isActive
       FROM Menu_Item
       ORDER BY is_active DESC, name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch menu items:", error.message);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
}

async function createItem(req, res) {
  const { name, category, basePrice } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const [result] = await db.pool.execute(
      `INSERT INTO Menu_Item (name, category, base_price, is_active) VALUES (?, ?, ?, TRUE)`,
      [name.trim(), category?.trim() || "Uncategorized", price.toFixed(2)]
    );
    res.status(201).json({
      menuItemId: result.insertId,
      name: name.trim(),
      category: category?.trim() || "Uncategorized",
      basePrice: price,
      isActive: true,
    });
  } catch (error) {
    console.error("Failed to create menu item:", error.message);
    res.status(500).json({ error: "Failed to create menu item" });
  }
}

async function updateItem(req, res) {
  const menuItemId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const { name, category, basePrice } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const [result] = await db.pool.execute(
      `UPDATE Menu_Item SET name = ?, category = ?, base_price = ? WHERE menu_item_id = ?`,
      [name.trim(), category?.trim() || "Uncategorized", price.toFixed(2), menuItemId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({ menuItemId, name: name.trim(), category: category?.trim() || "Uncategorized", basePrice: price });
  } catch (error) {
    console.error("Failed to update menu item:", error.message);
    res.status(500).json({ error: "Failed to update menu item" });
  }
}

async function toggleItemActive(req, res) {
  const menuItemId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const { isActive } = req.body ?? {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive must be a boolean." });
  }

  try {
    const [result] = await db.pool.execute(
      `UPDATE Menu_Item SET is_active = ? WHERE menu_item_id = ?`,
      [isActive, menuItemId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({ menuItemId, isActive });
  } catch (error) {
    console.error("Failed to toggle menu item:", error.message);
    res.status(500).json({ error: "Failed to update menu item status" });
  }
}

export { getItems, createItem, updateItem, toggleItemActive };
