import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { fetchActiveOrderByTable, fetchTables, updateTableStatus } from "../lib/api";

const TAKEOUT_TABLE_NUMBER = 10000;

const TABLE_LAYOUT = {
  1: { id: "T1", area: "Main", x: "11%", y: "18%" },
  2: { id: "T2", area: "Main", x: "25%", y: "18%" },
  3: { id: "T3", area: "Main", x: "39%", y: "18%" },
  4: { id: "T4", area: "Main", x: "13%", y: "41%" },
  5: { id: "B1", area: "Bar", x: "69%", y: "28%" },
  6: { id: "B2", area: "Bar", x: "79%", y: "28%" },
  7: { id: "B3", area: "Bar", x: "89%", y: "28%" },
  8: { id: "T5", area: "Patio", x: "17%", y: "67%" },
  9: { id: "T6", area: "Patio", x: "35%", y: "67%" },
  10: { id: "T7", area: "Patio", x: "53%", y: "67%" },
  [TAKEOUT_TABLE_NUMBER]: { id: "Takeout", area: "Takeout", x: "76%", y: "78%" },
};

const STATUS_MAP = {
  available: "open",
  occupied: "occupied",
  reserved: "reserved",
  inactive: "inactive",
};

const STATUS_META = {
  open: { label: "Open", fill: "#dcfce7", border: "#22c55e", text: "#166534" },
  occupied: { label: "Occupied", fill: "#e2e8f0", border: "#64748b", text: "#334155" },
  reserved: { label: "Reserved", fill: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },
  inactive: { label: "Inactive", fill: "#f1f5f9", border: "#94a3b8", text: "#475569" },
};

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: "0.8rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  title: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    color: "#0f172a",
  },
  subtext: {
    margin: "12px 0 0",
    maxWidth: "560px",
    color: "#475569",
    lineHeight: 1.5,
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(110px, 1fr))",
    gap: "12px",
    width: "min(100%, 560px)",
  },
  summaryCard: {
    padding: "16px 18px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #ffffff, #eff6ff)",
    border: "1px solid rgba(100, 116, 139, 0.14)",
    textAlign: "center",
  },
  summaryNumber: {
    display: "block",
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#1e293b",
    lineHeight: 1.1,
  },
  summaryLabel: {
    display: "block",
    marginTop: "4px",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 290px",
    gap: "20px",
    alignItems: "start",
  },
  floor: {
    position: "relative",
    minHeight: "760px",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(191, 219, 254, 0.24), transparent 24%), linear-gradient(180deg, #ffffff, #f8fbff)",
  },
  zoneLabel: {
    position: "absolute",
    zIndex: 3,
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid rgba(100, 116, 139, 0.16)",
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  mainZone: {
    position: "absolute",
    top: "12%",
    left: "4%",
    width: "54%",
    height: "54%",
    borderRadius: "28px",
    border: "1px solid rgba(100, 116, 139, 0.09)",
    background: "rgba(255, 255, 255, 0.48)",
  },
  patioZone: {
    position: "absolute",
    left: "8%",
    bottom: "8%",
    width: "52%",
    height: "18%",
    borderRadius: "28px",
    border: "1px dashed rgba(100, 116, 139, 0.18)",
    background: "rgba(239, 246, 255, 0.45)",
  },
  verticalAisle: {
    position: "absolute",
    top: "14%",
    left: "60%",
    width: "8%",
    height: "68%",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.85)",
    boxShadow: "inset 0 0 0 1px rgba(100, 116, 139, 0.08)",
  },
  horizontalAisle: {
    position: "absolute",
    left: "8%",
    top: "58%",
    width: "48%",
    height: "8%",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.85)",
    boxShadow: "inset 0 0 0 1px rgba(100, 116, 139, 0.08)",
  },
  barRail: {
    position: "absolute",
    top: "15%",
    right: "6%",
    width: "30%",
    height: "12%",
    borderRadius: "22px",
    border: "2px dashed rgba(100, 116, 139, 0.22)",
    background: "rgba(219, 234, 254, 0.46)",
  },
  details: {
    display: "grid",
    gap: "18px",
  },
  detailsTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "2rem",
  },
  detailsList: {
    display: "grid",
    gap: "12px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(100, 116, 139, 0.12)",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
  },
  detailValue: {
    color: "#0f172a",
    fontWeight: 700,
    textAlign: "right",
  },
  actions: {
    display: "grid",
    gap: "10px",
  },
};

