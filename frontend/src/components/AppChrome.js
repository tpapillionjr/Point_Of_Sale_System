import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { canAccessManagerRoutes, clearStaffSession, getStoredEmployee, isDemoManager } from "../lib/session";
import { ensureCustomerPreviewSession, seedCustomerPreviewSession } from "../lib/customerSession";
import { fetchOnlineOrders } from "../lib/api";

const TRACKABLE_CUSTOMER_STATUSES = new Set(["placed", "confirmed", "preparing", "ready"]);
const SIMULATED_TRACKING_STATUSES = ["placed", "confirmed", "preparing", "ready", "picked_up"];
const DEMO_WELCOME_SUPPRESS_KEY = "demoManagerWelcomeSuppress";
const PREVIEW_TABS = [
  { id: "home", label: "Home", path: "/customer?preview=1&embed=1" },
  { id: "menu", label: "Menu", path: "/customer/menu?preview=1&embed=1" },
  { id: "checkout", label: "Checkout", path: "/customer/customer-checkout?preview=1&embed=1" },
  { id: "reservations", label: "Reservations", path: "/customer/reservation?preview=1&embed=1" },
];

const NAV_ITEMS = [
  { href: "/clock-in", label: "Clock In" },
  { href: "/tables", label: "Tables" },
  { href: "/online-orders", label: "Takeout / Online Orders" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/back-office", label: "Back Office" },
  { href: "/reports/revenue", label: "Reports" },
];

function isActiveRoute(pathname, href) {
  if (href === pathname) {
    return true;
  }

  if (href === "/back-office" || href.startsWith("/reports")) {
    return pathname.startsWith(href);
  }

  return false;
}

function subscribeToStorage(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener("pos-session-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("pos-session-change", listener);
  };
}

function getEmployeeSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("currentEmployee");
}

