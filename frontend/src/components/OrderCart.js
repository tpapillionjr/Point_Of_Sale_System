import React from "react";

export default function OrderCart({
  cart,
  sentItemIds = [],
  increaseQuantity,
  decreaseQuantity,
  removeItem,
}) {
  let total = 0;

  for (let i = 0; i < cart.length; i++) {
    total = total + cart[i].price * cart[i].quantity;
  }

  return (
    <div>
      <h2 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>Current Order</h2>

      {cart.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>No items added yet.</p>
      ) : (
        <div>
          {cart.map(function (item) {
            const isSent = sentItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: isSent ? "#dcfce7" : "#fef9c3",
                  border: `1px solid ${isSent ? "#86efac" : "#fde047"}`,
                  color: "#111827",
                  padding: "10px",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "14px", color: isSent ? "#15803d" : "#854d0e" }}>
                  {item.name}{isSent ? " *" : ""}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Quantity: {item.quantity}</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Subtotal: ${(item.price * item.quantity).toFixed(2)}
                </div>

                <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => increaseQuantity(item.id)}
                    style={{ padding: "2px 10px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px" }}
                  >+</button>
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    style={{ padding: "2px 10px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px" }}
                  >-</button>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ padding: "2px 10px", borderRadius: "6px", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}
                  >Remove</button>
                </div>
              </div>
            );
          })}

          <h3 style={{ marginTop: "12px", fontWeight: "700", color: "#111827", fontSize: "15px" }}>
            Total: ${total.toFixed(2)}
          </h3>
        </div>
      )}
    </div>
  );
}