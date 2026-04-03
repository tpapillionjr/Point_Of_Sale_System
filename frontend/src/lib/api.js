const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://point-of-sale-system-group4.vercel.app/";

async function request(path, options = {}) {
  let token = null;

  if (typeof window !== "undefined") {
    token = window.localStorage.getItem("authToken");
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = "Request failed";

    try {
      const payload = await res.json();
      errorMessage = payload.error || errorMessage;
      if (Array.isArray(payload.details) && payload.details.length > 0) {
        errorMessage = `${errorMessage} ${payload.details.join(" ")}`;
      }
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

export async function fetchBackOfficeDashboard() {
  return request("/api/back-office/dashboard");
}

export async function fetchBackOfficeData(range) {
  const query = range ? `?range=${encodeURIComponent(range)}` : "";
  return request(`/api/back-office/data${query}`);
}

export async function fetchTables() {
  return request("/api/tables");
}

export async function fetchKitchenTickets() {
  return request("/api/kitchen/tickets");
}

export async function updateKitchenTicket(ticketId, payload) {
  return request(`/api/kitchen/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export async function cancelOrder(payload) {
  return request("/api/orders/cancel", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchActiveOrderByTable(tableNumber) {
  return request(`/api/orders/active-by-table/${tableNumber}`);
}

export async function closeOrder(payload) {
  return request("/api/payments/close-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReportSummary() {
  return request("/api/reports/overview");
}

export async function getReportsOverview(range) {
  const query = range ? `?range=${encodeURIComponent(range)}` : "";
  return request(`/api/reports/overview${query}`);
}

export async function getReportsDashboard(range) {
  const query = range ? `?range=${encodeURIComponent(range)}` : "";
  return request(`/api/reports/dashboard${query}`);
}

export async function authenticateShift(pin) {
  return request("/api/shifts/auth", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function clockInShift() {
  return request("/api/shifts/clock-in", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function clockOutShift(tipDeclaredAmount) {
  return request("/api/shifts/clock-out", {
    method: "POST",
    body: JSON.stringify({ tipDeclaredAmount }),
  });
}
