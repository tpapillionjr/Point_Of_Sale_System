import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { fetchCustomerOrderStatus } from "../../lib/api";

const STEPS = [
  { id: 1, label: "Order Placed",  icon: "📋", message: "We've received your order!" },
  { id: 2, label: "Confirmed",     icon: "✅", message: "Your order has been confirmed by our staff." },
  { id: 3, label: "Preparing",     icon: "👨‍🍳", message: "Our kitchen is preparing your order now." },
  { id: 4, label: "Ready",         icon: "🥡", message: "Your order is ready for pickup!" },
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const currentStepRef = useRef(1);

  useEffect(() => {
    const orderId = router.query.orderId;
    if (!orderId) return;

    const STATUS_MAP = { placed: 1, confirmed: 2, preparing: 3, ready: 4 };

    async function poll() {
      try {
        const { status } = await fetchCustomerOrderStatus(orderId);
        const step = STATUS_MAP[status] ?? 1;
        currentStepRef.current = step;
        setCurrentStep(step);
      } catch {
        // silently ignore — keep showing last known step
      }
    }

    poll();
    const interval = setInterval(() => {
      if (currentStepRef.current >= 4) {
        clearInterval(interval);
        return;
      }
      poll();
    }, 5000);
    return () => clearInterval(interval);
  }, [router.query.orderId]);

  const active = STEPS.find((s) => s.id === currentStep) ?? STEPS[0];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Navbar */}
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

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e3a5f", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Order Tracker</h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>We&apos;ll keep you updated every step of the way.</p>
        </div>

        {/* Progress bar */}
        <div style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "20px", padding: "40px 32px 32px", border: "1px solid rgba(148,163,184,0.18)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(15,23,42,0.07)", marginBottom: "24px" }}>

          {/* Steps row */}
          <div style={{ display: "flex", alignItems: "center", position: "relative", marginBottom: "32px" }}>

            {/* Background connector line */}
            <div style={{ position: "absolute", top: "20px", left: "calc(12.5%)", right: "calc(12.5%)", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px", zIndex: 0 }} />

            {/* Filled connector */}
            <div style={{
              position: "absolute",
              top: "20px",
              left: "calc(12.5%)",
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 75}%`,
              height: "4px",
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              zIndex: 1,
              transition: "width 0.6s ease",
            }} />

            {STEPS.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <div key={step.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative", zIndex: 2 }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: active ? "20px" : "16px",
                    backgroundColor: done ? "#3b82f6" : active ? "#1d4ed8" : "white",
                    border: active ? "3px solid #1d4ed8" : done ? "none" : "2px solid #d1d5db",
                    boxShadow: active ? "0 0 0 6px rgba(59,130,246,0.15)" : done ? "0 2px 8px rgba(59,130,246,0.25)" : "none",
                    transition: "all 0.4s ease",
                  }}>
                    {done ? (
                      <span style={{ color: "white", fontSize: "16px", fontWeight: "800" }}>✓</span>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: active ? "800" : done ? "700" : "500",
                    color: active ? "#1d4ed8" : done ? "#3b82f6" : "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          <div style={{ backgroundColor: currentStep === 4 ? "#f0fdf4" : "#eff6ff", borderRadius: "14px", padding: "20px 24px", textAlign: "center", border: `1px solid ${currentStep === 4 ? "#bbf7d0" : "#bfdbfe"}` }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>{active.icon}</div>
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


      </div>
    </div>
  );
}
