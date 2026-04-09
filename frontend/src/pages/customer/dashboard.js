import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("customerInfo");
    if (!stored) {
      router.replace("/customer/login");
      return;
    }
    startTransition(() => {
      setLastOrderId(localStorage.getItem("lastOrderId"));
      setCustomer(JSON.parse(stored));
    });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("customerAuthToken");
    localStorage.removeItem("customerInfo");
    router.push("/customer/login");
  }

  if (!customer) return null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
        </Link>
        <button
          onClick={handleLogout}
          style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}
        >
          Sign Out
        </button>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Welcome header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 6px" }}>
            Welcome back, {customer.firstName}!
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>{customer.email}</p>
        </div>

        {/* Points card */}
        <div style={{ backgroundColor: "#1e3a5f", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#93c5fd", margin: "0 0 8px" }}>Loyalty Points</p>
            <p style={{ fontSize: "40px", fontWeight: "900", margin: 0 }}>{customer.pointsBalance ?? 0}</p>
            <p style={{ fontSize: "13px", color: "#93c5fd", margin: "6px 0 0" }}>points earned</p>
          </div>
          <div style={{ fontSize: "56px" }}>⭐</div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
          <Link href="/customer/menu" style={{ textDecoration: "none" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🍽️</div>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>Order Now</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>Browse our menu</p>
            </div>
          </Link>

          {lastOrderId ? (
            <Link href={`/customer/order-tracking?orderId=${lastOrderId}`} style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>📦</div>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>Track Order</p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>Order #{lastOrderId}</p>
              </div>
            </Link>
          ) : (
            <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", textAlign: "center", opacity: 0.6 }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📦</div>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>Track Order</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>No recent orders</p>
            </div>
          )}
        </div>

        {/* Account info */}
        <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)" }}>
          <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 16px" }}>Account Info</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              ["Name", `${customer.firstName} ${customer.lastName}`],
              ["Email", customer.email],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontWeight: "600" }}>{label}</span>
                <span style={{ color: "#1e3a5f", fontWeight: "500" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
