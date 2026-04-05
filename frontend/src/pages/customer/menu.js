import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const MOCK_MENU = {
  Appetizers: [
    { menu_item_id: 1, name: "Side Salad", base_price: 4.99 },
    { menu_item_id: 2, name: "Fruit Cup", base_price: 3.99 },
  ],
  Entrees: [
    { menu_item_id: 3, name: "All-Star Special", base_price: 11.99 },
    { menu_item_id: 4, name: "Two Egg Breakfast", base_price: 8.99 },
    { menu_item_id: 5, name: "Bacon Egg Breakfast", base_price: 9.99 },
    { menu_item_id: 6, name: "Ham and Eggs Breakfast", base_price: 10.49 },
    { menu_item_id: 7, name: "Cheese Omelet", base_price: 9.49 },
    { menu_item_id: 8, name: "Ham and Cheese Omelet", base_price: 10.49 },
    { menu_item_id: 9, name: "Bacon Omelet", base_price: 10.49 },
    { menu_item_id: 10, name: "Breakfast Hashbrown Bowl", base_price: 9.99 },
  ],
  Sides: [
    { menu_item_id: 11, name: "Hashbrowns", base_price: 2.99 },
    { menu_item_id: 12, name: "Toast", base_price: 1.99 },
    { menu_item_id: 13, name: "Bacon Strip", base_price: 2.49 },
  ],
  Drinks: [
    { menu_item_id: 14, name: "Orange Juice", base_price: 3.49 },
    { menu_item_id: 15, name: "Coffee", base_price: 2.99 },
    { menu_item_id: 16, name: "Milk", base_price: 2.49 },
  ],
};

export default function CustomerMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("Entrees");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const categories = Object.keys(MOCK_MENU);

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

  const cartTotal = cart.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>

      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        backgroundColor: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(148,163,184,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e", letterSpacing: "-0.01em" }}>lumi</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/customer" style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", textDecoration: "none" }}>
            ← Home
          </Link>
          <button
            onClick={() => setShowCart(true)}
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#3b82f6",
              color: "white",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}
          >
            Cart ({cartCount}) · ${cartTotal.toFixed(2)}
          </button>
        </div>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "24px", padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Category sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "sticky", top: "88px", alignSelf: "start" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "4px" }}>
            Categories
          </p>
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
            {(MOCK_MENU[selectedCategory] ?? []).map((item) => {
              const inCart = cart.find((c) => c.menu_item_id === item.menu_item_id);
              return (
                <div key={item.menu_item_id} style={{
                  backgroundColor: "rgba(255,255,255,0.75)",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid rgba(148,163,184,0.18)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>{item.name}</h3>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", marginLeft: "8px" }}>
                      ${item.base_price.toFixed(2)}
                    </span>
                  </div>

                  {inCart ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => updateQty(item.menu_item_id, inCart.quantity - 1)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.3)", backgroundColor: "white", cursor: "pointer", fontSize: "16px", fontWeight: "700", color: "#475569" }}>−</button>
                      <span style={{ fontWeight: "700", color: "#1e3a5f", minWidth: "20px", textAlign: "center" }}>{inCart.quantity}</span>
                      <button onClick={() => updateQty(item.menu_item_id, inCart.quantity + 1)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.3)", backgroundColor: "white", cursor: "pointer", fontSize: "16px", fontWeight: "700", color: "#475569" }}>+</button>
                      <span style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "600", marginLeft: "4px" }}>In cart</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "999px",
                        border: "none",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      + Add to Cart
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
          <div style={{
            position: "relative",
            width: "360px",
            height: "100%",
            backgroundColor: "white",
            boxShadow: "-4px 0 24px rgba(15,23,42,0.12)",
            display: "flex",
            flexDirection: "column",
            padding: "28px 24px",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>Your Cart</h2>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Your cart is empty.</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                  {cart.map((item) => (
                    <div key={item.menu_item_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", margin: "0 0 4px" }}>{item.name}</p>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>${item.base_price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700", color: "#3b82f6" }}>${(item.base_price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.menu_item_id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontWeight: "700", color: "#1e3a5f", fontSize: "16px" }}>Total</span>
                    <span style={{ fontWeight: "800", color: "#3b82f6", fontSize: "18px" }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => { console.log("Order placed (mock):", cart); setShowCart(false); }}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                    }}
                  >
                    Place Order
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


