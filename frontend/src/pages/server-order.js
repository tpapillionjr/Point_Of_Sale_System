import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import menuData from "../lib/menuData";
import MenuButton from "../components/MenuButton";
import OrderCart from "../components/OrderCart";
import { createOrder, fetchTables } from "../lib/api";

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
  const [tables, setTables] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const categories = ["Appetizers", "Entrees", "Sides", "Drinks"];
  const supportedMenu = useMemo(() => menuData, []);
  const filteredMenu = useMemo(
    () => supportedMenu.filter((item) => item.category === selectedCategory),
    [selectedCategory, supportedMenu]
  );

  useEffect(() => {
    const storedEmployee = localStorage.getItem("currentEmployee");
    if (storedEmployee) {
      setEmployee(JSON.parse(storedEmployee));
    }

    async function loadTables() {
      try {
        const rows = await fetchTables();
        setTables(rows);
        if (rows.length > 0) {
          setTableNumber(String(rows[0].tableNumber));
        }
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      }
    }

    loadTables();
  }, []);

  const addToCart = (item) => {
    const qty = pendingQty;
    let found = false;
    const newCart = [];

    for (let i = 0; i < cart.length; i += 1) {
      const currentItem = cart[i];

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

    if (!found) {
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
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPendingQty(parsed);
    }
    setQtyInput("");
    setShowQtyPad(false);
  };

  const handleQtyClear = () => {
    setQtyInput("");
  };

  const increaseQuantity = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  async function handleSubmitOrder(action) {
    if (!employee?.userId) {
      setMessage({ type: "error", text: "Clock in and log in before sending an order." });
      return;
    }

    const selectedTable = tables.find((table) => String(table.tableNumber) === String(tableNumber));
    if (!selectedTable) {
      setMessage({ type: "error", text: "Select a valid table." });
      return;
    }

    if (cart.length === 0) {
      setMessage({ type: "error", text: "Add at least one item to the order." });
      return;
    }

    const payload = {
      tableId: selectedTable.tableId,
      createdBy: employee.userId,
      guestCount: Number(guestCount),
      orderType: action === "TAKE OUT" ? "Takeout" : "Dine_in",
      orderChannel: action === "TAKE OUT" ? "Phone" : "In_Store",
      orderNote: action === "RUSH" ? [orderNote, "RUSH"].filter(Boolean).join(" - ") : orderNote,
      items: cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      discountAmount: 0,
      tax: 0,
      serviceCharge: 0,
      isSplitCheck: false,
    };

    try {
      setIsSubmitting(true);
      const order = await createOrder(payload);
      const newSentIds = cart.map((item) => item.id);
      setSentItemIds((prev) => [...new Set([...prev, ...newSentIds])]);
      setSubmittedOrder(order);
      setMessage({
        type: "success",
        text: `Order #${order.orderId} sent successfully for table ${selectedTable.tableNumber}.`,
      });
      localStorage.setItem(
        "currentOrder",
        JSON.stringify({
          orderId: order.orderId,
          tableNumber,
          guestCount,
          orderType,
          orderNote,
          cart,
        })
      );
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "auto",
        backgroundColor: "transparent",
        color: "#111827",
        padding: 0,
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
        <p style={{ marginTop: "6px", color: "#6b7280", margin: "6px 0 0" }}>
          Select a live table, add items, and submit the order.
        </p>
        {message && (
          <p style={{ margin: "12px 0 0", color: message.type === "error" ? "#b91c1c" : "#166534", fontWeight: "600" }}>
            {message.text}
          </p>
        )}
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
          <select
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
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
          >
            {tables
              .filter((table) => table.status !== "occupied")
              .map((table) => (
              <option key={table.tableId} value={table.tableNumber}>
                Table {table.tableNumber} ({table.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Guest Count</label>
          <input
            type="number"
            min="1"
            max="8"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
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

          {categories.map((category) => {
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
            {filteredMenu.map((item) => (
              <MenuButton key={item.id} item={item} addToCart={addToCart} />
            ))}
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

          <button
            onClick={() => {
              setQtyInput("");
              setShowQtyPad(true);
            }}
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
              disabled={isSubmitting}
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
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              SEND
            </button>

            <button
              onClick={() => handleSubmitOrder("TAKE OUT")}
              disabled={isSubmitting}
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
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              TAKE OUT
            </button>

            <button
              onClick={() => handleSubmitOrder("RUSH")}
              disabled={isSubmitting}
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
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              RUSH
            </button>

            <button
              onClick={() => setCart([])}
              disabled={isSubmitting}
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
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              CLEAR
            </button>
          </div>

          <button
            onClick={() => {
              if (!submittedOrder?.orderId) {
                setMessage({
                  type: "error",
                  text: "Send the order successfully before closing the tab.",
                });
                return;
              }

              localStorage.setItem(
                "currentOrder",
                JSON.stringify({
                  orderId: submittedOrder.orderId,
                  tableNumber,
                  guestCount,
                  orderType,
                  orderNote,
                  cart,
                })
              );
              router.push("/checkout");
            }}
            disabled={cart.length === 0 || !submittedOrder?.orderId}
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
              opacity: cart.length === 0 || !submittedOrder?.orderId ? 0.6 : 1,
            }}
          >
            CLOSE TAB
          </button>
        </div>
      </div>

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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleQtyDigit(digit)}
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
                  {digit}
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
