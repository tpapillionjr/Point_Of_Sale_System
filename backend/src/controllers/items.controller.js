import db from "../db/index.js";

function normalizeOptionalText(value, maxLength = null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

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

function menuItemPayload(body) {
  const { name, category, basePrice, description, photoUrl, commonAllergens } = body ?? {};
  return {
    name,
    category: normalizeCategory(category),
    basePrice,
    description: normalizeOptionalText(description),
    photoUrl: normalizeOptionalText(photoUrl, 2048),
    commonAllergens: normalizeOptionalText(commonAllergens, 255),
  };
}

function normalizeCategory(value) {
  const category = normalizeOptionalText(value, 50);
  if (!category) {
    return "Uncategorized";
  }

  return CATEGORY_ALIASES[category.toLowerCase()] ?? category;
}

function menuItemResponse(row) {
  return {
    menuItemId: row.menuItemId,
    name: row.name,
    category: normalizeCategory(row.category),
    basePrice: Number(row.basePrice ?? 0),
    description: row.description ?? "",
    photoUrl: row.photoUrl ?? "",
    commonAllergens: row.commonAllergens ?? "",
    isActive: Boolean(row.isActive),
  };
}

async function getItems(req, res) {
  try {
    const rows = await db.query(
      `SELECT menu_item_id AS menuItemId, name, COALESCE(category, 'Uncategorized') AS category,
              base_price AS basePrice, description, photo_url AS photoUrl,
              common_allergens AS commonAllergens, is_active AS isActive
       FROM Menu_Item
       ORDER BY is_active DESC, name ASC`
    );
    res.json(rows.map(menuItemResponse));
  } catch (error) {
    console.error("Failed to fetch menu items:", error.message);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
}

async function createItem(req, res) {
  const { name, category, basePrice, description, photoUrl, commonAllergens } = menuItemPayload(req.body);

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const [result] = await db.pool.execute(
      `INSERT INTO Menu_Item
         (name, category, base_price, description, photo_url, common_allergens, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [name.trim(), category, price.toFixed(2), description, photoUrl, commonAllergens]
    );
    res.status(201).json({
      menuItemId: result.insertId,
      name: name.trim(),
      category,
      basePrice: price,
      description: description ?? "",
      photoUrl: photoUrl ?? "",
      commonAllergens: commonAllergens ?? "",
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

  const { name, category, basePrice, description, photoUrl, commonAllergens } = menuItemPayload(req.body);

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const [result] = await db.pool.execute(
      `UPDATE Menu_Item
       SET name = ?, category = ?, base_price = ?, description = ?, photo_url = ?, common_allergens = ?
       WHERE menu_item_id = ?`,
      [
        name.trim(),
        category,
        price.toFixed(2),
        description,
        photoUrl,
        commonAllergens,
        menuItemId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({
      menuItemId,
      name: name.trim(),
      category,
      basePrice: price,
      description: description ?? "",
      photoUrl: photoUrl ?? "",
      commonAllergens: commonAllergens ?? "",
    });
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
