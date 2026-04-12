import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchOnlineOrders, confirmOnlineOrder, markOnlineOrderPickedUp } from "../lib/api";

const STATUS_META = {
  placed:    { label: "New",       color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  preparing: { label: "Preparing", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  ready:     { label: "Ready",     color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
};

export default function OnlineOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const data = await fetchOnlineOrders();
      setOrders(data);
      setMessage(null);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  function handleCheckout(orderId) {
    router.push(`/online-checkout?orderId=${orderId}`);
  }

  async function handlePickup(orderId) {
    try {
      await markOnlineOrderPickedUp(orderId);
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleConfirm(orderId) {
    try {
      await confirmOnlineOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => o.order_id === orderId ? { ...o, customer_status: "confirmed" } : o)
      );
    } catch (err) {
      setMessage(err.message);
    }
  }

  const newOrders = orders.filter((o) => o.customer_status === "placed");
  const activeOrders = orders.filter((o) => o.customer_status !== "placed");

  return (
    <div style={{ padding: "28px 32px", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Online Orders</h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
            {newOrders.length > 0 ? `${newOrders.length} new order${newOrders.length > 1 ? "s" : ""} waiting` : "No new orders"}
          </p>
        </div>
        <button
          onClick={loadOrders}
          style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "20px" }}>
          {message}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ fontSize: "16px", fontWeight: "600" }}>No active online orders</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* New orders — need confirmation */}
          {newOrders.length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#f97316", marginBottom: "12px" }}>
                ● New — Awaiting Confirmation
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
                {newOrders.map((order) => (
                  <OrderCard key={order.order_id} order={order} onConfirm={handleConfirm} onCheckout={handleCheckout} onPickup={handlePickup} />
                ))}
              </div>
            </div>
          )}

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: "12px" }}>
                Active Orders
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
                {activeOrders.map((order) => (
                  <OrderCard key={order.order_id} order={order} onConfirm={handleConfirm} onCheckout={handleCheckout} onPickup={handlePickup} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onConfirm, onCheckout, onPickup }) {
  const meta = STATUS_META[order.customer_status] ?? STATUS_META.placed;
  const note = order.order_note || "";
  // Parse contact info from order_note: "FirstName LastName | phone | note"
  const parts = note.split(" | ");
  const name = parts[0] || "Guest";
  const phone = parts[1] || "";
  const instructions = parts[2] || "";

  return (
    <div style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", overflow: "hidden" }}>

      {/* Card header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Order #{order.order_id}</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>{name}{phone ? ` · ${phone}` : ""}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
          <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", backgroundColor: order.payment_preference === "online" ? "#f0fdf4" : "#f8fafc", color: order.payment_preference === "online" ? "#16a34a" : "#64748b", border: `1px solid ${order.payment_preference === "online" ? "#bbf7d0" : "#e2e8f0"}` }}>
            {order.payment_preference === "online" ? "💳 Prepaid" : "💵 Pay at Pickup"}
          </span>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
          {(order.items || []).map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#374151" }}>{item.quantity}× {item.name}</span>
              <span style={{ color: "#64748b" }}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {instructions && (
          <p style={{ fontSize: "12px", color: "#f97316", backgroundColor: "#fff7ed", borderRadius: "6px", padding: "6px 10px", margin: "0 0 12px" }}>
            📝 {instructions}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800", color: "#0f172a", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
          <span>Total</span>
          <span>${Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {order.customer_status === "placed" && (
          <button
            onClick={() => onConfirm(order.order_id)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#f97316", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
          >
            Confirm Order
          </button>
        )}
        {order.customer_status !== "placed" && (
          <>
            {order.payment_status === "unpaid" ? (
              <button
                onClick={() => onCheckout(order.order_id)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
              >
                Checkout Customer
              </button>
            ) : (
              <button
                disabled
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4", color: "#16a34a", fontSize: "14px", fontWeight: "700", cursor: "not-allowed" }}
              >
                ✓ Paid
              </button>
            )}
            {order.customer_status === "ready" && order.payment_status === "paid" && (
              <button
                onClick={() => onPickup(order.order_id)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#111827", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
              >
                ✓ Customer Picked Up
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
