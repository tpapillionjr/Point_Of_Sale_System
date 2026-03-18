import React from "react";

export default function MenuButton({ item, addToCart }) {
  return (
    <button
      onClick={() => addToCart(item)}
      style={{
        width: "100%",
        minHeight: "90px",
        border: "1px solid #444",
        borderRadius: "8px",
        backgroundColor: "#f3f4f6",
        color: "#111827",
        padding: "12px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "16px",
        fontWeight: "bold",
      }}
    >
      <div>{item.name}</div>
      <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: "normal" }}>
        ${item.price.toFixed(2)}
      </div>
    </button>
  );
}