const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchItems() {
  const res = await fetch(`${API_URL}/api/items`);
  return res.json();
}