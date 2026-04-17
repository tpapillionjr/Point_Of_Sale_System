import { useState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { fetchCustomerOrderHistory, fetchCustomerOrderStatus } from "../../lib/api";

const STEPS = [
  { id: 1, label: "Order Placed", icon: "1", message: "We've received your order!" },
  { id: 2, label: "Confirmed", icon: "2", message: "Your order has been confirmed by our staff." },
  { id: 3, label: "Preparing", icon: "3", message: "Our kitchen is preparing your order now." },
  { id: 4, label: "Ready", icon: "4", message: "Your order is ready for pickup!" },
];

const ACTIVE_ORDER_STATUSES = new Set(["placed", "confirmed", "preparing", "ready"]);

export default function OrderTrackingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const currentStepRef = useRef(1);
  const [estimatedPoints, setEstimatedPoints] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [isCanceled, setIsCanceled] = useState(false);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("customerAuthToken");
    if (!token) return;

    fetchCustomerOrderHistory(token)
      .then((orders) => {
        setActiveOrders(orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.customer_status)));
      })
      .catch(() => {});
  }, [router.query.orderId]);

  useEffect(() => {
    const stored = localStorage.getItem("estimatedPoints");
    if (stored) {
      startTransition(() => setEstimatedPoints(Number(stored)));
      localStorage.removeItem("estimatedPoints");
    }

    const orderId = router.query.orderId;
    if (!orderId) return;

    startTransition(() => {
      setIsPickedUp(false);
      setIsCanceled(false);
    });

    const STATUS_MAP = { placed: 1, confirmed: 2, preparing: 3, ready: 4 };
    let intervalId = null;

    async function poll() {
      try {
        const { status } = await fetchCustomerOrderStatus(orderId);

        if (status === "canceled" || status === "denied") {
          currentStepRef.current = -1;
          setCurrentStep(1);
          setIsCanceled(true);
          setTrackingError("");
          clearInterval(intervalId);
          return;
        }

        if (status === "picked_up") {
          setIsPickedUp(true);
          setActiveOrders((prev) => prev.filter((o) => String(o.online_order_id) !== String(orderId)));
          clearInterval(intervalId);
          return;
        }

        const step = STATUS_MAP[status] ?? 1;
        currentStepRef.current = step;
        setCurrentStep(step);
        setIsCanceled(false);
        setTrackingError("");
      } catch (error) {
        setTrackingError(error.message || "Unable to access this order.");
      }
    }

    poll();
    intervalId = setInterval(poll, 5000);

    return () => clearInterval(intervalId);
  }, [router.query.orderId]);

  const active = STEPS.find((step) => step.id === currentStep) ?? STEPS[0];
  const currentOrder = activeOrders.find((o) => String(o.online_order_id) === String(router.query.orderId));

  if (isPickedUp) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dcfce7 0%, #f0fdf4 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(134,239,172,0.15)" }}>
          <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: "20px", fontWeight: "700", color: "#14532d" }}>lumi</span>
          </Link>
          <Link href="/customer/menu" style={{ fontSize: "14px", fontWeight: "600", color: "#16a34a", textDecoration: "none" }}>
            Order Again
          </Link>
        </nav>

        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: "20px", padding: "40px 32px", border: "1px solid #bbf7d0", boxShadow: "0 4px 24px rgba(22,163,74,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>✓</div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#15803d", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Enjoy your meal!</h1>
            <p style={{ color: "#166534", fontSize: "15px", margin: "0 0 24px" }}>
              Your order has been picked up. Thank you for dining with us!
            </p>
            {activeOrders.filter((o) => String(o.online_order_id) !== String(router.query.orderId)).length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", color: "#166534", fontWeight: "600", margin: "0 0 10px" }}>You still have active orders:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {activeOrders
                    .filter((o) => String(o.online_order_id) !== String(router.query.orderId))
                    .map((order) => (
                      <Link
                        key={order.online_order_id}
                        href={`/customer/order-tracking?orderId=${order.online_order_id}`}
                        style={{ display: "block", padding: "10px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", color: "#15803d", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}
                      >
                        Track Order #{order.online_order_id} — ${Number(order.total).toFixed(2)}
                      </Link>
                    ))}
                </div>
              </div>
            )}
            <Link href="/customer" style={{ display: "inline-block", padding: "12px 24px", backgroundColor: "#15803d", color: "white", borderRadius: "10px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCanceled) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fee2e2 0%, #fff5f5 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(248,113,113,0.15)" }}>
          <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: "20px", fontWeight: "700", color: "#7f1d1d" }}>lumi</span>
          </Link>
          <Link href="/customer/menu" style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b", textDecoration: "none" }}>
            Start a New Order
          </Link>
        </nav>

        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: "20px", padding: "40px 32px", border: "1px solid #fecaca", boxShadow: "0 4px 24px rgba(127,29,29,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>X</div>
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#991b1b", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Order Canceled</h1>
            <p style={{ color: "#7f1d1d", fontSize: "15px", margin: 0 }}>
              This order was canceled by the restaurant. Please contact the store if you need help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
        </Link>
        <Link href="/customer/menu" style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", textDecoration: "none" }}>
          Order More
        </Link>
      </nav>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e3a5f", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Order Tracker</h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>We&apos;ll keep you updated every step of the way.</p>
        </div>

        {activeOrders.length > 1 && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "18px 22px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", marginBottom: "24px" }}>
            <label htmlFor="tracking-active-order-select" style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "10px" }}>
              Other Active Orders
            </label>
            <select
              id="tracking-active-order-select"
              value={router.query.orderId ? String(router.query.orderId) : ""}
              onChange={(event) => {
                if (event.target.value) {
                  router.push(`/customer/order-tracking?orderId=${event.target.value}`);
                }
              }}
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px 14px", color: "#1e3a5f", fontSize: "14px", fontWeight: "700", backgroundColor: "white" }}
            >
              {activeOrders.map((order) => (
                <option key={order.online_order_id} value={order.online_order_id}>
                  Order #{order.online_order_id} - {order.customer_status.replace("_", " ")} - ${Number(order.total).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        {trackingError ? (
          <div style={{ backgroundColor: "#fef2f2", borderRadius: "14px", padding: "16px 20px", border: "1px solid #fecaca", marginBottom: "24px", color: "#991b1b", fontSize: "14px", fontWeight: "700" }}>
            {trackingError}
          </div>
        ) : null}

        {!trackingError && estimatedPoints > 0 && (
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "14px", padding: "16px 24px", border: "1px solid #bbf7d0", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>*</span>
            <p style={{ margin: 0, fontSize: "14px", color: "#166534", fontWeight: "600" }}>
              You&apos;ll earn approximately <strong>{estimatedPoints} points</strong> when this order is paid.
            </p>
          </div>
        )}

        {!trackingError && currentOrder?.items?.length > 0 && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "20px", padding: "24px 28px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(15,23,42,0.07)", marginBottom: "24px" }}>
            <p style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 16px" }}>
              Order #{currentOrder.online_order_id} — Receipt
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {currentOrder.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#1e3a5f" }}>
                  <span style={{ fontWeight: "600" }}>{item.name} <span style={{ color: "#94a3b8", fontWeight: "500" }}>x{item.quantity}</span></span>
                  <span style={{ fontWeight: "700" }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                <span>Subtotal</span>
                <span>${Number(currentOrder.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                <span>Tax</span>
                <span>${Number(currentOrder.tax).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "800", color: "#1e3a5f", marginTop: "4px" }}>
                <span>Total</span>
                <span>${Number(currentOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {!trackingError && (
          <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "20px", padding: "40px 32px 32px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(15,23,42,0.07)", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", position: "relative", marginBottom: "32px" }}>
              <div style={{ position: "absolute", top: "20px", left: "calc(12.5%)", right: "calc(12.5%)", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px", zIndex: 0 }} />
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "calc(12.5%)",
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 75}%`,
                  height: "4px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "2px",
                  zIndex: 1,
                  transition: "width 0.6s ease",
                }}
              />

              {STEPS.map((step) => {
                const done = step.id < currentStep;
                const isActive = step.id === currentStep;
                return (
                  <div key={step.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative", zIndex: 2 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isActive ? "20px" : "16px",
                        backgroundColor: done ? "#3b82f6" : isActive ? "#1d4ed8" : "white",
                        border: isActive ? "3px solid #1d4ed8" : done ? "none" : "2px solid #d1d5db",
                        boxShadow: isActive ? "0 0 0 6px rgba(59,130,246,0.15)" : done ? "0 2px 8px rgba(59,130,246,0.25)" : "none",
                        transition: "all 0.4s ease",
                        color: done || isActive ? "white" : "#1e3a5f",
                        fontWeight: "800",
                      }}
                    >
                      {done ? "OK" : step.icon}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: isActive ? "800" : done ? "700" : "500",
                        color: isActive ? "#1d4ed8" : done ? "#3b82f6" : "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ backgroundColor: currentStep === 4 ? "#f0fdf4" : "#eff6ff", borderRadius: "14px", padding: "20px 24px", textAlign: "center", border: `1px solid ${currentStep === 4 ? "#bbf7d0" : "#bfdbfe"}` }}>
              <div style={{ fontSize: "36px", marginBottom: "8px", fontWeight: "800" }}>{active.icon}</div>
              <p style={{ fontSize: "18px", fontWeight: "800", color: currentStep === 4 ? "#166534" : "#1e3a5f", margin: "0 0 6px" }}>
                {active.message}
              </p>
              {currentStep < 4 && (
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>This page will reflect updates as your order progresses.</p>
              )}
              {currentStep === 4 && (
                <p style={{ fontSize: "14px", color: "#16a34a", fontWeight: "600", margin: 0 }}>Please come pick up your order at the counter.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