function getTableStyle(table, active) {
  const meta = STATUS_META[table.status];
  const isTakeout = table.area === "Takeout";

  return {
    position: "absolute",
    left: table.x,
    top: table.y,
    zIndex: 2,
    width: isTakeout ? "110px" : table.area === "Bar" ? "74px" : "96px",
    minHeight: isTakeout ? "64px" : table.area === "Bar" ? "74px" : "96px",
    display: "grid",
    gap: "4px",
    placeItems: "center",
    padding: table.area === "Bar" ? "8px 6px" : "10px 8px",
    border: isTakeout ? "2px solid #f59e0b" : `2px solid ${meta.border}`,
    borderRadius: isTakeout ? "14px" : table.area === "Bar" ? "999px" : "18px",
    boxShadow: active
      ? "0 20px 40px rgba(15, 23, 42, 0.14)"
      : "0 16px 36px rgba(15, 23, 42, 0.08)",
    transform: active ? "translateY(-4px)" : "none",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    backgroundColor: isTakeout ? "#fef3c7" : meta.fill,
    color: isTakeout ? "#92400e" : meta.text,
    cursor: "pointer",
  };
}

function FloorTable({ table, active, onSelect }) {
  return (
    <button type="button" style={getTableStyle(table, active)} onClick={() => onSelect(table)}>
      <span style={{ fontSize: "1rem", fontWeight: 800 }}>{table.id}</span>
      <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>{table.seats} seats</span>
      <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>{STATUS_META[table.status].label}</span>
      <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>{table.time}</span>
    </button>
  );
}

