import db from "../db/index.js";
import { createValidationError } from "../validation/business-rules.js";

function toMoney(value, fieldName) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw createValidationError(`${fieldName} must be a non-negative number.`);
  }

  return Number(amount.toFixed(2));
}

async function closeOrder(payload) {
  const orderId = Number.parseInt(payload?.orderId, 10);
  const servedBy = Number.parseInt(payload?.servedBy, 10);
  const paymentMethod = payload?.paymentMethod;
  const splitCount = payload?.splitCount ? Number.parseInt(payload.splitCount, 10) : null;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createValidationError("orderId must be a positive integer.");
  }

  if (!Number.isInteger(servedBy) || servedBy <= 0) {
    throw createValidationError("servedBy must be a positive integer.");
  }

  if (!["CASH", "CREDIT", "SPLIT"].includes(paymentMethod)) {
    throw createValidationError("paymentMethod must be CASH, CREDIT, or SPLIT.");
  }

  const subtotal = toMoney(payload?.subtotal ?? 0, "subtotal");
  const tax = toMoney(payload?.tax ?? 0, "tax");
  const tipAmount = toMoney(payload?.tipAmount ?? 0, "tipAmount");
  const total = toMoney(payload?.total ?? 0, "total");
  const cashTendered = toMoney(payload?.cashTendered ?? 0, "cashTendered");

  if (paymentMethod === "CASH" && cashTendered < total) {
    throw createValidationError("Cash tendered must cover the total.");
  }

  if (paymentMethod === "SPLIT" && (!Number.isInteger(splitCount) || splitCount < 2)) {
    throw createValidationError("splitCount must be at least 2 for split payments.");
  }

  return db.withTransaction(async (connection) => {
    const [orderRows] = await connection.execute(
      `SELECT order_id, table_id, status
       FROM Orders
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );

    if (orderRows.length === 0) {
      throw createValidationError("Order not found.");
    }

    if (orderRows[0].status === "Paid") {
      throw createValidationError("Order is already paid.");
    }

    const paymentType = paymentMethod === "CASH" ? "cash" : "card";
    const changeGiven = paymentMethod === "CASH" ? Number((cashTendered - total).toFixed(2)) : 0;
    const paymentRows =
      paymentMethod === "SPLIT"
        ? Array.from({ length: splitCount }, () => ({
            amount: Number((total / splitCount).toFixed(2)),
            tipAmount: Number((tipAmount / splitCount).toFixed(2)),
            tenderedAmount: 0,
            changeGiven: 0,
          }))
        : [
            {
              amount: total,
              tipAmount,
              tenderedAmount: paymentMethod === "CASH" ? cashTendered : 0,
              changeGiven,
            },
          ];

    for (const payment of paymentRows) {
      await connection.execute(
        `INSERT INTO Payment (
          order_id,
          register_id,
          served_by,
          payment_type,
          card_type,
          card_last4,
          amount,
          tip_amount,
          tendered_amount,
          change_given,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [
          orderId,
          "REG-01",
          servedBy,
          paymentType,
          paymentType === "card" ? "visa" : null,
          paymentType === "card" ? "0000" : null,
          payment.amount,
          payment.tipAmount,
          payment.tenderedAmount,
          payment.changeGiven,
        ]
      );
    }

    await connection.execute(
      `UPDATE Orders
       SET status = 'Paid',
           subtotal = ?,
           tax = ?,
           total = ?,
           closed_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [subtotal, tax, total, orderId]
    );

    const [activeRows] = await connection.execute(
      `SELECT order_id
       FROM Orders
       WHERE table_id = ?
         AND status IN ('Open', 'Sent', 'Completed')
       LIMIT 1`,
      [orderRows[0].table_id]
    );

    if (activeRows.length === 0) {
      await connection.execute(
        `UPDATE Dining_Tables
         SET status = 'available'
         WHERE table_id = ?`,
        [orderRows[0].table_id]
      );
    }

    return {
      orderId,
      tableId: orderRows[0].table_id,
      total,
      tipAmount,
      paymentMethod,
      changeGiven,
      splitCount,
      closed: true,
    };
  });
}

export { closeOrder };
