import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cancelOrder, closeOrder, fetchActiveOrderByTable } from "../lib/api";

const TAX_RATE = 0.0825;

const TIP_PRESETS = [15, 18, 20];

export default function CheckoutPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedTipPct, setSelectedTipPct] = useState(null);
  const [customTipInput, setCustomTipInput] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState(null); // "CASH" | "CREDIT" | "SPLIT"
  const [cashInput, setCashInput] = useState("");
  const [splitCount, setSplitCount] = useState(2);
  const [stage, setStage] = useState("payment"); // "payment" | "complete"
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentOrder");
    setOrder(stored ? JSON.parse(stored) : null);
    const storedEmployee = localStorage.getItem("currentEmployee");
    setEmployee(storedEmployee ? JSON.parse(storedEmployee) : null);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    async function recoverOrderId() {
      if (!order?.tableNumber || order?.orderId) {
        return;
      }

      try {
        const activeOrder = await fetchActiveOrderByTable(order.tableNumber);
        setOrder((current) =>
          current
            ? {
                ...current,
                orderId: activeOrder.orderId,
              }
            : current
        );
        setMessage(null);
      } catch (error) {
        setMessage(error.message);
      }
    }

    recoverOrderId();
  }, [order?.orderId, order?.tableNumber]);

  if (!isHydrated) {
    return null;
  }

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>No active order found.</p>
          <button
            onClick={() => router.push("/server-order")}
            style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#111827", color: "white", fontWeight: "600", cursor: "pointer" }}
          >
            ← Back to Order
          </button>
        </div>
      </div>
    );
  }

  const subtotal = order.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;

  let tipAmount = 0;
  if (selectedTipPct !== null) {
    tipAmount = subtotal * (selectedTipPct / 100);
  } else if (customTipInput !== "") {
    const parsed = parseFloat(customTipInput);
    if (!isNaN(parsed)) tipAmount = parsed;
  }

  const total = subtotal + tax + tipAmount;
  const cashTendered = parseFloat(cashInput) || 0;
  const changeDue = cashTendered - total;

  const handleCashDigit = (digit) => {
    setCashInput((prev) => {
      const next = prev + digit;
      if (next.includes(".") && next.split(".")[1].length > 2) return prev;
      return next;
    });
  };

  const handleCashClear = () => setCashInput("");

  const handleCloseCheck = async () => {
    if (!order?.orderId) {
      setMessage("No backend order is attached to this check.");
      return;
    }

    if (!employee?.userId) {
      setMessage("You must be logged in to close the check.");
      return;
    }

    if (paymentMethod === "CASH" && cashTendered < total) return;

    try {
      setIsClosing(true);
      setMessage(null);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Check that the backend is running.")), 10000)
      );
      await Promise.race([
        closeOrder({
          orderId: order.orderId,
          servedBy: employee.userId,
          paymentMethod,
          splitCount,
          subtotal,
          tax,
          tipAmount,
          total,
          cashTendered,
        }),
        timeout,
      ]);
      localStorage.removeItem("currentOrder");
      setStage("complete");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.orderId) {
      setMessage("No backend order is attached to this check.");
      return;
    }

    if (employee?.role !== "manager") {
      setMessage("Only managers can cancel an order.");
      return;
    }

    try {
      setIsCanceling(true);
      setMessage(null);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Check that the backend is running.")), 10000)
      );
      await Promise.race([
        cancelOrder({
          orderId: order.orderId,
          voidedBy: employee.userId,
          voidReason: "Manager canceled order from checkout",
        }),
        timeout,
      ]);
      localStorage.removeItem("currentOrder");
      router.push("/tables");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsCanceling(false);
    }
  };

  if (stage === "complete") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "48px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            textAlign: "center",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#15803d", marginBottom: "8px" }}>
            Check Closed
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "4px" }}>
            Table {order.tableNumber}
          </p>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Total charged: <strong>${total.toFixed(2)}</strong>
            {paymentMethod === "CASH" && changeDue >= 0 && (
              <span> · Change: <strong>${changeDue.toFixed(2)}</strong></span>
            )}
          </p>
          <button
            onClick={() => {
              setStage("payment");
              setPaymentMethod(null);
              setCashInput("");
              setSelectedTipPct(null);
              setCustomTipInput("");
            }}
            style={{
              padding: "12px 32px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            New Check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => router.push(`/server-order?table=${order.tableNumber}`)}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              color: "#374151",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
              Close Check
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "14px" }}>
              Table {order.tableNumber} · {order.guestCount} guests · {order.orderType}
            </p>
          </div>
        </div>
        <span
          style={{
            backgroundColor: "#fef3c7",
            color: "#92400e",
            fontWeight: "700",
            fontSize: "13px",
            padding: "6px 14px",
            borderRadius: "999px",
            border: "1px solid #fde047",
          }}
        >
          OPEN CHECK
        </span>
      </div>

      {message && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "16px",
            fontWeight: "600",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

        {/* Left — Check summary */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>
            Check Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 80px 80px",
              gap: "8px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              paddingBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              marginBottom: "8px",
            }}
          >
            <span>Item</span>
            <span style={{ textAlign: "center" }}>Qty</span>
            <span style={{ textAlign: "right" }}>Price</span>
            <span style={{ textAlign: "right" }}>Total</span>
          </div>

          {order.cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 80px 80px",
                gap: "8px",
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: "14px",
                color: "#111827",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "500" }}>{item.name}</span>
              <span style={{ textAlign: "center", color: "#6b7280" }}>{item.quantity}</span>
              <span style={{ textAlign: "right", color: "#6b7280" }}>${item.price.toFixed(2)}</span>
              <span style={{ textAlign: "right", fontWeight: "600" }}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div style={{ marginTop: "16px" }}>
            {[
              ["Subtotal", subtotal],
              ["Tax (8.25%)", tax],
              ["Tip", tipAmount],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                <span>{label}</span>
                <span>${value.toFixed(2)}</span>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "2px solid #e5e7eb",
              }}
            >
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {paymentMethod === "SPLIT" && (
              <div
                style={{
                  marginTop: "8px",
                  textAlign: "right",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Split {splitCount} ways = <strong>${(total / splitCount).toFixed(2)}</strong> per person
              </div>
            )}
          </div>
        </div>

        {/* Right — Payment panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
              TIP
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {TIP_PRESETS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => { setSelectedTipPct(pct); setCustomTipInput(""); setShowCustomTip(false); }}
                  style={{
                    padding: "12px 4px",
                    border: "2px solid",
                    borderColor: selectedTipPct === pct ? "#2563eb" : "#e5e7eb",
                    borderRadius: "10px",
                    backgroundColor: selectedTipPct === pct ? "#eff6ff" : "white",
                    color: selectedTipPct === pct ? "#1d4ed8" : "#374151",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {pct}%
                </button>
              ))}
              <button
                onClick={() => { setSelectedTipPct(null); setShowCustomTip(true); }}
                style={{
                  padding: "12px 4px",
                  border: "2px solid",
                  borderColor: showCustomTip ? "#2563eb" : "#e5e7eb",
                  borderRadius: "10px",
                  backgroundColor: showCustomTip ? "#eff6ff" : "white",
                  color: showCustomTip ? "#1d4ed8" : "#374151",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Custom
              </button>
            </div>

            {showCustomTip && (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter tip amount ($)"
                value={customTipInput}
                onChange={(e) => setCustomTipInput(e.target.value)}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  color: "#111827",
                  boxSizing: "border-box",
                }}
              />
            )}

            {tipAmount > 0 && (
              <p style={{ marginTop: "8px", fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>
                Tip: ${tipAmount.toFixed(2)}
              </p>
            )}
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
              PAYMENT METHOD
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { label: "CASH", active: "#dcfce7", border: "#86efac", text: "#15803d" },
                { label: "CREDIT", active: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
                { label: "SPLIT", active: "#f5f3ff", border: "#c4b5fd", text: "#6d28d9" },
              ].map(({ label, active, border, text }) => (
                <button
                  key={label}
                  onClick={() => { setPaymentMethod(label); setCashInput(""); }}
                  style={{
                    padding: "14px 4px",
                    border: "2px solid",
                    borderColor: paymentMethod === label ? border : "#e5e7eb",
                    borderRadius: "10px",
                    backgroundColor: paymentMethod === label ? active : "white",
                    color: paymentMethod === label ? text : "#374151",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {paymentMethod === "SPLIT" && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>Split between:</span>
                <button
                  onClick={() => setSplitCount((n) => Math.max(2, n - 1))}
                  style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "16px" }}
                >−</button>
                <span style={{ fontWeight: "700", fontSize: "18px", color: "#111827" }}>{splitCount}</span>
                <button
                  onClick={() => setSplitCount((n) => Math.min(20, n + 1))}
                  style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "16px" }}
                >+</button>
              </div>
            )}

            {paymentMethod === "CREDIT" && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe",
                  textAlign: "center",
                  fontSize: "14px",
                  color: "#1d4ed8",
                  fontWeight: "600",
                }}
              >
                Swipe or insert card · ${total.toFixed(2)}
              </div>
            )}

            {paymentMethod === "CASH" && (
              <div style={{ marginTop: "12px" }}>
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "8px",
                    minHeight: "52px",
                  }}
                >
                  ${cashInput || "0.00"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {[
                    Math.ceil(total),
                    Math.ceil(total / 5) * 5,
                    Math.ceil(total / 10) * 10,
                    1, 5, 10, 20, 50, 100,
                  ]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .slice(0, 6)
                    .map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashInput(amt.toFixed(2))}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          backgroundColor: "white",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {["7","8","9","4","5","6","1","2","3"].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleCashDigit(d)}
                      style={{
                        padding: "14px",
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
                  <button onClick={handleCashClear} style={{ padding: "14px", fontSize: "13px", fontWeight: "700", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                    CLR
                  </button>
                  <button onClick={() => handleCashDigit("0")} style={{ padding: "14px", fontSize: "18px", fontWeight: "600", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white", cursor: "pointer" }}>
                    0
                  </button>
                  <button onClick={() => handleCashDigit(".")} style={{ padding: "14px", fontSize: "18px", fontWeight: "600", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white", cursor: "pointer" }}>
                    .
                  </button>
                </div>

                {cashTendered > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: changeDue >= 0 ? "#dcfce7" : "#fef2f2",
                      border: `1px solid ${changeDue >= 0 ? "#86efac" : "#fca5a5"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "14px", color: changeDue >= 0 ? "#15803d" : "#dc2626" }}>
                      {changeDue >= 0 ? "Change Due" : "Amount Short"}
                    </span>
                    <span style={{ fontWeight: "700", fontSize: "18px", color: changeDue >= 0 ? "#15803d" : "#dc2626" }}>
                      ${Math.abs(changeDue).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleCloseCheck}
            disabled={isClosing || isCanceling || !paymentMethod || (paymentMethod === "CASH" && (cashTendered < total || cashInput === ""))}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              backgroundColor: isClosing || isCanceling || !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "#d1d5db" : "#111827",
              color: isClosing || isCanceling || !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "#9ca3af" : "white",
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "0.05em",
              cursor: isClosing || isCanceling || !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "not-allowed" : "pointer",
            }}
          >
            {isClosing ? "CLOSING..." : `CLOSE CHECK — $${total.toFixed(2)}`}
          </button>

          {employee?.role === "manager" && (
            <button
              onClick={handleCancelOrder}
              disabled={isClosing || isCanceling || !order?.orderId}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                backgroundColor: isClosing || isCanceling || !order?.orderId ? "#fecaca" : "#b91c1c",
                color: isClosing || isCanceling || !order?.orderId ? "#7f1d1d" : "white",
                fontWeight: "700",
                fontSize: "16px",
                letterSpacing: "0.05em",
                cursor: isClosing || isCanceling || !order?.orderId ? "not-allowed" : "pointer",
              }}
            >
              {isCanceling ? "CANCELING..." : "MANAGER CANCEL ORDER"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
