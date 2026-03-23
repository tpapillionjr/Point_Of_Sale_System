import React, { useState } from "react";
import { useRouter } from "next/router";
import menuData from "../lib/menuData";
import MenuButton from "../components/MenuButton";
import OrderCart from "../components/OrderCart";

export default function ServerOrderPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [sentItemIds, setSentItemIds] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [orderType, setOrderType] = useState("Dine In");
  const [orderNote, setOrderNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Entrees");
  const [pendingQty, setPendingQty] = useState(1);
  const [showQtyPad, setShowQtyPad] = useState(false);
  const [qtyInput, setQtyInput] = useState("");

  const categories = ["Appetizers", "Entrees", "Sides", "Drinks"];

  let filteredMenu = [];

  for (let i = 0; i < menuData.length; i++) {
    if (menuData[i].category === selectedCategory) {
      filteredMenu.push(menuData[i]);
    }
  }

  const addToCart = (item) => {
    const qty = pendingQty;
    let found = false;
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let currentItem = cart[i];

      if (currentItem.id === item.id) {
        newCart.push({
          ...currentItem,
          quantity: currentItem.quantity + qty,
        });
        found = true;
      } else {
        newCart.push(currentItem);
      }
    }

    if (found === false) {
      newCart.push({
        ...item,
        quantity: qty,
      });
    }

    setCart(newCart);
    setPendingQty(1);
  };

  const handleQtyDigit = (digit) => {
    setQtyInput((prev) => (prev + digit).slice(0, 3));
  };

  const handleQtyConfirm = () => {
    const parsed = parseInt(qtyInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPendingQty(parsed);
    }
    setQtyInput("");
    setShowQtyPad(false);
  };

  const handleQtyClear = () => {
    setQtyInput("");
  };

  const increaseQuantity = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let item = cart[i];

      if (item.id === id) {
        newCart.push({
          ...item,
          quantity: item.quantity + 1,
        });
      } else {
        newCart.push(item);
      }
    }

    setCart(newCart);
  };

  const decreaseQuantity = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      let item = cart[i];

      if (item.id === id) {
        let newQuantity = item.quantity - 1;

        if (newQuantity > 0) {
          newCart.push({
            ...item,
            quantity: newQuantity,
          });
        }
      } else {
        newCart.push(item);
      }
    }

    setCart(newCart);
  };

  const removeItem = (id) => {
    let newCart = [];

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id !== id) {
        newCart.push(cart[i]);
      }
    }

    setCart(newCart);
  };

  const handleSubmitOrder = (action) => {
    const orderData = {
      tableNumber: tableNumber,
      guestCount: guestCount,
      orderType: orderType,
      orderNote: orderNote,
      action: action,
      cart: cart,
    };

    const newSentIds = cart.map((item) => item.id);
    setSentItemIds((prev) => [...new Set([...prev, ...newSentIds])]);

    console.log("Submitted Order:", orderData);
    alert(`Order sent as: ${action}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        color: "#111827",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0 }}>Server Order Entry</h1>
        <p style={{ marginTop: "6px", color: "#6b7280", margin: "6px 0 0" }}>Select a table, add items, and submit the order.</p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Table Number</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Guest Count</label>
          <input
            type="number"
            min="1"
            max="20"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
          >
            <option>Dine In</option>
            <option>Takeout</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Order Note</label>
          <input
            type="text"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Special instructions"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              color: "#111827",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 320px",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>Categories</h2>

          {categories.map(function (category) {
            const isActive = category === selectedCategory;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  border: "none",
                  borderRadius: "10px",
                  backgroundColor: isActive ? "#2563eb" : "#f3f4f6",
                  color: isActive ? "white" : "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "left",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "600", color: "#111827" }}>{selectedCategory}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {filteredMenu.map(function (item) {
              return (
                <MenuButton
                  key={item.id}
                  item={item}
                  addToCart={addToCart}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            position: "sticky",
            top: "16px",
          }}
        >
          <OrderCart
            cart={cart}
            sentItemIds={sentItemIds}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeItem={removeItem}
          />

          {/* QTY button */}
          <button
            onClick={() => { setQtyInput(""); setShowQtyPad(true); }}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "12px",
              border: "2px solid",
              borderColor: pendingQty > 1 ? "#f59e0b" : "#d1d5db",
              borderRadius: "10px",
              backgroundColor: pendingQty > 1 ? "#fef3c7" : "#f9fafb",
              color: pendingQty > 1 ? "#92400e" : "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            {pendingQty > 1 ? `QTY: ${pendingQty} — tap an item` : "QTY"}
          </button>

          <div
            style={{
              marginTop: "8px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <button
              onClick={() => handleSubmitOrder("SEND")}
              style={{
                padding: "14px 8px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#16a34a",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              SEND
            </button>

            <button
              onClick={() => handleSubmitOrder("TAKE OUT")}
              style={{
                padding: "14px 8px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              TAKE OUT
            </button>

            <button
              onClick={() => handleSubmitOrder("RUSH")}
              style={{
                padding: "14px 8px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#dc2626",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              RUSH
            </button>

            <button
              onClick={() => handleSubmitOrder("NO MAKE")}
              style={{
                padding: "14px 8px",
                border: "none",
                borderRadius: "10px",
                backgroundColor: "#6b7280",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              NO MAKE
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.setItem("currentOrder", JSON.stringify({
                tableNumber,
                guestCount,
                orderType,
                orderNote,
                cart,
              }));
              router.push("/checkout");
            }}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#111827",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            CLOSE TAB
          </button>
        </div>
      </div>

      {/* Numpad modal */}
      {showQtyPad && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowQtyPad(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "260px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
              Enter Quantity
            </p>

            {/* Display */}
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "right",
                fontSize: "28px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "12px",
                minHeight: "54px",
              }}
            >
              {qtyInput || "0"}
            </div>

            {/* Digit grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {["7","8","9","4","5","6","1","2","3"].map((d) => (
                <button
                  key={d}
                  onClick={() => handleQtyDigit(d)}
                  style={{
                    padding: "16px",
                    fontSize: "18px",
                    fontWeight: "600",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={handleQtyClear}
                style={{
                  padding: "16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  cursor: "pointer",
                }}
              >
                CLR
              </button>
              <button
                onClick={() => handleQtyDigit("0")}
                style={{
                  padding: "16px",
                  fontSize: "18px",
                  fontWeight: "600",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                0
              </button>
              <button
                onClick={handleQtyConfirm}
                style={{
                  padding: "16px",
                  fontSize: "13px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}