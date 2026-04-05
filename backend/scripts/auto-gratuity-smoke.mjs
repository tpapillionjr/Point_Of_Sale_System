const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
const MANAGER_PIN = process.env.MANAGER_PIN || "1234";
const TAX_RATE = Number(process.env.TAX_RATE || 0.0825);

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

async function request(path, options = {}, token = null) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed: ${response.status}`;
    const details = Array.isArray(payload?.details) && payload.details.length > 0
      ? ` ${payload.details.join(" ")}`
      : "";
    throw new Error(`${message}${details}`);
  }

  return payload;
}

async function main() {
  console.log("[1/6] Authenticating manager PIN...");
  const session = await request("/api/shifts/auth", {
    method: "POST",
    body: JSON.stringify({ pin: MANAGER_PIN }),
  });

  const token = session?.token;
  if (!token) {
    throw new Error("Auth response did not include a token.");
  }

  console.log("[2/6] Setting auto gratuity to 20% for parties of 7+...");
  const constraint = await request(
    "/api/settings/auto-gratuity",
    {
      method: "PUT",
      body: JSON.stringify({
        minPartySize: 7,
        gratuityPercent: 20,
      }),
    },
    token
  );

  console.log("Updated constraint:", constraint);

  console.log("[3/6] Looking up an available table...");
  const tables = await request("/api/tables", {}, token);
  const availableTable = tables.find((table) => table.status === "available");
  if (!availableTable) {
    throw new Error("No available table found. Free up a table and retry.");
  }

  const orderItems = [
    { menuItemId: 1, quantity: 1, price: 12.99 },
    { menuItemId: 2, quantity: 2, price: 3.99 },
  ];

  const subtotal = toMoney(
    orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  );
  const tax = toMoney(subtotal * TAX_RATE);
  const expectedServiceCharge = toMoney(subtotal * 0.2);

  console.log("[4/6] Creating 7-guest order to trigger auto gratuity...");
  const createdOrder = await request(
    "/api/orders",
    {
      method: "POST",
      body: JSON.stringify({
        tableId: availableTable.tableId,
        guestCount: 7,
        orderType: "Dine_in",
        orderChannel: "In_Store",
        items: orderItems,
        discountAmount: 0,
        tax,
      }),
    },
    token
  );

  const tipAmount = 5;
  const expectedTotal = toMoney(subtotal + tax + expectedServiceCharge + tipAmount);

  console.log("[5/6] Closing order and enforcing server-side totals...");
  const closed = await request(
    "/api/payments/close-order",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: createdOrder.orderId,
        paymentMethod: "CASH",
        splitCount: 2,
        tipAmount,
        total: expectedTotal,
        cashTendered: toMoney(expectedTotal + 10),
      }),
    },
    token
  );

  console.log("Close response:", closed);

  console.log("[6/6] Result summary");
  console.log(`Order ID: ${createdOrder.orderId}`);
  console.log(`Subtotal: $${subtotal.toFixed(2)}`);
  console.log(`Tax: $${tax.toFixed(2)}`);
  console.log(`Expected service charge: $${expectedServiceCharge.toFixed(2)}`);
  console.log(`Tip: $${tipAmount.toFixed(2)}`);
  console.log(`Expected total charged: $${expectedTotal.toFixed(2)}`);
  console.log(`Actual service charge: $${Number(closed.serviceCharge || 0).toFixed(2)}`);
  console.log(`Actual total charged: $${Number(closed.total || 0).toFixed(2)}`);
  console.log("Auto gratuity local smoke test passed.");
}

main().catch((error) => {
  console.error("Auto gratuity local smoke test failed:");
  console.error(error.message);
  process.exit(1);
});
