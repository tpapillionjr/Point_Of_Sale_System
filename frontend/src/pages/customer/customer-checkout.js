import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { placeCustomerOrder, fetchLoyaltyRewardsPublic } from "../../lib/api";
import { useCustomerSession } from "../../lib/useCustomerSession";

const TAX_RATE = 0.0825;

export default function CustomerOrderPage() {
  const router = useRouter();
  const { customer } = useCustomerSession();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customerCart");
    if (stored) startTransition(() => setCart(JSON.parse(stored)));
  }, []);

  const [paymentPreference, setPaymentPreference] = useState("in_store");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const [rewards, setRewards] = useState([]);
  const [selectedRewardId, setSelectedRewardId] = useState(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!customer) return;
    startTransition(() => setForm((prev) => ({
      ...prev,
      firstName: customer.firstName ?? prev.firstName,
      lastName: customer.lastName ?? prev.lastName,
      email: customer.email ?? prev.email,
    })));

    if ((customer.pointsBalance ?? 0) >= 100) {
      fetchLoyaltyRewardsPublic()
        .then((rows) => setRewards(rows.filter((r) => r.points_cost <= customer.pointsBalance)))
        .catch(() => {});
    }
  }, [customer]);

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

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) errs.phone = "10-digit phone required";
    return errs;
  }

  async function handlePlaceOrder() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
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
                      <input type="radio" name="paymentPreference" value={value} checked={paymentPreference === value} onChange={() => setPaymentPreference(value)} style={{ accentColor: "#3b82f6" }} />
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a5f" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748b", paddingLeft: "22px" }}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>

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
                  <div key={item.menu_item_id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: "#374151", fontWeight: "500" }}>{item.quantity}× {item.name}</span>
                    <span style={{ fontWeight: "600", color: "#1e3a5f" }}>${(Number(item.base_price) * item.quantity).toFixed(2)}</span>
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
