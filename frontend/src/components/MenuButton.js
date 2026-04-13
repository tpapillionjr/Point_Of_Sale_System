import React from "react";
import { isBeverageCategory } from "../lib/menuCategories";

export default function MenuButton({ item, addToCart, showDetails = false }) {
  const isDrink = isBeverageCategory(item.category);

  return (
    <button
      onClick={() => addToCart(item)}
      style={{
        width: "100%",
        minHeight: showDetails ? (isDrink ? "230px" : "150px") : "90px",
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
      {showDetails && item.photoUrl ? (
        <div
          style={{
            width: "100%",
            height: isDrink ? "160px" : "84px",
            marginBottom: "8px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#e5e7eb",
          }}
        >
          <img
            src={item.photoUrl}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ) : null}
      <div>{item.name}</div>
      {showDetails && !isDrink ? (
        <>
          {item.description?.trim() ? (
            <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: "normal", color: "#374151", lineHeight: 1.4 }}>
              {item.description.trim()}
            </div>
          ) : null}
          {item.commonAllergens?.trim() ? (
            <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: "#92400e", lineHeight: 1.3 }}>
              Allergens: {item.commonAllergens.trim()}
            </div>
          ) : null}
        </>
      ) : null}
      <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: "normal" }}>
        ${item.price.toFixed(2)}
      </div>
    </button>
  );
}
