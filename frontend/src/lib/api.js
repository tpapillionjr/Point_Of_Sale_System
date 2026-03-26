const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://point-of-sale-system-group4.vercel.app/";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = "Request failed";

    try {
      const payload = await res.json();
      errorMessage = payload.error || errorMessage;
    } catch {
      errorMessage = `Request failed with status ${res.status}`;
    }

    throw new Error(errorMessage);
  }

  return res.json();
}

export async function fetchItems() {
  return request("/api/items");
}

export async function fetchTables() {
  return request("/api/tables");
}

export async function updateTableStatus(tableId, status) {
  return request(`/api/tables/${tableId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createOrder(payload) {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export async function authenticateShift(pin) {
  return request("/api/shifts/auth", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function clockInShift(pin) {
  return request("/api/shifts/clock-in", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function clockOutShift(pin, tipDeclaredAmount) {
  return request("/api/shifts/clock-out", {
    method: "POST",
    body: JSON.stringify({ pin, tipDeclaredAmount }),
  });
}
