import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchOnlineOrderById, markOnlineOrderPaid, lookupCustomerByPhone, staffAwardLoyaltyPoints } from "../lib/api";

export default function OnlineCheckoutPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState(null); // "CASH" | "CREDIT"
  const [cashInput, setCashInput] = useState("");
  const [cardForm, setCardForm] = useState({ cardNumber: "", cardName: "", expiryDate: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [stage, setStage] = useState("checkout"); // "checkout" | "complete"

  // Loyalty phone lookup
  const [phone, setPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null); // customer data or null
  const [lookupError, setLookupError] = useState(null);
  const [pointsAwarded, setPointsAwarded] = useState(null);

  useEffect(() => {
    const { orderId } = router.query;
    if (!orderId) return;

    fetchOnlineOrderById(orderId)
      .then((data) => { setOrder(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [router.query]);

  async function handleLookup() {
    if (!/^\d{10}$/.test(phone)) { setLookupError("Enter a valid 10-digit phone number."); return; }
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const result = await lookupCustomerByPhone(phone);
      setLookupResult(result);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  }

  function detectCardType(digits) {
    if (/^4/.test(digits)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
    if (/^3[47]/.test(digits)) return "amex";
    if (/^(6011|622|64|65)/.test(digits)) return "discover";
    return null;
  }

  function getCardExpiryError(expiryDate) {
    if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate)) return "Format: MM/YY";
    const [monthText, yearText] = expiryDate.split("/");
    const month = Number(monthText);
    const year = 2000 + Number(yearText);
    if (!Number.isInteger(month) || month < 1 || month > 12) return "Enter a valid month";
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "Card is expired";
    return null;
  }

  async function handleMarkPaid() {
    if (!paymentMethod) return;
    const cashTendered = parseFloat(cashInput) || 0;
    if (paymentMethod === "CASH" && cashTendered < Number(order.total)) return;

    if (paymentMethod === "CREDIT") {
      const errs = {};
      if (!cardForm.cardNumber.trim() || cardForm.cardNumber.replace(/\s/g, "").length < 13) errs.cardNumber = "Valid card number required";
      if (!cardForm.cardName.trim()) errs.cardName = "Cardholder name required";
      const expiryError = getCardExpiryError(cardForm.expiryDate);
      if (expiryError) errs.expiryDate = expiryError;
      if (!cardForm.cvv.trim() || !/^\d{3,4}$/.test(cardForm.cvv)) errs.cvv = "3-4 digits required";
      if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
      setCardErrors({});
    }

    setIsClosing(true);
    setError(null);
    try {
      const digits = cardForm.cardNumber.replace(/\s/g, "");
      await markOnlineOrderPaid(order.online_order_id, {
        paymentMethod: paymentMethod === "CASH" ? "cash" : "card",
        cardNumber: paymentMethod === "CREDIT" ? digits : undefined,
        cardType: paymentMethod === "CREDIT" ? detectCardType(digits) : undefined,
      });

      // Award points to looked-up customer if found (and order has no customer_num_id)
      if (lookupResult && !order.customer_num_id) {
        try {
          const result = await staffAwardLoyaltyPoints({
            customerId: lookupResult.customerId,
            onlineOrderId: order.online_order_id,
            total: order.total,
          });
          setPointsAwarded(result.pointsAwarded);
        } catch {
          // Points award failure shouldn't block payment completion
        }
      }

      setStage("complete");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsClosing(false);
    }
  }

  if (loading) {
    return <div style={pageStyle}><p style={{ color: "#64748b" }}>Loading order...</p></div>;
  }

  if (error && !order) {
    return <div style={pageStyle}><p style={{ color: "#dc2626" }}>{error}</p></div>;
  }

  if (!order) return null;

  const total = Number(order.total);
  const cashTendered = parseFloat(cashInput) || 0;
  const changeDue = cashTendered - total;

  if (stage === "complete") {
    return (
      <div style={pageStyle}>
        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "48px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", textAlign: "center", maxWidth: "420px", width: "100%" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#15803d", marginBottom: "8px" }}>Payment Complete</h2>
          <p style={{ color: "#6b7280", marginBottom: "4px" }}>Order #{order.online_order_id}</p>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            Total charged: <strong>${total.toFixed(2)}</strong>
            {paymentMethod === "CASH" && changeDue >= 0 && (
              <span> · Change: <strong>${changeDue.toFixed(2)}</strong></span>
            )}
          </p>
          {pointsAwarded > 0 && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#15803d", fontWeight: "600" }}>
                ⭐ {pointsAwarded} points awarded to {lookupResult?.firstName} {lookupResult?.lastName}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/online-orders")}
            style={{ padding: "12px 32px", borderRadius: "10px", border: "none", backgroundColor: "#2563eb", color: "white", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
          >
            Back to Online Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => router.push("/online-orders")}
            style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }}>Online Order Checkout</h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "13px" }}>
              Order #{order.online_order_id} · {order.first_name} {order.last_name} · {order.phone}
            </p>
          </div>
        </div>
        <span style={{ backgroundColor: "#fff7ed", color: "#c2410c", fontWeight: "700", fontSize: "12px", padding: "6px 14px", borderRadius: "999px", border: "1px solid #fed7aa" }}>
          PAY AT PICKUP
        </span>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontWeight: "600" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

        {/* Left — Order summary + loyalty lookup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Order items */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>Order Summary</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#374151", fontWeight: "500" }}>{item.quantity}× {item.name}</span>
                  <span style={{ color: "#6b7280" }}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.order_note && (
              <p style={{ fontSize: "12px", color: "#f97316", backgroundColor: "#fff7ed", borderRadius: "6px", padding: "6px 10px", marginBottom: "12px" }}>
                📝 {order.order_note}
              </p>
            )}

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[["Subtotal", Number(order.subtotal)], ["Tax (8.25%)", Number(order.tax)]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280" }}>
                  <span>{label}</span><span>${val.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "700", color: "#111827", paddingTop: "10px", borderTop: "2px solid #e5e7eb", marginTop: "4px" }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Loyalty phone lookup */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>Loyalty Points Lookup</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px" }}>Optional — enter customer phone to award points after payment.</p>

            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setLookupResult(null); setLookupError(null); }}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" }}
              />
              <button
                onClick={handleLookup}
                disabled={lookupLoading || phone.length !== 10}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: phone.length === 10 ? "#2563eb" : "#e5e7eb", color: phone.length === 10 ? "white" : "#9ca3af", fontWeight: "700", fontSize: "13px", cursor: phone.length === 10 ? "pointer" : "not-allowed" }}
              >
                {lookupLoading ? "..." : "Look Up"}
              </button>
            </div>

            {lookupError && (
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{lookupError}</p>
            )}

            {lookupResult && (
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px 16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#15803d" }}>
                  ✓ {lookupResult.firstName} {lookupResult.lastName}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                  Current balance: <strong>{lookupResult.pointsBalance} pts</strong>
                  {" · "}Will earn: <strong>~{Math.floor(total) * 10} pts</strong> after payment
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Payment panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment Method</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "CASH", active: "#dcfce7", border: "#86efac", text: "#15803d" },
                { label: "CREDIT", active: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
              ].map(({ label, active, border, text }) => (
                <button
                  key={label}
                  onClick={() => {
                    setPaymentMethod(label);
                    setCashInput("");
                    if (label !== "CREDIT") {
                      setCardForm({ cardNumber: "", cardName: "", expiryDate: "", cvv: "" });
                      setCardErrors({});
                    }
                  }}
                  style={{ padding: "14px", border: "2px solid", borderColor: paymentMethod === label ? border : "#e5e7eb", borderRadius: "10px", backgroundColor: paymentMethod === label ? active : "white", color: paymentMethod === label ? text : "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer", letterSpacing: "0.04em" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {paymentMethod === "CREDIT" && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Card Number *</label>
                  <input
                    type="text"
                    placeholder="4532 1234 5678 9010"
                    value={cardForm.cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setCardForm({ ...cardForm, cardNumber: val.replace(/(\d{4})(?=\d)/g, "$1 ") });
                    }}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: `1px solid ${cardErrors.cardNumber ? "#fca5a5" : "#d1d5db"}`, fontSize: "14px", color: "#111827", backgroundColor: cardErrors.cardNumber ? "#fef2f2" : "white", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }}
                  />
                  {cardErrors.cardNumber && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{cardErrors.cardNumber}</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Cardholder Name *</label>
                  <input
                    type="text"
                    placeholder="Alex Johnson"
                    value={cardForm.cardName}
                    onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: `1px solid ${cardErrors.cardName ? "#fca5a5" : "#d1d5db"}`, fontSize: "14px", color: "#111827", backgroundColor: cardErrors.cardName ? "#fef2f2" : "white", boxSizing: "border-box", outline: "none" }}
                  />
                  {cardErrors.cardName && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{cardErrors.cardName}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Expires *</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardForm.expiryDate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardForm({ ...cardForm, expiryDate: val.length >= 2 ? `${val.slice(0, 2)}/${val.slice(2)}` : val });
                      }}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: `1px solid ${cardErrors.expiryDate ? "#fca5a5" : "#d1d5db"}`, fontSize: "14px", color: "#111827", backgroundColor: cardErrors.expiryDate ? "#fef2f2" : "white", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }}
                    />
                    {cardErrors.expiryDate && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{cardErrors.expiryDate}</p>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>CVV *</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: `1px solid ${cardErrors.cvv ? "#fca5a5" : "#d1d5db"}`, fontSize: "14px", color: "#111827", backgroundColor: cardErrors.cvv ? "#fef2f2" : "white", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }}
                    />
                    {cardErrors.cvv && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{cardErrors.cvv}</p>}
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                  ✓ Card information is used for this transaction only.
                </p>
              </div>
            )}

            {paymentMethod === "CASH" && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px", textAlign: "right", fontSize: "26px", fontWeight: "700", color: "#111827", marginBottom: "8px", minHeight: "52px" }}>
                  ${cashInput || "0.00"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {[Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 1, 5, 10, 20, 50, 100]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .slice(0, 6)
                    .map((amt) => (
                      <button key={amt} onClick={() => setCashInput(amt.toFixed(2))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                        ${amt}
                      </button>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {["7","8","9","4","5","6","1","2","3"].map((d) => (
                    <button key={d} onClick={() => setCashInput((prev) => { const next = prev + d; if (next.includes(".") && next.split(".")[1].length > 2) return prev; return next; })} style={{ padding: "14px", fontSize: "18px", fontWeight: "600", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white", cursor: "pointer" }}>{d}</button>
                  ))}
                  <button onClick={() => setCashInput("")} style={{ padding: "14px", fontSize: "13px", fontWeight: "700", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>CLR</button>
                  <button onClick={() => setCashInput((prev) => { const next = prev + "0"; if (next.includes(".") && next.split(".")[1].length > 2) return prev; return next; })} style={{ padding: "14px", fontSize: "18px", fontWeight: "600", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white", cursor: "pointer" }}>0</button>
                  <button onClick={() => setCashInput((prev) => prev.includes(".") ? prev : prev + ".")} style={{ padding: "14px", fontSize: "18px", fontWeight: "600", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white", cursor: "pointer" }}>.</button>
                </div>

                {cashTendered > 0 && (
                  <div style={{ marginTop: "10px", padding: "12px", borderRadius: "10px", backgroundColor: changeDue >= 0 ? "#dcfce7" : "#fef2f2", border: `1px solid ${changeDue >= 0 ? "#86efac" : "#fca5a5"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "14px", color: changeDue >= 0 ? "#15803d" : "#dc2626" }}>{changeDue >= 0 ? "Change Due" : "Amount Short"}</span>
                    <span style={{ fontWeight: "700", fontSize: "18px", color: changeDue >= 0 ? "#15803d" : "#dc2626" }}>${Math.abs(changeDue).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleMarkPaid}
            disabled={
              isClosing ||
              !paymentMethod ||
              (paymentMethod === "CASH" && (cashTendered < total || cashInput === "")) ||
              (paymentMethod === "CREDIT" && (
                cardForm.cardNumber.replace(/\s/g, "").length < 13 ||
                !cardForm.cardName.trim() ||
                !/^\d{2}\/\d{2}$/.test(cardForm.expiryDate) ||
                !/^\d{3,4}$/.test(cardForm.cvv)
              ))
            }
            style={{ width: "100%", padding: "16px", border: "none", borderRadius: "12px", backgroundColor: !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "#d1d5db" : "#111827", color: !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "#9ca3af" : "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.05em", cursor: !paymentMethod || (paymentMethod === "CASH" && cashTendered < total) ? "not-allowed" : "pointer" }}
          >
            {isClosing ? "PROCESSING..." : `MARK AS PAID — $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle = { minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" };
