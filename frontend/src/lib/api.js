const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://point-of-sale-system-group4.vercel.app/";

export async function fetchItems() {
  const res = await fetch(`${API_URL}/api/items`);
  return res.json();
}

export async function getReportSummary() {
  const res = await fetch(`${API_URL}/api/reports/summary`);
  if (!res.ok) {
    throw new Error("Failed to fetch report summary");
  }
  return res.json();
}

export async function getTopSellingItems() {
  const res = await fetch(`${API_URL}/api/reports/top-items`);
  if (!res.ok) {
    throw new Error("Failed to fetch top selling items");
  }
  return res.json();
}

export async function getLowInventoryItems() {
  const res = await fetch(`${API_URL}/api/reports/low-inventory`);
  if (!res.ok) {
    throw new Error("Failed to fetch low inventory items");
  }
  return res.json();
}