function formatStatusLabel(status) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AppChrome({ children }) {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("/customer?preview=1&embed=1");
  const [liveOrders, setLiveOrders] = useState([]);
  const [selectedLiveOrderId, setSelectedLiveOrderId] = useState("");
  const [simulatorEnabled, setSimulatorEnabled] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState("placed");
  const [demoWelcomeDismissed, setDemoWelcomeDismissed] = useState(false);
  const [suppressDemoWelcome, setSuppressDemoWelcome] = useState(false);
  const employeeSnapshot = useSyncExternalStore(subscribeToStorage, getEmployeeSnapshot, () => null);
  const employee = useMemo(() => {
    if (!employeeSnapshot) {
      return null;
    }

    try {
      return JSON.parse(employeeSnapshot);
    } catch {
      return getStoredEmployee();
    }
  }, [employeeSnapshot]);

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/back-office" || item.href === "/reports") {
      return canAccessManagerRoutes(employee);
    }

    return true;
  });
  const canOpenCustomerPreview =
    canAccessManagerRoutes(employee) &&
    (router.pathname.startsWith("/back-office") || router.pathname.startsWith("/reports"));
  const demoPreviewSimulatorEnabled = isDemoManager(employee);
  const localDemoWelcomeSuppressed =
    typeof window !== "undefined" && window.localStorage.getItem(DEMO_WELCOME_SUPPRESS_KEY) === "1";
  const showDemoWelcome =
    demoPreviewSimulatorEnabled &&
    !demoWelcomeDismissed &&
    !localDemoWelcomeSuppressed;
  const activePreviewTabId = useMemo(() => {
    if (previewPath.startsWith("/customer/order-tracking")) {
      return "live-tracking";
    }

    const matchedTab = PREVIEW_TABS.find((tab) => tab.path === previewPath);
    return matchedTab?.id ?? "home";
  }, [previewPath]);
  function handleLogout() {
    setDemoWelcomeDismissed(false);
    setSuppressDemoWelcome(false);
    clearStaffSession();
    router.push("/clock-in");
  }

  function handleCloseDemoWelcome() {
    if (typeof window !== "undefined") {
      if (suppressDemoWelcome) {
        window.localStorage.setItem(DEMO_WELCOME_SUPPRESS_KEY, "1");
      } else {
        window.localStorage.removeItem(DEMO_WELCOME_SUPPRESS_KEY);
      }
    }

    setDemoWelcomeDismissed(true);
  }

  function handleOpenCustomerPreview() {
    ensureCustomerPreviewSession();
    setPreviewPath("/customer?preview=1&embed=1");
    setSimulatorEnabled(false);
    setSimulatedStatus("placed");
    setIsPreviewOpen(true);
    void loadLiveOrders();
  }

  function handleResetCustomerPreview() {
    seedCustomerPreviewSession();
    setPreviewPath("/customer?preview=1&embed=1");
    setSimulatorEnabled(false);
    setSimulatedStatus("placed");
    void loadLiveOrders();
  }

  async function loadLiveOrders() {
    try {
      const orders = await fetchOnlineOrders();
      const trackableOrders = orders.filter((order) => TRACKABLE_CUSTOMER_STATUSES.has(order.customer_status));
      setLiveOrders(trackableOrders);
      setSelectedLiveOrderId((current) => {
        if (current && trackableOrders.some((order) => String(order.order_id) === String(current))) {
          return current;
        }
        return trackableOrders[0] ? String(trackableOrders[0].order_id) : "";
      });
    } catch {
      setLiveOrders([]);
      setSelectedLiveOrderId("");
    }
  }

  function handleSelectPreviewTab(path) {
    setPreviewPath(path);
  }

  function buildTrackingPreviewPath({ orderId = selectedLiveOrderId, useSimulator = simulatorEnabled, status = simulatedStatus } = {}) {
    if (demoPreviewSimulatorEnabled && useSimulator) {
      return `/customer/order-tracking?preview=1&embed=1&simulator=1&simStatus=${status}`;
    }

    if (orderId) {
      return `/customer/order-tracking?preview=1&embed=1&liveOrderId=${orderId}`;
    }

    return "/customer/order-tracking?preview=1&embed=1";
  }

  function handleShowLiveTracking() {
    if (!demoPreviewSimulatorEnabled && !selectedLiveOrderId) {
      return;
    }

    setPreviewPath(buildTrackingPreviewPath());
  }

  function handleLiveOrderSelection(orderId) {
    setSelectedLiveOrderId(orderId);
    if (previewPath.startsWith("/customer/order-tracking") && (!demoPreviewSimulatorEnabled || !simulatorEnabled)) {
      setPreviewPath(buildTrackingPreviewPath({ orderId, useSimulator: false }));
    }
  }

  function handleSimulatorToggle(nextEnabled) {
    setSimulatorEnabled(nextEnabled);
    if (previewPath.startsWith("/customer/order-tracking")) {
      setPreviewPath(buildTrackingPreviewPath({ useSimulator: nextEnabled }));
    }
  }

  function handleSimulatedStatusSelection(status) {
    setSimulatedStatus(status);
    if (previewPath.startsWith("/customer/order-tracking")) {
      setPreviewPath(buildTrackingPreviewPath({ status, useSimulator: true }));
    }
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Image
            src="/lumii2.png"
            alt="Lumi logo"
            width={56}
            height={56}
            priority
            className="app-shell__logo"
          />

          <div>
            <h1 className="app-shell__title app-shell__title--brand">lumi</h1>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActiveRoute(router.pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "app-shell__link app-shell__link--active" : "app-shell__link"}
              >
                {item.label}
              </Link>
            );
          })}

          {canOpenCustomerPreview ? (
            <button type="button" onClick={handleOpenCustomerPreview} className="app-shell__logout" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
              Customer Preview
            </button>
          ) : null}

          <button type="button" onClick={handleLogout} className="app-shell__logout">
            Logout
          </button>
        </nav>
      </header>

      <main className="app-shell__content">{children}</main>
      {isPreviewOpen ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(15,23,42,0.55)", display: "flex", justifyContent: "center", padding: "32px" }}>
          <div style={{ width: "min(1280px, 100%)", height: "calc(100vh - 64px)", backgroundColor: "#f8fafc", borderRadius: "24px", boxShadow: "0 24px 80px rgba(15,23,42,0.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.18)", backgroundColor: "white" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60a5fa" }}>
                  Customer Preview
                </p>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  Sandbox customer view
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.24)", backgroundColor: "#f8fafc" }}>
                  <select
                    value={selectedLiveOrderId}
                    onChange={(event) => handleLiveOrderSelection(event.target.value)}
                    style={{ border: "none", backgroundColor: "transparent", color: "#0f172a", fontSize: "13px", fontWeight: 600, outline: "none", minWidth: "210px" }}
                  >
                    {liveOrders.length === 0 ? (
                      <option value="">No live orders</option>
                    ) : (
                      liveOrders.map((order) => (
                        <option key={order.order_id} value={order.order_id}>
                          Order #{order.order_id} · {order.customer_status}
                        </option>
                      ))
                    )}
                  </select>
                  <button type="button" onClick={handleShowLiveTracking} disabled={!demoPreviewSimulatorEnabled && !selectedLiveOrderId} style={{ padding: "8px 12px", borderRadius: "999px", border: "1px solid rgba(59,130,246,0.24)", backgroundColor: demoPreviewSimulatorEnabled || selectedLiveOrderId ? "#dbeafe" : "#e2e8f0", color: demoPreviewSimulatorEnabled || selectedLiveOrderId ? "#1d4ed8" : "#94a3b8", fontSize: "12px", fontWeight: 700, cursor: demoPreviewSimulatorEnabled || selectedLiveOrderId ? "pointer" : "not-allowed" }}>
                    Track Live Order
                  </button>
                </div>
                {demoPreviewSimulatorEnabled ? (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", border: "1px solid rgba(251,191,36,0.3)", backgroundColor: simulatorEnabled ? "#fffbeb" : "white", color: "#92400e", fontSize: "12px", fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={simulatorEnabled}
                      onChange={(event) => handleSimulatorToggle(event.target.checked)}
                      style={{ accentColor: "#f59e0b" }}
                    />
                    Preview Simulator
                  </label>
                ) : null}
                <button type="button" onClick={handleResetCustomerPreview} style={{ padding: "10px 14px", borderRadius: "999px", border: "1px solid rgba(59,130,246,0.24)", backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  Reset Preview
                </button>
                <button type="button" onClick={() => setIsPreviewOpen(false)} style={{ padding: "10px 14px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.24)", backgroundColor: "white", color: "#475569", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", padding: "12px 20px", backgroundColor: "#f8fbff", borderBottom: "1px solid rgba(191,219,254,0.55)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {PREVIEW_TABS.map((tab) => {
                const isActive = activePreviewTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectPreviewTab(tab.path)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      border: isActive ? "1px solid rgba(59,130,246,0.28)" : "1px solid rgba(148,163,184,0.24)",
                      backgroundColor: isActive ? "#dbeafe" : "white",
                      color: isActive ? "#1d4ed8" : "#475569",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleShowLiveTracking}
                disabled={!demoPreviewSimulatorEnabled && !selectedLiveOrderId}
                style={{
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: activePreviewTabId === "live-tracking" ? "1px solid rgba(59,130,246,0.28)" : "1px solid rgba(148,163,184,0.24)",
                  backgroundColor: activePreviewTabId === "live-tracking" ? "#dbeafe" : "white",
                  color: activePreviewTabId === "live-tracking" ? "#1d4ed8" : !demoPreviewSimulatorEnabled && !selectedLiveOrderId ? "#94a3b8" : "#475569",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: demoPreviewSimulatorEnabled || selectedLiveOrderId ? "pointer" : "not-allowed",
                }}
              >
                Live Tracking
              </button>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                {demoPreviewSimulatorEnabled ? "Demo simulator stays local to this modal." : "Read-only customer sandbox."}
              </p>
            </div>
            {demoPreviewSimulatorEnabled && simulatorEnabled ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "10px 20px", backgroundColor: "#fffbeb", borderBottom: "1px solid rgba(251,191,36,0.28)" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309" }}>
                  Simulated Tracking
                </span>
                {SIMULATED_TRACKING_STATUSES.map((status) => {
                  const isActive = simulatedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleSimulatedStatusSelection(status)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        border: isActive ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(251,191,36,0.25)",
                        backgroundColor: isActive ? "#fef3c7" : "white",
                        color: "#92400e",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {formatStatusLabel(status)}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <iframe
              title="Customer preview"
              src={previewPath}
              style={{ flex: 1, width: "100%", border: "none", backgroundColor: "#f8fafc" }}
            />
          </div>
        </div>
      ) : null}
      {showDemoWelcome ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={handleCloseDemoWelcome} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.42)", backdropFilter: "blur(10px)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: "560px", borderRadius: "28px", backgroundColor: "rgba(255,255,255,0.96)", padding: "28px", boxShadow: "0 30px 80px rgba(15,23,42,0.26)", border: "1px solid rgba(191,219,254,0.7)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#60a5fa" }}>
              Demo Manager
            </p>
            <h2 style={{ margin: "0 0 12px", fontSize: "30px", lineHeight: 1.15, fontWeight: 900, color: "#0f172a" }}>
              About this demo
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: "15px", lineHeight: 1.65, color: "#475569" }}>
              You are signed in to the read-only showcase account. This mode is designed for walkthroughs, portfolio demos, and safe customer-view previews without changing live restaurant data.
            </p>

            <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
              {[
                ["What it does", "Customer ordering, live order tracking, back-office management, reporting, reservations, and safe preview flows."],
                ["What to try", "Open Customer Preview, explore Home/Menu/Checkout/Reservations, and use the tracking simulator to demo status changes without touching the database."],
                ["Read-only limits", "Menu edits, loyalty changes, settings updates, employee actions, and other write operations stay disabled in this account."],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: "16px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    backgroundColor: "#f8fbff",
                    padding: "14px 16px",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                    {label}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "#475569", fontWeight: 600 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", color: "#475569", fontSize: "13px", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={suppressDemoWelcome}
                onChange={(event) => setSuppressDemoWelcome(event.target.checked)}
                style={{ accentColor: "#2563eb" }}
              />
              Don&apos;t show this again
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleCloseDemoWelcome}
                style={{ padding: "12px 18px", borderRadius: "999px", border: "none", backgroundColor: "#2563eb", color: "white", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isDemoManager(employee) ? (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, padding: "10px 16px", backgroundColor: "#fef3c7", color: "#92400e", fontSize: "13px", fontWeight: 600, borderTop: "1px solid #fcd34d", boxShadow: "0 -6px 18px rgba(146,64,14,0.08)" }}>
          Demo manager mode: you can view back-office and reports, but write actions are disabled.
        </div>
      ) : null}
    </div>
  );
}
