import db from "../db/index.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MENU_UPLOAD_DIR = path.join(__dirname, "../../uploads/menu-items");
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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

function menuItemPayload(body) {
  const { name, category, basePrice, description, photoUrl, photoDataUrl, commonAllergens } = body ?? {};
  return {
    name,
    category,
    basePrice,
    description: normalizeOptionalText(description),
    photoUrl: normalizeOptionalText(photoUrl, 2048),
    photoDataUrl: normalizeOptionalText(photoDataUrl),
    commonAllergens: normalizeOptionalText(commonAllergens, 255),
  };
}

async function saveMenuItemPhoto(photoDataUrl) {
  if (!photoDataUrl) {
    return null;
  }

  const match = photoDataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    const error = new Error("Photo must be a JPEG, PNG, WebP, or GIF image.");
    error.statusCode = 400;
    throw error;
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_PHOTO_BYTES) {
    const error = new Error("Photo must be 5 MB or smaller.");
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(MENU_UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${PHOTO_EXTENSIONS[mimeType]}`;
  await fs.writeFile(path.join(MENU_UPLOAD_DIR, filename), buffer);
  return `/uploads/menu-items/${filename}`;
}

function menuItemResponse(row) {
  return {
    menuItemId: row.menuItemId,
    name: row.name,
    category: row.category,
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
  const { name, category, basePrice, description, photoUrl, photoDataUrl, commonAllergens } = menuItemPayload(req.body);

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const savedPhotoUrl = await saveMenuItemPhoto(photoDataUrl);
    const [result] = await db.pool.execute(
      `INSERT INTO Menu_Item
         (name, category, base_price, description, photo_url, common_allergens, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [name.trim(), category?.trim() || "Uncategorized", price.toFixed(2), description, savedPhotoUrl ?? photoUrl, commonAllergens]
    );
    res.status(201).json({
      menuItemId: result.insertId,
      name: name.trim(),
      category: category?.trim() || "Uncategorized",
      basePrice: price,
      description: description ?? "",
      photoUrl: savedPhotoUrl ?? photoUrl ?? "",
      commonAllergens: commonAllergens ?? "",
      isActive: true,
    });
  } catch (error) {
    console.error("Failed to create menu item:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to create menu item" });
  }
}

async function updateItem(req, res) {
  const menuItemId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const { name, category, basePrice, description, photoUrl, photoDataUrl, commonAllergens } = menuItemPayload(req.body);

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  const price = Number(basePrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: "basePrice must be a non-negative number." });
  }

  try {
    const savedPhotoUrl = await saveMenuItemPhoto(photoDataUrl);
    const [result] = await db.pool.execute(
      `UPDATE Menu_Item
       SET name = ?, category = ?, base_price = ?, description = ?, photo_url = ?, common_allergens = ?
       WHERE menu_item_id = ?`,
      [
        name.trim(),
        category?.trim() || "Uncategorized",
        price.toFixed(2),
        description,
        savedPhotoUrl ?? photoUrl,
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
      category: category?.trim() || "Uncategorized",
      basePrice: price,
      description: description ?? "",
      photoUrl: savedPhotoUrl ?? photoUrl ?? "",
      commonAllergens: commonAllergens ?? "",
    });
  } catch (error) {
    console.error("Failed to update menu item:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.statusCode ? error.message : "Failed to update menu item" });
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
