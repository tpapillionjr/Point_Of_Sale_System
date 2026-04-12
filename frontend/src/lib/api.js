const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  let token = null;

  if (typeof window !== "undefined") {
    token = window.localStorage.getItem("authToken");
  }

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_URL}. Make sure the backend server is running.`);
  }

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

export async function createMenuItem(payload) {
  return request("/api/items", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateMenuItem(id, payload) {
  return request(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function toggleMenuItemActive(id, isActive) {
  return request(`/api/items/${id}/active`, { method: "PATCH", body: JSON.stringify({ isActive }) });
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

export async function addItemsToOrder(orderId, items, userId) {
  return request(`/api/orders/${orderId}/items`, {
    method: "POST",
    body: JSON.stringify({ items, userId }),
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
  const params = new URLSearchParams();

  if (typeof range === "string" && range) {
    params.set("range", range);
  } else if (range && typeof range === "object") {
    if (range.days) {
      params.set("days", String(range.days));
    }

    if (range.startDate) {
      params.set("startDate", range.startDate);
    }

    if (range.endDate) {
      params.set("endDate", range.endDate);
    }
  }

  const query = params.toString();
  return request(`/api/reports/overview${query ? `?${query}` : ""}`);
}

export async function getReportsDashboard(range) {
  const params = new URLSearchParams();

  if (typeof range === "string" && range) {
    params.set("range", range);
  } else if (range && typeof range === "object") {
    if (range.days) {
      params.set("days", String(range.days));
    }

    if (range.startDate) {
      params.set("startDate", range.startDate);
    }

    if (range.endDate) {
      params.set("endDate", range.endDate);
    }
  }

  const query = params.toString();
  return request(`/api/reports/dashboard${query ? `?${query}` : ""}`);
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

export async function fetchUsers() {
  return request("/api/users");
}

export async function createUser(payload) {
  return request("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUser(userId, requestingUserId) {
  return request(`/api/users/${userId}/deactivate`, {
    method: "PUT",
    body: JSON.stringify({ requestingUserId }),
  });
}

export async function verifyManager(pin) {
  return request("/api/users/verify-manager", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function fetchOnlineOrders() {
  return request("/api/customer/online-orders");
}

export async function confirmOnlineOrder(orderId) {
  return request(`/api/customer/online-orders/${orderId}/confirm`, {
    method: "PATCH",
  });
}

// Customer auth — no employee token attached
export async function customerRegister(payload) {
  const res = await fetch(`${API_URL}/api/customer/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to register.");
  return data;
}

export async function customerLogin(payload) {
  const res = await fetch(`${API_URL}/api/customer/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to login.");
  return data;
}

// Customer-facing endpoints — no auth token attached
export async function placeCustomerOrder(payload) {
  const res = await fetch(`${API_URL}/api/customer/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to place order.");
  }
  return res.json();
}

export async function fetchCustomerOrderStatus(orderId) {
  const res = await fetch(`${API_URL}/api/customer/orders/${orderId}/status`);
  if (!res.ok) throw new Error("Failed to fetch order status.");
  return res.json();
}

// Online order checkout (POS staff)
export async function fetchOnlineOrderById(orderId) {
  return request(`/api/customer/online-orders/${orderId}`);
}

export async function markOnlineOrderPaid(orderId) {
  return request(`/api/customer/online-orders/${orderId}/pay`, { method: "PATCH" });
}

export async function markOnlineOrderPickedUp(orderId) {
  return request(`/api/customer/online-orders/${orderId}/pickup`, { method: "PATCH" });
}

// Loyalty rewards — back-office (uses staff auth token via request())
export async function fetchLoyaltyRewards() {
  return request("/api/loyalty/manage/rewards");
}

export async function createLoyaltyReward(payload) {
  return request("/api/loyalty/manage/rewards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLoyaltyReward(id, payload) {
  return request(`/api/loyalty/manage/rewards/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function toggleLoyaltyReward(id) {
  return request(`/api/loyalty/manage/rewards/${id}/toggle`, {
    method: "PATCH",
  });
}

// Loyalty — customer-facing (uses customer auth token)
export async function fetchCustomerLoyaltyInfo(customerToken) {
  const res = await fetch(`${API_URL}/api/loyalty/balance`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch loyalty info.");
  return res.json();
}

export async function fetchLoyaltyRewardsPublic() {
  const res = await fetch(`${API_URL}/api/loyalty/rewards`);
  if (!res.ok) throw new Error("Failed to fetch rewards.");
  return res.json();
}

export async function redeemLoyaltyReward(customerToken, rewardId) {
  const res = await fetch(`${API_URL}/api/loyalty/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ rewardId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to redeem reward.");
  return data;
}

// Loyalty — POS staff lookup (uses staff auth token)
export async function lookupCustomerByPhone(phone) {
  return request(`/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`);
}

export async function staffAwardLoyaltyPoints(payload) {
  return request("/api/loyalty/staff-award", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
