import Link from "next/link";
import Image from "next/image";
import { useCustomerSession } from "../../lib/useCustomerSession";

const FEATURED_ITEMS = [
  { id: 1, name: "All-Star Special", description: "Our signature breakfast platter with eggs, bacon, and toast.", price: 11.99, category: "Entrees" },
  { id: 2, name: "Bacon Egg Breakfast", description: "Two eggs your way with crispy bacon and home fries.", price: 9.99, category: "Entrees" },
  { id: 3, name: "Ham and Cheese Omelet", description: "Fluffy three-egg omelet with diced ham and melted cheese.", price: 10.49, category: "Entrees" },
  { id: 4, name: "Breakfast Hashbrown Bowl", description: "Crispy hashbrowns topped with eggs, cheese, and your choice of meat.", price: 9.99, category: "Entrees" },
  { id: 5, name: "Cheese Omelet", description: "Light and fluffy omelet with a blend of melted cheeses.", price: 9.49, category: "Entrees" },
  { id: 6, name: "Sausage Egg Breakfast", description: "Two eggs with savory sausage links and golden toast.", price: 9.99, category: "Entrees" },
];

export default function CustomerHomePage() {
  const { customer } = useCustomerSession();

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#334e6e", letterSpacing: "-0.01em" }}>lumi</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {customer ? (
            <>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                Welcome back, {customer.firstName}
              </span>
              <Link href="/customer/dashboard" style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
              }}>
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link href="/customer/login" style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(100,116,139,0.3)",
                backgroundColor: "rgba(255,255,255,0.8)",
                color: "#334e6e",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
              }}>
                Log In
              </Link>
              <Link href="/customer/login?mode=signup" style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
              }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 60px",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: "24px" }}>
          <Image src="/lumii2.png" alt="Lumi" width={440} height={440} style={{ objectFit: "contain" }} />
        </div>

        <h1 style={{
          fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
          fontWeight: "700",
          color: "#334e6e",
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}>
          Fresh breakfast,<br />every morning.
        </h1>

        <p style={{
          fontSize: "17px",
          color: "#64748b",
          maxWidth: "420px",
          margin: "0 auto 36px",
          lineHeight: 1.6,
        }}>
          Order online for pickup or come dine with us. Quality food, served with care.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/customer/menu" style={{
            padding: "13px 32px",
            borderRadius: "999px",
            backgroundColor: "#3b82f6",
            color: "white",
            fontSize: "15px",
            fontWeight: "700",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
          }}>
            Order Online
          </Link>
        </div>
      </section>

      {/* Info strip */}
      <section style={{
        display: "flex",
        justifyContent: "center",
        gap: "40px",
        flexWrap: "wrap",
        padding: "20px 24px",
        margin: "0 40px",
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: "16px",
        border: "1px solid rgba(148,163,184,0.18)",
        backdropFilter: "blur(8px)",
      }}>
        {[
          { label: "Hours", value: "7:00 AM – 3:00 PM Daily" },
          { label: "Location", value: "123 Main Street, Houston TX" },
          { label: "Phone", value: "(713) 555-0182" },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", display: "block" }}>{label}</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginTop: "4px", display: "block" }}>{value}</span>
          </div>
        ))}
      </section>

      {/* Featured Menu */}
      <section style={{ padding: "64px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: "700", color: "#334e6e", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            Featured Items
          </h2>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>A taste of what we serve every morning.</p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}>
          {FEATURED_ITEMS.map((item) => (
            <div key={item.id} style={{
              backgroundColor: "rgba(255,255,255,0.75)",
              borderRadius: "16px",
              padding: "22px",
              border: "1px solid rgba(148,163,184,0.18)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>{item.name}</h3>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#3b82f6", whiteSpace: "nowrap", marginLeft: "12px" }}>
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <Link href="/customer/menu" style={{
            padding: "11px 28px",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(100,116,139,0.25)",
            color: "#334e6e",
            fontSize: "14px",
            fontWeight: "700",
            textDecoration: "none",
          }}>
            View Full Menu →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "28px 24px",
        color: "#94a3b8",
        fontSize: "13px",
        borderTop: "1px solid rgba(148,163,184,0.15)",
      }}>
        © 2026 Lumi Restaurant · All rights reserved.
      </footer>

    </div>
  );
}
