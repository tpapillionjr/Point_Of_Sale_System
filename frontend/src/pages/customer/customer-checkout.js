import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { placeCustomerOrder, fetchLoyaltyRewardsPublic } from "../../lib/api";
import { useCustomerSession } from "../../lib/useCustomerSession";

const TAX_RATE = 0.0825;

export default function CustomerOrderPage() {
  const router = useRouter();
  const { customer, loaded } = useCustomerSession();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customerCart");
    if (stored) startTransition(() => setCart(JSON.parse(stored)));
  }, []);

  function updateCartQty(id, qty) {
    setCart((prev) => {
      const next = qty <= 0
        ? prev.filter((c) => c.menu_item_id !== id)
        : prev.map((c) => c.menu_item_id === id ? { ...c, quantity: qty } : c);
      localStorage.setItem("customerCart", JSON.stringify(next));
      return next;
    });
  }

  const [paymentPreference, setPaymentPreference] = useState("in_store");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const [rewards, setRewards] = useState([]);
  const [selectedRewardId, setSelectedRewardId] = useState(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "" });
  const [cardForm, setCardForm] = useState({ cardNumber: "", cardName: "", expiryDate: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    if (!customer) return;
    startTransition(() => setForm((prev) => ({
      ...prev,
      firstName: customer.firstName ?? prev.firstName,
      lastName: customer.lastName ?? prev.lastName,
      email: customer.email ?? prev.email,
      phone: customer.phone ?? prev.phone,
    })));

    if ((customer.pointsBalance ?? 0) >= 100) {
      fetchLoyaltyRewardsPublic()
        .then((rows) => setRewards(rows.filter((r) => r.points_cost <= customer.pointsBalance)))
        .catch(() => {});
    }
  }, [customer]);

  if (loaded && !customer) {
    router.replace("/customer/login?redirect=/customer/customer-checkout");
    return null;
  }

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#64748b", marginBottom: "16px" }}>Your cart is empty.</p>
          <Link href="/customer/menu" style={{ padding: "10px 24px", borderRadius: "999px", backgroundColor: "#3b82f6", color: "white", fontWeight: "700", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.base_price) * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const estimatedPoints = Math.floor(total) * 10;

  function getCardExpiryError(expiryDate) {
    if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return "Format: MM/YY";
    }

    const [monthText, yearText] = expiryDate.split("/");
    const month = Number(monthText);
    const year = 2000 + Number(yearText);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return "Enter a valid month";
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Card is expired";
    }

    return null;
  }

  function validate() {
    const errs = {};
    const cardErrs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) errs.phone = "10-digit phone required";
    
    // Validate card if paying online
    if (paymentPreference === "online") {
      if (!cardForm.cardNumber.trim() || cardForm.cardNumber.replace(/\s/g, "").length < 13) cardErrs.cardNumber = "Valid card number required";
      if (!cardForm.cardName.trim()) cardErrs.cardName = "Cardholder name required";
      const expiryError = getCardExpiryError(cardForm.expiryDate);
      if (expiryError) cardErrs.expiryDate = expiryError;
      if (!cardForm.cvv.trim() || !/^\d{3,4}$/.test(cardForm.cvv)) cardErrs.cvv = "3-4 digits required";
    }

    setCardErrors(cardErrs);
    
    return { errs, cardErrs };
  }

  async function handlePlaceOrder() {
    const { errs, cardErrs } = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (Object.keys(cardErrs).length > 0) { return; }
    setErrors({});
    setCardErrors({});
    setOrderError(null);
    setIsSubmitting(true);

    try {
      const { orderId } = await placeCustomerOrder({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        note: form.note,
        cart,
        paymentPreference,
        paymentData: paymentPreference === "online" ? {
          cardNumber: cardForm.cardNumber.replace(/\s/g, ""),
          cardName: cardForm.cardName,
          expiryDate: cardForm.expiryDate,
          cvv: cardForm.cvv,
        } : null,
        customerId: customer?.customerId ?? null,
        rewardId: selectedRewardId ?? null,
      });

      localStorage.removeItem("customerCart");
      if (customer?.customerId) {
        localStorage.setItem(`lastOrderId:${customer.customerId}`, orderId);
      }
      localStorage.setItem("estimatedPoints", estimatedPoints);
      router.push(`/customer/order-tracking?orderId=${orderId}`);
    } catch (err) {
      setOrderError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1px solid ${errors[field] ? "#fca5a5" : "#d1d5db"}`,
    fontSize: "14px",
    color: "#1e3a5f",
    backgroundColor: errors[field] ? "#fef2f2" : "white",
    boxSizing: "border-box",
    outline: "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
        </Link>
        <Link href="/customer/menu" style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", textDecoration: "none" }}>
          ← Return to Menu
        </Link>
      </nav>

      <div style={{ padding: "40px 40px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#1e3a5f", marginBottom: "32px" }}>Checkout</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Contact info */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "20px" }}>Contact Information</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>First Name *</label>
                    <input type="text" placeholder="Jane" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inputStyle("firstName")} />
                    {errors.firstName && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{errors.firstName}</p>}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Last Name *</label>
                    <input type="text" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inputStyle("lastName")} />
                    {errors.lastName && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Email *</label>
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle("email")} />
                  {errors.email && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{errors.email}</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Phone Number *</label>
                  <input type="tel" placeholder="10 digits" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} style={inputStyle("phone")} />
                  {errors.phone && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{errors.phone}</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Special Instructions <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional)</span></label>
                  <textarea placeholder="Allergies, substitutions, etc." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#1e3a5f", backgroundColor: "white", resize: "none", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
                </div>
              </div>
            </div>

            {/* Payment preference */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "14px" }}>How would you like to pay?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { value: "online", label: "Pay Online", sub: "Pay now when placing order" },
                  { value: "in_store", label: "Pay at Pickup", sub: "Pay when you collect your order" },
                ].map(({ value, label, sub }) => (
                  <label key={value} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "14px", borderRadius: "10px", border: `2px solid ${paymentPreference === value ? "#3b82f6" : "#e2e8f0"}`, backgroundColor: paymentPreference === value ? "#eff6ff" : "white", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="radio" name="paymentPreference" value={value} checked={paymentPreference === value} onChange={() => { setPaymentPreference(value); setCardErrors({}); }} style={{ accentColor: "#3b82f6" }} />
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748b", paddingLeft: "22px" }}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Card payment form - only show when paying online */}
            {paymentPreference === "online" && (
              <div style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "20px" }}>💳 Card Details</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Card Number *</label>
                    <input
                      type="text"
                      placeholder="4532 1234 5678 9010"
                      value={cardForm.cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                        setCardForm({ ...cardForm, cardNumber: formatted });
                      }}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${cardErrors.cardNumber ? "#fca5a5" : "#d1d5db"}`,
                        fontSize: "14px",
                        color: "#1e3a5f",
                        backgroundColor: cardErrors.cardNumber ? "#fef2f2" : "white",
                        boxSizing: "border-box",
                        outline: "none",
                        fontFamily: "monospace",
                      }}
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
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${cardErrors.cardName ? "#fca5a5" : "#d1d5db"}`,
                        fontSize: "14px",
                        color: "#1e3a5f",
                        backgroundColor: cardErrors.cardName ? "#fef2f2" : "white",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
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
                          if (val.length >= 2) {
                            setCardForm({ ...cardForm, expiryDate: `${val.slice(0, 2)}/${val.slice(2)}` });
                          } else {
                            setCardForm({ ...cardForm, expiryDate: val });
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: "8px",
                          border: `1px solid ${cardErrors.expiryDate ? "#fca5a5" : "#d1d5db"}`,
                          fontSize: "14px",
                          color: "#1e3a5f",
                          backgroundColor: cardErrors.expiryDate ? "#fef2f2" : "white",
                          boxSizing: "border-box",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
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
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: "8px",
                          border: `1px solid ${cardErrors.cvv ? "#fca5a5" : "#d1d5db"}`,
                          fontSize: "14px",
                          color: "#1e3a5f",
                          backgroundColor: cardErrors.cvv ? "#fef2f2" : "white",
                          boxSizing: "border-box",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                      {cardErrors.cvv && <p style={{ fontSize: "12px", color: "#dc2626", margin: "4px 0 0" }}>{cardErrors.cvv}</p>}
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                    ✓ Your card information is secure and used for this order only.
                  </p>
                </div>
              </div>
            )}

            {/* Points balance + reward redemption (logged-in only) */}
            {customer && (
              <div style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: rewards.length > 0 ? "16px" : "0" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 4px" }}>Your Loyalty Points</p>
                    <p style={{ fontSize: "24px", fontWeight: "900", color: "#1e3a5f", margin: 0 }}>{(customer.pointsBalance ?? 0).toLocaleString()} pts</p>
                  </div>
                  <div style={{ fontSize: "36px" }}>⭐</div>
                </div>

                {rewards.length > 0 ? (
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>Redeem a reward with this order:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {rewards.map((reward) => (
                        <label key={reward.reward_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${selectedRewardId === reward.reward_id ? "#3b82f6" : "#e2e8f0"}`, backgroundColor: selectedRewardId === reward.reward_id ? "#eff6ff" : "white", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="reward"
                            value={reward.reward_id}
                            checked={selectedRewardId === reward.reward_id}
                            onChange={() => setSelectedRewardId(
                              selectedRewardId === reward.reward_id ? null : reward.reward_id
                            )}
                            style={{ accentColor: "#3b82f6" }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{reward.name}</p>
                            {reward.menu_item_name && <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{reward.menu_item_name}</p>}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#3b82f6" }}>{reward.points_cost} pts</span>
                        </label>
                      ))}
                      {selectedRewardId && (
                        <button
                          onClick={() => setSelectedRewardId(null)}
                          style={{ fontSize: "12px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0" }}
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                    You&apos;ll earn approximately <strong style={{ color: "#1e3a5f" }}>{estimatedPoints} pts</strong> from this order.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right — Order summary */}
          <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(15,23,42,0.07)" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "16px" }}>Your Order · {cart.length} item{cart.length !== 1 ? "s" : ""}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {cart.map((item) => (
                  <div key={item.menu_item_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", gap: "8px" }}>
                    <span style={{ color: "#374151", fontWeight: "500", flex: 1 }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => updateCartQty(item.menu_item_id, item.quantity - 1)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#475569", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: "700", color: "#1e3a5f", minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.menu_item_id, item.quantity + 1)} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#111827", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <span style={{ fontWeight: "600", color: "#1e3a5f", minWidth: "44px", textAlign: "right" }}>${(Number(item.base_price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {selectedRewardId && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#16a34a", fontWeight: "500" }}>🎁 {rewards.find(r => r.reward_id === selectedRewardId)?.name}</span>
                    <span style={{ fontWeight: "600", color: "#16a34a" }}>Reward</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[["Subtotal", subtotal], ["Tax (8.25%)", tax]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                    <span>{label}</span>
                    <span>${val.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", color: "#1e3a5f", paddingTop: "10px", borderTop: "2px solid #e2e8f0", marginTop: "4px" }}>
                  <span>Total</span>
                  <span style={{ color: "#3b82f6" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "8px", backgroundColor: paymentPreference === "online" ? "#eff6ff" : "#f8fafc", border: `1px solid ${paymentPreference === "online" ? "#bfdbfe" : "#e2e8f0"}`, textAlign: "center" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", color: paymentPreference === "online" ? "#1d4ed8" : "#64748b", margin: 0 }}>
                  {paymentPreference === "online" ? "💳 Paying online now" : "💵 Pay at pickup"}
                </p>
              </div>
              {customer && (
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>
                  ~{estimatedPoints} points earned {paymentPreference === "online" ? "automatically" : "when paid at store"}
                </p>
              )}
            </div>

            {orderError && (
              <p style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", margin: 0 }}>{orderError}</p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              style={{ width: "100%", padding: "15px", borderRadius: "999px", border: "none", backgroundColor: isSubmitting ? "#93c5fd" : "#3b82f6", color: "white", fontSize: "16px", fontWeight: "800", cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.3)", letterSpacing: "0.02em" }}
            >
              {isSubmitting ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
            </button>

            <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", margin: 0 }}>
              All fields marked with * are required.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
