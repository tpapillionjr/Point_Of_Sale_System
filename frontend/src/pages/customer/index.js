import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { useCustomerSession } from "../../lib/useCustomerSession";
import CustomerNav from "../../components/CustomerNav";
import { withCustomerPreview } from "../../lib/customerSession";

const FEATURED_ITEMS = [
  { id: 1, name: "All-Star Special", description: "Our signature breakfast platter with eggs, bacon, and toast.", price: 11.99, category: "Entrees" },
  { id: 2, name: "Bacon Egg Breakfast", description: "Two eggs your way with crispy bacon and home fries.", price: 9.99, category: "Entrees" },
  { id: 3, name: "Ham and Cheese Omelet", description: "Fluffy three-egg omelet with diced ham and melted cheese.", price: 10.49, category: "Entrees" },
  { id: 4, name: "Breakfast Hashbrown Bowl", description: "Crispy hashbrowns topped with eggs, cheese, and your choice of meat.", price: 9.99, category: "Entrees" },
  { id: 5, name: "Cheese Omelet", description: "Light and fluffy omelet with a blend of melted cheeses.", price: 9.49, category: "Entrees" },
  { id: 6, name: "Sausage Egg Breakfast", description: "Two eggs with savory sausage links and golden toast.", price: 9.99, category: "Entrees" },
];

export default function CustomerHomePage() {
  const router = useRouter();
  const { customer, isPreview } = useCustomerSession();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showInlineDemoPanel, setShowInlineDemoPanel] = useState(true);
  const isEmbeddedPreview = router.query.embed === "1";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative",
    }}>

      <CustomerNav right={
        customer ? (
          isPreview ? (
            <span style={{ padding: "7px 14px", borderRadius: "999px", backgroundColor: "rgba(59,130,246,0.08)", color: "#1d4ed8", fontSize: "12px", fontWeight: "700", border: "1px solid rgba(59,130,246,0.18)" }}>
              Preview Mode
            </span>
          ) : (
            <Link href="/customer/dashboard" style={{ padding: "7px 18px", borderRadius: "999px", backgroundColor: "#3b82f6", color: "white", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              My Account
            </Link>
          )
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={withCustomerPreview("/customer/login", isPreview)} style={{ padding: "7px 16px", borderRadius: "999px", border: "1px solid rgba(100,116,139,0.3)", backgroundColor: "rgba(255,255,255,0.8)", color: "#334e6e", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              Log In
            </Link>
            <Link href={withCustomerPreview("/customer/login?mode=signup", isPreview)} style={{ padding: "7px 16px", borderRadius: "999px", backgroundColor: "#3b82f6", color: "white", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              Sign Up
            </Link>
          </div>
        )
      } />

      {!isEmbeddedPreview ? (
        <section style={{ position: "absolute", top: "88px", left: 0, right: 0, zIndex: 5, pointerEvents: "none", padding: "0 24px" }}>
          <div style={{ maxWidth: "1180px", margin: "0 auto", display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: "18px" }}>
            {showInlineDemoPanel ? (
              <div style={{
                width: "min(100%, 340px)",
                borderRadius: "18px",
                border: "1px solid rgba(96,165,250,0.28)",
                background: "linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(255,255,255,0.94) 100%)",
                boxShadow: "0 8px 24px rgba(59,130,246,0.10)",
                padding: "14px 16px",
                pointerEvents: "auto",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em", color: "#60a5fa", margin: "0 0 4px" }}>
                      Demo Access
                    </p>
                    <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1e3a5f", margin: 0 }}>
                      Read-only manager
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineDemoPanel(false)}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#94a3b8",
                      fontSize: "18px",
                      lineHeight: 1,
                      cursor: "pointer",
                      padding: "0 2px",
                    }}
                    aria-label="Close demo access panel"
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                  {[
                    ["Email", "demo.manager@pos.local"],
                    ["Password", "DemoView2026!"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: "12px",
                        border: "1px solid rgba(148,163,184,0.22)",
                        backgroundColor: "rgba(255,255,255,0.82)",
                        padding: "10px 12px",
                      }}
                    >
                      <p style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 3px" }}>
                        {label}
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: 0, wordBreak: "break-word" }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#92400e", margin: 0 }}>
                    Read-only demo mode.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      border: "1px solid rgba(59,130,246,0.28)",
                      backgroundColor: "white",
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInlineDemoPanel(true)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px dashed rgba(59,130,246,0.38)",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(59,130,246,0.08)",
                  pointerEvents: "auto",
                }}
              >
                Demo Access
              </button>
            )}
          </div>
        </section>
      ) : null}

      {/* Hero */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: !isEmbeddedPreview ? "160px 24px 60px" : "80px 24px 60px",
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
          <Link href={withCustomerPreview("/customer/menu", isPreview)} style={{
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
          <Link href={withCustomerPreview(customer ? "/customer/reservation" : "/customer/login?redirect=/customer/reservation", isPreview)} style={{
            padding: "13px 32px",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(100,116,139,0.25)",
            color: "#334e6e",
            fontSize: "15px",
            fontWeight: "700",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
          }}>
            Make Reservation
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
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#111827", whiteSpace: "nowrap", marginLeft: "12px" }}>
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <Link href={withCustomerPreview("/customer/menu", isPreview)} style={{
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

      {showDemoModal && !isEmbeddedPreview ? (
        <DemoAccessModal onClose={() => setShowDemoModal(false)} />
      ) : null}

    </div>
  );
}

function DemoAccessModal({ onClose }) {
  const credentialBox = {
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.25)",
    backgroundColor: "#f8fbff",
    padding: "12px 14px",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.4)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "420px", borderRadius: "24px", backgroundColor: "white", padding: "28px", boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}>
        <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em", color: "#60a5fa", margin: "0 0 10px" }}>
          Demo Access
        </p>
            <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 10px" }}>
              Read-only manager preview
            </h3>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 18px" }}>
          Use this account to explore Back Office and Reports without being able to change live restaurant data.
        </p>

        <div style={{ display: "grid", gap: "10px", marginBottom: "18px" }}>
          {[
            ["What it does", "Customer ordering, live tracking, back-office management, reporting, and demo-safe previews."],
            ["Key features", "Read-only demo manager, embedded customer preview, simulated tracking, reports, and reservations."],
            ["Tech stack", "Next.js frontend, Express backend, MySQL on Railway, and role-based access controls."],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(148,163,184,0.2)",
                backgroundColor: "rgba(248,251,255,0.95)",
                padding: "12px 14px",
              }}
            >
              <p style={{ margin: "0 0 5px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                {label}
              </p>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55, color: "#475569", fontWeight: "600" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
          <div style={credentialBox}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", margin: "0 0 4px" }}>Email</p>
            <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>demo.manager@pos.local</p>
          </div>
          <div style={credentialBox}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", margin: "0 0 4px" }}>Password</p>
            <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>DemoView2026!</p>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "#92400e", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "10px 12px", lineHeight: 1.5, margin: "0 0 18px" }}>
          Demo manager mode is intentionally read-only. Menu edits, loyalty changes, staff changes, and other write actions are disabled.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "10px 16px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.35)", backgroundColor: "white", color: "#475569", fontWeight: "700", cursor: "pointer" }}
          >
            Close
          </button>
          <Link
            href="/customer/login"
            onClick={onClose}
            style={{ padding: "10px 16px", borderRadius: "999px", backgroundColor: "#3b82f6", color: "white", fontWeight: "700", textDecoration: "none" }}
          >
            Open Login
          </Link>
        </div>
      </div>
    </div>
  );
}
