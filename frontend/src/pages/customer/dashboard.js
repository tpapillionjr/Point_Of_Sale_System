import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { fetchCustomerLoyaltyInfo, fetchLoyaltyRewardsPublic } from "../../lib/api";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("customerInfo");
    if (!stored) { router.replace("/customer/login"); return; }
    const parsed = JSON.parse(stored);
    startTransition(() => {
      setLastOrderId(localStorage.getItem("lastOrderId"));
      setCustomer(parsed);
    });

    const token = localStorage.getItem("customerAuthToken");
    if (token) {
      fetchCustomerLoyaltyInfo(token)
        .then((info) => {
          setLoyaltyInfo(info);
          // keep localStorage in sync
          const updated = { ...parsed, pointsBalance: info.pointsBalance };
          localStorage.setItem("customerInfo", JSON.stringify(updated));
          setCustomer(updated);
        })
        .catch(() => {});

      fetchLoyaltyRewardsPublic()
        .then(setRewards)
        .catch(() => {});
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("customerAuthToken");
    localStorage.removeItem("customerInfo");
    router.push("/customer/login");
  }

  if (!customer) return null;

  const pointsBalance = loyaltyInfo?.pointsBalance ?? customer.pointsBalance ?? 0;

  // Next reward the customer can't yet afford
  const nextReward = rewards.find((r) => r.points_cost > pointsBalance);
  const progressPct = nextReward
    ? Math.min(100, Math.round((pointsBalance / nextReward.points_cost) * 100))
    : rewards.length > 0 ? 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
        </Link>
        <button onClick={handleLogout} style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
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
        <div style={{ backgroundColor: "#1e3a5f", borderRadius: "20px", padding: "28px 32px", marginBottom: "24px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: nextReward ? "20px" : "0" }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#93c5fd", margin: "0 0 8px" }}>Loyalty Points</p>
              <p style={{ fontSize: "40px", fontWeight: "900", margin: 0 }}>{pointsBalance.toLocaleString()}</p>
              <p style={{ fontSize: "13px", color: "#93c5fd", margin: "6px 0 0" }}>points earned</p>
            </div>
            <div style={{ fontSize: "56px" }}>⭐</div>
          </div>

          {nextReward && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#93c5fd", marginBottom: "6px" }}>
                <span>Progress toward: <strong style={{ color: "white" }}>{nextReward.name}</strong></span>
                <span>{pointsBalance} / {nextReward.points_cost} pts</span>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, backgroundColor: "#60a5fa", borderRadius: "999px", transition: "width 0.6s ease" }} />
              </div>
              <p style={{ fontSize: "11px", color: "#93c5fd", margin: "6px 0 0" }}>
                {nextReward.points_cost - pointsBalance} more points needed
              </p>
            </div>
          )}

          {rewards.length > 0 && !nextReward && (
            <p style={{ fontSize: "13px", color: "#86efac", margin: "16px 0 0", fontWeight: "600" }}>
              You can redeem any reward in the catalog below!
            </p>
          )}
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

        {/* Rewards catalog */}
        {rewards.length > 0 && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 16px" }}>Rewards Catalog</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {rewards.map((reward) => {
                const canRedeem = pointsBalance >= reward.points_cost;
                return (
                  <div key={reward.reward_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "10px", backgroundColor: canRedeem ? "#f0fdf4" : "#f8fafc", border: `1px solid ${canRedeem ? "#bbf7d0" : "#e2e8f0"}` }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a5f", margin: 0 }}>{reward.name}</p>
                      {reward.menu_item_name && (
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>{reward.menu_item_name}</p>
                      )}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: canRedeem ? "#16a34a" : "#94a3b8", whiteSpace: "nowrap", marginLeft: "12px" }}>
                      {reward.points_cost} pts
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "14px 0 0" }}>
              Redeem rewards at checkout or in-store.
            </p>
          </div>
        )}

        {/* Points history */}
        {loyaltyInfo?.transactions?.length > 0 && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: 0 }}>Points History</p>
              <button
                onClick={() => setShowHistory((v) => !v)}
                style={{ fontSize: "12px", fontWeight: "600", color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}
              >
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>
            {showHistory && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {loyaltyInfo.transactions.slice(0, 10).map((tx) => (
                  <div key={tx.transaction_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <p style={{ margin: 0, color: "#374151", fontWeight: "500" }}>{tx.description}</p>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "11px" }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontWeight: "700", color: tx.type === "earned" ? "#16a34a" : "#ef4444" }}>
                      {tx.type === "earned" ? "+" : "-"}{tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
