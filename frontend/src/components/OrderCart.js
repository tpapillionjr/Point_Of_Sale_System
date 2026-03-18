import React from "react";

export default function OrderCart({
  cart,
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
      <h2 style={{ marginBottom: "12px", color: "white" }}>Current Order</h2>

      {cart.length === 0 ? (
        <p style={{ color: "#d1d5db" }}>No items added yet.</p>
      ) : (
        <div>
          {cart.map(function (item) {
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  padding: "10px",
                  borderRadius: "6px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item.name}</div>
                <div>Quantity: {item.quantity}</div>
                <div>
                  Subtotal: ${(item.price * item.quantity).toFixed(2)}
                </div>

                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <button onClick={() => increaseQuantity(item.id)}>+</button>
                  <button onClick={() => decreaseQuantity(item.id)}>-</button>
                  <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            );
          })}

          <h3 style={{ marginTop: "12px", color: "white" }}>
            Total: ${total.toFixed(2)}
          </h3>
        </div>
      )}
    </div>
  );
}