function createValidationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateOrderPayload(payload) {
  const issues = [];

  if (!payload || typeof payload !== "object") {
    throw createValidationError("Order payload is required.");
  }

  if (!Number.isInteger(payload.tableId) || payload.tableId <= 0) {
    issues.push("tableId must be a positive integer.");
  }

  if (!Number.isInteger(payload.createdBy) || payload.createdBy <= 0) {
    issues.push("createdBy must be a positive integer.");
  }

  const isTakeout = payload.orderType === "Takeout";
  if (!Number.isInteger(payload.guestCount) || payload.guestCount < 1 || (!isTakeout && payload.guestCount > 8)) {
    issues.push("guestCount must be between 1 and 8 for dine-in orders.");
  }

  if (isTakeout) {
    if (!payload.takeoutName || String(payload.takeoutName).trim().length === 0) {
      issues.push("takeoutName is required for takeout orders.");
    }
    if (!payload.takeoutPhone || String(payload.takeoutPhone).trim().length === 0) {
      issues.push("takeoutPhone is required for takeout orders.");
    }
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    issues.push("items must contain at least one order item.");
  }

  const allowedOrderTypes = new Set(["Dine_in", "Takeout", "Delivery"]);
  if (payload.orderType && !allowedOrderTypes.has(payload.orderType)) {
    issues.push("orderType must be Dine_in, Takeout, or Delivery.");
  }

  const allowedChannels = new Set(["In_Store", "Phone", "Online"]);
  if (payload.orderChannel && !allowedChannels.has(payload.orderChannel)) {
    issues.push("orderChannel must be In_Store, Phone, or Online.");
  }

  const normalizedItems = Array.isArray(payload.items)
    ? payload.items.map((item, index) => {
        const itemIssues = [];

        if (!item || typeof item !== "object") {
          itemIssues.push(`items[${index}] must be an object.`);
        }

        if (!Number.isInteger(item?.menuItemId) || item.menuItemId <= 0) {
          itemIssues.push(`items[${index}].menuItemId must be a positive integer.`);
        }

        if (!Number.isInteger(item?.quantity) || item.quantity <= 0) {
          itemIssues.push(`items[${index}].quantity must be a positive integer.`);
        }

        if (!isFiniteNumber(item?.price) || item.price < 0) {
          itemIssues.push(`items[${index}].price must be a non-negative number.`);
        }

        issues.push(...itemIssues);

        return {
          menuItemId: item?.menuItemId,
          quantity: item?.quantity,
          price: item?.price,
        };
      })
    : [];

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );

  if (normalizedItems.length > 0 && !normalizedItems.some((item) => item.price > 0)) {
    issues.push("Transaction must include at least one priced item.");
  }

  const discountAmount = payload.discountAmount ?? 0;
  const tax = payload.tax ?? 0;
  const serviceCharge = payload.serviceCharge ?? 0;

  if (![discountAmount, tax, serviceCharge].every((value) => isFiniteNumber(value) && value >= 0)) {
    issues.push("discountAmount, tax, and serviceCharge must be non-negative numbers.");
  }

  const total = subtotal - discountAmount + tax + serviceCharge;
  if (total < 0) {
    issues.push("total cannot be negative after discounts.");
  }

  if (issues.length > 0) {
    throw createValidationError("Order validation failed.", issues);
  }

  return {
    tableId: payload.tableId,
    createdBy: payload.createdBy,
    receiptNumber: payload.receiptNumber ?? null,
    orderNote: payload.orderNote?.trim() || null,
    orderType: payload.orderType ?? "Dine_in",
    orderChannel: payload.orderChannel ?? "In_Store",
    guestCount: payload.guestCount,
    isSplitCheck: Boolean(payload.isSplitCheck),
    takeoutName: isTakeout ? String(payload.takeoutName).trim() : null,
    takeoutPhone: isTakeout ? String(payload.takeoutPhone).trim() : null,
    items: normalizedItems,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    serviceCharge: Number(serviceCharge.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export { createValidationError, validateOrderPayload };