function ActionButton({ children, background, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: "46px",
        border: 0,
        borderRadius: "14px",
        background,
        color: "#ffffff",
        fontSize: "0.95rem",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function normalizeTable(table) {
  const layout = TABLE_LAYOUT[table.tableNumber] ?? {
    id: `T${table.tableNumber}`,
    area: "Main",
    x: "10%",
    y: "10%",
  };

  return {
    tableId: table.tableId,
    tableNumber: table.tableNumber,
    id: layout.id,
    area: layout.area,
    x: layout.x,
    y: layout.y,
    seats: table.capacity ?? 0,
    status: STATUS_MAP[table.status] ?? "inactive",
    dbStatus: table.status,
    server: "Unassigned",
    time: table.status === "reserved" ? "Reserved" : "Live",
  };
}

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [guestModal, setGuestModal] = useState(null); // { tableNumber, maxSeats }
  const [guestInput, setGuestInput] = useState("");
  const [takeoutModal, setTakeoutModal] = useState(false);
  const [takeoutFirstName, setTakeoutFirstName] = useState("");
  const [takeoutLastName, setTakeoutLastName] = useState("");
  const [takeoutPhone, setTakeoutPhone] = useState("");

  useEffect(() => {
    if (!guestModal) return;

    function handleKey(e) {
      if (e.key >= "0" && e.key <= "9") {
        const d = e.key;
        setGuestInput((prev) => {
          const next = prev + d;
          return Number(next) <= guestModal.maxSeats ? next : prev;
        });
      } else if (e.key === "Backspace") {
        setGuestInput((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        const count = parseInt(guestInput, 10);
        if (count && count >= 1) {
          router.push(`/server-order?table=${guestModal.tableNumber}&guests=${count}`);
          setGuestModal(null);
        }
      } else if (e.key === "Escape") {
        setGuestModal(null);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [guestModal, guestInput, router]);

  useEffect(() => {
    let active = true;

    async function loadTables() {
      try {
        const rows = await fetchTables();
        const normalized = rows.map(normalizeTable);

        if (!active) {
          return;
        }

        setTables(normalized);
        setSelectedTableId((current) => current ?? normalized[0]?.tableId ?? null);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadTables();

    return () => {
      active = false;
    };
  }, []);

  const selectedTable =
    tables.find((table) => table.tableId === selectedTableId) ??
    tables[0] ??
    null;

  useEffect(() => {
    if (!selectedTable || selectedTable.status !== "occupied") {
      setActiveOrder(null);
      return;
    }

    let active = true;
    setIsLoadingOrder(true);

    fetchActiveOrderByTable(selectedTable.tableNumber)
      .then((order) => {
        if (!active) return;
        const merged = [];
        for (const item of order.items) {
          const existing = merged.find((c) => c.menuItemId === item.menuItemId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            merged.push({ ...item });
          }
        }
        setActiveOrder({ ...order, items: merged });
      })
      .catch(() => { if (active) setActiveOrder(null); })
      .finally(() => { if (active) setIsLoadingOrder(false); });

    return () => { active = false; };
  }, [selectedTable]);

  const summary = useMemo(
    () =>
      tables.reduce(
        (totals, table) => {
          totals[table.status] += 1;
          return totals;
        },
        { open: 0, occupied: 0, reserved: 0, inactive: 0 }
      ),
    [tables]
  );

  async function handleStatusChange(status) {
    if (!selectedTable) {
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await updateTableStatus(selectedTable.tableId, status);

      setTables((current) =>
        current.map((table) =>
          table.tableId === updated.tableId ? normalizeTable(updated) : table
        )
      );
      setError(null);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <section style={styles.page}>
        <div className="app-surface">Loading tables...</div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <div className="app-surface" style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Dining Room Live View</p>
          <h2 style={styles.title}>Floor Plan</h2>
          <p style={styles.subtext}>
            Tap a table to review its status and current seating state.
          </p>
        </div>

        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryNumber}>{summary.open}</strong>
            <span style={styles.summaryLabel}>Open</span>
          </div>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryNumber}>{summary.occupied}</strong>
            <span style={styles.summaryLabel}>Occupied</span>
          </div>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryNumber}>{summary.reserved}</strong>
            <span style={styles.summaryLabel}>Reserved</span>
          </div>
          <div style={styles.summaryCard}>
            <strong style={styles.summaryNumber}>{summary.inactive}</strong>
            <span style={styles.summaryLabel}>Inactive</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="app-surface" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div style={styles.grid} className="tables-grid">
        <div className="app-surface" style={styles.floor}>
          <span style={{ ...styles.zoneLabel, top: "22px", left: "22px" }}>Main Floor</span>
          <span style={{ ...styles.zoneLabel, top: "22px", right: "22px" }}>Bar</span>
          <span style={{ ...styles.zoneLabel, bottom: "18px", right: "22px" }}>Takeout</span>
          <div style={styles.mainZone} />
          <div style={styles.patioZone} />
          <div style={styles.verticalAisle} />
          <div style={styles.horizontalAisle} />
          <div style={styles.barRail} />

          {tables.map((table) => (
            <FloorTable
              key={table.tableId}
              table={table}
              active={selectedTable?.tableId === table.tableId}
              onSelect={(nextTable) => setSelectedTableId(nextTable.tableId)}
            />
          ))}
        </div>

        <aside className="app-surface" style={styles.details}>
          <p style={styles.eyebrow}>Selected Table</p>
          <h3 style={styles.detailsTitle}>{selectedTable?.id ?? "No Table"}</h3>

          {selectedTable ? (
            <>
              <div style={styles.detailsList}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Status</span>
                  <strong style={styles.detailValue}>{STATUS_META[selectedTable.status].label}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Section</span>
                  <strong style={styles.detailValue}>{selectedTable.area}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Table Number</span>
                  <strong style={styles.detailValue}>{selectedTable.tableNumber}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Seats</span>
                  <strong style={styles.detailValue}>{selectedTable.seats}</strong>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>State</span>
                  <strong style={styles.detailValue}>{selectedTable.time}</strong>
                </div>
              </div>

              {selectedTable.status === "occupied" && (
                <div>
                  <p style={{ ...styles.eyebrow, marginBottom: "10px" }}>Current Order</p>
                  {isLoadingOrder ? (
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading...</p>
                  ) : activeOrder ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      {activeOrder.items.length === 0 ? (
                        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No items yet.</p>
                      ) : (
                        activeOrder.items.map((item) => (
                          <div key={item.orderItemId} style={styles.detailRow}>
                            <span style={styles.detailLabel}>
                              {item.quantity}× {item.name}
                            </span>
                            <strong style={styles.detailValue}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </strong>
                          </div>
                        ))
                      )}
                      <div style={{ ...styles.detailRow, marginTop: "4px" }}>
                        <span style={styles.detailLabel}>Total</span>
                        <strong style={{ ...styles.detailValue, color: "#1d4ed8" }}>
                          ${Number(activeOrder.total).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No active order found.</p>
                  )}
                </div>
              )}

              <div style={styles.actions}>
                <ActionButton
                  background="#1d4ed8"
                  onClick={() => {
                    if (activeOrder) {
                      router.push(`/server-order?table=${selectedTable.tableNumber}`);
                    } else if (selectedTable.tableNumber === TAKEOUT_TABLE_NUMBER) {
                      setTakeoutFirstName("");
                      setTakeoutLastName("");
                      setTakeoutPhone("");
                      setTakeoutModal(true);
                    } else {
                      setGuestInput("");
                      setGuestModal({ tableNumber: selectedTable.tableNumber, maxSeats: selectedTable.seats });
                    }
                  }}
                >
                  {activeOrder ? "Resume Order" : "Start Order"}
                </ActionButton>
                {activeOrder && (
                  <ActionButton
                    background="#7c3aed"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "currentOrder",
                          JSON.stringify({
                            orderId: activeOrder.orderId,
                            tableNumber: selectedTable.tableNumber,
                            cart: activeOrder.items.map((item) => ({
                              id: item.menuItemId,
                              name: item.name,
                              price: Number(item.price),
                              quantity: item.quantity,
                            })),
                          })
                        );
                      }
                      router.push("/checkout");
                    }}
                  >
                    Checkout Table {selectedTable.id}
                  </ActionButton>
                )}
                {selectedTable.tableNumber !== TAKEOUT_TABLE_NUMBER && (
                  <>
                    <ActionButton
                      background="#0f766e"
                      onClick={() => handleStatusChange("reserved")}
                      disabled={isUpdating}
                    >
                      Mark Reserved
                    </ActionButton>
                    <ActionButton
                      background="#475569"
                      onClick={() => handleStatusChange("available")}
                      disabled={isUpdating}
                    >
                      Mark Clean
                    </ActionButton>
                  </>
                )}
              </div>
            </>
          ) : (
            <div>No tables found.</div>
          )}
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          .tables-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {takeoutModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setTakeoutModal(false)}
        >
          <div className="ci-card" style={{ width: "360px" }} onClick={(e) => e.stopPropagation()}>
            <p className="ci-sub" style={{ fontSize: "1rem", fontWeight: 700, color: "#4a6484" }}>
              Takeout Customer Info
            </p>
            <p className="ci-sub">Enter name and phone number for this order.</p>

            <div style={{ display: "grid", gap: "10px", width: "100%" }}>
              <input
                type="text"
                placeholder="First Name"
                value={takeoutFirstName}
                onChange={(e) => setTakeoutFirstName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #c8d8e8",
                  fontSize: "15px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={takeoutLastName}
                onChange={(e) => setTakeoutLastName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #c8d8e8",
                  fontSize: "15px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={takeoutPhone}
                onChange={(e) => setTakeoutPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #c8d8e8",
                  fontSize: "15px",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              disabled={!takeoutFirstName.trim() || !takeoutLastName.trim() || takeoutPhone.length < 10}
              onClick={() => {
                router.push(
                  `/server-order?table=${TAKEOUT_TABLE_NUMBER}&takeoutName=${encodeURIComponent(takeoutFirstName.trim() + " " + takeoutLastName.trim())}&takeoutPhone=${encodeURIComponent(takeoutPhone)}`
                );
                setTakeoutModal(false);
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "12px",
                backgroundColor: "#1d4ed8",
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                opacity: !takeoutFirstName.trim() || !takeoutLastName.trim() || takeoutPhone.length < 10 ? 0.5 : 1,
              }}
            >
              Continue to Order
            </button>

            <button
              onClick={() => setTakeoutModal(false)}
              style={{ width: "100%", padding: "10px", border: "1.5px solid #c8d8e8", borderRadius: "12px", backgroundColor: "white", color: "#c0392b", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {guestModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setGuestModal(null)}
        >
          <div className="ci-card" onClick={(e) => e.stopPropagation()}>
            <p className="ci-sub" style={{ fontSize: "1rem", fontWeight: 700, color: "#4a6484" }}>
              How many guests?
            </p>
            <p className="ci-sub">
              Max {guestModal.maxSeats} seat{guestModal.maxSeats !== 1 ? "s" : ""}
            </p>

            <div className="ci-dots">
              {guestInput
                ? guestInput.split("").map((_, i) => (
                    <div key={i} className="ci-dot ci-dot--filled" />
                  ))
                : <div className="ci-dot" />}
            </div>

            <div className="ci-grid">
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <button
                  key={d}
                  className="ci-btn"
                  onClick={() =>
                    setGuestInput((prev) => {
                      const next = prev + d;
                      return Number(next) <= guestModal.maxSeats ? next : prev;
                    })
                  }
                >
                  {d}
                </button>
              ))}
              <button
                className="ci-btn ci-btn--ghost"
                onClick={() => setGuestInput((prev) => prev.slice(0, -1))}
              >
                ⌫
              </button>
              <button
                className="ci-btn"
                onClick={() =>
                  setGuestInput((prev) => {
                    const next = prev + "0";
                    return Number(next) <= guestModal.maxSeats ? next : prev;
                  })
                }
              >
                0
              </button>
              <button
                className="ci-btn ci-btn--enter"
                disabled={!guestInput || parseInt(guestInput, 10) < 1}
                onClick={() => {
                  const count = parseInt(guestInput, 10);
                  if (!count || count < 1) return;
                  router.push(`/server-order?table=${guestModal.tableNumber}&guests=${count}`);
                  setGuestModal(null);
                }}
              >
                ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
