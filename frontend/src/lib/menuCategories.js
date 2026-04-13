export const MENU_CATEGORIES = ["Beverages", "Entrees", "Sandwiches", "Waffles", "Bowls", "Sides"];

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

export function normalizeMenuCategory(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (!key) {
    return "Entrees";
  }

  return CATEGORY_ALIASES[key] || "Entrees";
}

export function isBeverageCategory(value) {
  return normalizeMenuCategory(value) === "Beverages";
}
