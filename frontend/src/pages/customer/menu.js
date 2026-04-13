/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCustomerSession } from "../../lib/useCustomerSession";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CustomerMenuPage() {
  const router = useRouter();
  const { customer } = useCustomerSession();
  const [menu, setMenu] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("customerCart");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    localStorage.setItem("customerCart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch(`${API_BASE}/api/customer/menu`);
        const data = await res.json();
        setMenu(data);
        setSelectedCategory(Object.keys(data)[0] ?? null);
      } catch {
        // keep menu empty
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categories = Object.keys(menu);

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map((c) => c.menu_item_id === item.menu_item_id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== id));
  }

  function updateQty(id, qty) {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((c) => c.menu_item_id === id ? { ...c, quantity: qty } : c));
  }

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.base_price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function handleCheckout() {
    localStorage.setItem("customerCart", JSON.stringify(cart));
    router.push("/customer/customer-checkout");
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "grid", justifyItems: "center", gap: "14px" }}>
          <div className="lumi-loader" aria-hidden="true" />
          <p style={{ color: "#64748b", fontWeight: "600", margin: 0 }}>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(148,163,184,0.15)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {customer ? (
            <Link href="/customer/dashboard" style={{ fontSize: "14px", fontWeight: "600", color: "#475569", textDecoration: "none" }}>
              Hi, {customer.firstName}
            </Link>
          ) : (
            <Link href="/customer/login" style={{ fontSize: "14px", fontWeight: "600", color: "#475569", textDecoration: "none" }}>
              Log In
            </Link>
          )}
          <button
            onClick={() => setShowCart(true)}
            style={{ padding: "8px 20px", borderRadius: "999px", border: "none", backgroundColor: cartCount > 0 ? "#3b82f6" : "#94a3b8", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: cartCount > 0 ? "0 4px 14px rgba(59,130,246,0.3)" : "none" }}
          >
            Cart ({cartCount}) · ${cartTotal.toFixed(2)}
          </button>
        </div>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "24px", padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Category sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "sticky", top: "88px", alignSelf: "start" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "4px" }}>Categories</p>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: selectedCategory === cat ? "none" : "1px solid rgba(148,163,184,0.2)",
                backgroundColor: selectedCategory === cat ? "#3b82f6" : "rgba(255,255,255,0.7)",
                color: selectedCategory === cat ? "white" : "#475569",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e3a5f", marginBottom: "20px" }}>{selectedCategory}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {(menu[selectedCategory] ?? []).map((item) => {
              const inCart = cart.find((c) => c.menu_item_id === item.menu_item_id);
              return (
                <div key={item.menu_item_id} style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "14px", padding: "20px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(15,23,42,0.05)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "10px", backgroundColor: "#f1f5f9" }}
                    />
                  ) : null}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>{item.name}</h3>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#111827", whiteSpace: "nowrap", marginLeft: "8px" }}>${Number(item.base_price).toFixed(2)}</span>
                  </div>
                  {item.description ? (
                    <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                  ) : null}
                  {item.common_allergens ? (
                    <p style={{ fontSize: "12px", color: "#92400e", fontWeight: "700", margin: 0 }}>Allergens: {item.common_allergens}</p>
                  ) : null}

                  {inCart ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => updateQty(item.menu_item_id, inCart.quantity - 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(148,163,184,0.3)", backgroundColor: "white", cursor: "pointer", fontSize: "18px", fontWeight: "700", color: "#475569" }}>−</button>
                      <span style={{ fontWeight: "700", color: "#1e3a5f", minWidth: "24px", textAlign: "center" }}>{inCart.quantity}</span>
                      <button onClick={() => updateQty(item.menu_item_id, inCart.quantity + 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(148,163,184,0.3)", backgroundColor: "white", cursor: "pointer", fontSize: "18px", fontWeight: "700", color: "#111827" }}>+</button>
                      <span style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "600", marginLeft: "4px" }}>Added</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      aria-label={`Add ${item.name} to cart`}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(148,163,184,0.25)", backgroundColor: "white", color: "#111827", fontSize: "22px", fontWeight: "800", lineHeight: 1, cursor: "pointer", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(15,23,42,0.08)" }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.4)" }} />
          <div style={{ position: "relative", width: "380px", height: "100%", backgroundColor: "white", boxShadow: "-4px 0 24px rgba(15,23,42,0.12)", display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* Cart header */}
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0 0 4px" }}>Your Order</p>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e3a5f", margin: 0 }}>Takeout</h2>
              </div>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: "15px" }}>Your cart is empty.</p>
                <button onClick={() => setShowCart(false)} style={{ marginTop: "12px", padding: "8px 20px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.3)", backgroundColor: "white", color: "#475569", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Step 1 — items */}
                <div style={{ padding: "20px 24px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ backgroundColor: "#3b82f6", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" }}>1</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirm Your Items</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {cart.map((item) => (
                      <div key={item.menu_item_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", margin: "0 0 2px" }}>{item.name}</p>
                          <p style={{ fontSize: "12px", color: "#111827", margin: 0 }}>${Number(item.base_price).toFixed(2)} each</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => updateQty(item.menu_item_id, item.quantity - 1)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#475569" }}>−</button>
                          <span style={{ fontWeight: "700", color: "#1e3a5f", minWidth: "18px", textAlign: "center", fontSize: "14px" }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.menu_item_id, item.quantity + 1)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#111827" }}>+</button>
                        </div>
                        <span style={{ fontWeight: "700", color: "#111827", marginLeft: "12px", minWidth: "48px", textAlign: "right" }}>${(Number(item.base_price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal + checkout */}
                <div style={{ padding: "16px 24px 28px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px", color: "#64748b" }}>
                    <span>Subtotal (tax not included)</span>
                    <span style={{ fontWeight: "700" }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Scroll down for the full total at checkout.</p>
                  <button
                    onClick={handleCheckout}
                    style={{ width: "100%", padding: "14px", borderRadius: "999px", border: "none", backgroundColor: "#3b82f6", color: "white", fontSize: "15px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.3)", letterSpacing: "0.02em" }}
                  >
                    Checkout · ${cartTotal.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
