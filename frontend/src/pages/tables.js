import { useMemo, useState } from "react";

const TABLES = [
  { id: "T1", area: "Main", x: "11%", y: "18%", seats: 4, status: "open", server: "Maya", time: "15m" },
  { id: "T2", area: "Main", x: "25%", y: "18%", seats: 4, status: "occupied", server: "Jordan", time: "42m" },
  { id: "T3", area: "Main", x: "39%", y: "18%", seats: 2, status: "reserved", server: "Avery", time: "7:30 PM" },
  { id: "T4", area: "Main", x: "13%", y: "41%", seats: 6, status: "open", server: "Maya", time: "06m" },
  { id: "T5", area: "Main", x: "29%", y: "40%", seats: 4, status: "occupied", server: "Jordan", time: "18m" },
  { id: "T6", area: "Main", x: "45%", y: "41%", seats: 4, status: "open", server: "Chris", time: "21m" },
  { id: "T7", area: "Patio", x: "17%", y: "67%", seats: 2, status: "reserved", server: "Avery", time: "8:00 PM" },
  { id: "T8", area: "Patio", x: "35%", y: "67%", seats: 4, status: "occupied", server: "Chris", time: "26m" },
  { id: "T9", area: "Patio", x: "51%", y: "67%", seats: 6, status: "open", server: "Maya", time: "09m" },
  { id: "B1", area: "Bar", x: "66%", y: "21%", seats: 2, status: "reserved", server: "Sam", time: "7:45 PM" },
  { id: "B2", area: "Bar", x: "74%", y: "21%", seats: 2, status: "open", server: "Sam", time: "12m" },
  { id: "B3", area: "Bar", x: "82%", y: "21%", seats: 2, status: "occupied", server: "Sam", time: "33m" },
  { id: "B4", area: "Bar", x: "90%", y: "21%", seats: 2, status: "open", server: "Sam", time: "04m" },
];

const STATUS_META = {
  open: { label: "Open", fill: "#dcfce7", border: "#22c55e", text: "#166534" },
  occupied: { label: "Occupied", fill: "#e2e8f0", border: "#64748b", text: "#334155" },
  reserved: { label: "Reserved", fill: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },
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
    gridTemplateColumns: "repeat(3, minmax(110px, 1fr))",
    gap: "12px",
    width: "min(100%, 420px)",
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

  return {
    position: "absolute",
    left: table.x,
    top: table.y,
    zIndex: 2,
    width: table.area === "Bar" ? "74px" : "96px",
    minHeight: table.area === "Bar" ? "74px" : "96px",
    display: "grid",
    gap: "4px",
    placeItems: "center",
    padding: table.area === "Bar" ? "8px 6px" : "10px 8px",
    border: `2px solid ${meta.border}`,
    borderRadius: table.area === "Bar" ? "999px" : "18px",
    boxShadow: active
      ? "0 20px 40px rgba(15, 23, 42, 0.14)"
      : "0 16px 36px rgba(15, 23, 42, 0.08)",
    transform: active ? "translateY(-4px)" : "none",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    backgroundColor: meta.fill,
    color: meta.text,
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

function ActionButton({ children, background }) {
  return (
    <button
      type="button"
      style={{
        minHeight: "46px",
        border: 0,
        borderRadius: "14px",
        background,
        color: "#ffffff",
        fontSize: "0.95rem",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);

  const summary = useMemo(
    () =>
      TABLES.reduce(
        (totals, table) => {
          totals[table.status] += 1;
          return totals;
        },
        { open: 0, occupied: 0, reserved: 0 }
      ),
    []
  );

  return (
    <section style={styles.page}>
      <div className="app-surface" style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Dining Room Live View</p>
          <h2 style={styles.title}>Floor Plan</h2>
          <p style={styles.subtext}>
            Tap a table to review its status, section, and current server assignment.
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
        </div>
      </div>

      <div style={styles.grid} className="tables-grid">
        <div className="app-surface" style={styles.floor}>
          <span style={{ ...styles.zoneLabel, top: "22px", left: "22px" }}>Main Floor</span>
          <span style={{ ...styles.zoneLabel, top: "22px", right: "22px" }}>Bar</span>
          <div style={styles.mainZone} />
          <div style={styles.patioZone} />
          <div style={styles.verticalAisle} />
          <div style={styles.horizontalAisle} />
          <div style={styles.barRail} />

          {TABLES.map((table) => (
            <FloorTable
              key={table.id}
              table={table}
              active={selectedTable.id === table.id}
              onSelect={setSelectedTable}
            />
          ))}
        </div>

        <aside className="app-surface" style={styles.details}>
          <p style={styles.eyebrow}>Selected Table</p>
          <h3 style={styles.detailsTitle}>{selectedTable.id}</h3>

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
              <span style={styles.detailLabel}>Server</span>
              <strong style={styles.detailValue}>{selectedTable.server}</strong>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Seats</span>
              <strong style={styles.detailValue}>{selectedTable.seats}</strong>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Timer / Reservation</span>
              <strong style={styles.detailValue}>{selectedTable.time}</strong>
            </div>
          </div>

          <div style={styles.actions}>
            <ActionButton background="#1d4ed8">Start Order</ActionButton>
            <ActionButton background="#0f766e">Move Guests</ActionButton>
            <ActionButton background="#475569">Mark Clean</ActionButton>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          .tables-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
