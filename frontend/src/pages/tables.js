import Image from "next/image";

const mainTables = [
  { id: "T1", x: "10%", y: "18%", seats: 4, status: "open", time: "15m" },
  { id: "T2", x: "24%", y: "18%", seats: 4, status: "occupied" },
  { id: "T3", x: "38%", y: "18%", seats: 2, status: "reserved" },
  { id: "T4", x: "12%", y: "41%", seats: 6, status: "open", time: "06m" },
  { id: "T5", x: "29%", y: "40%", seats: 4, status: "occupied" },
  { id: "T6", x: "44%", y: "41%", seats: 4, status: "open", time: "21m" },
  { id: "T7", x: "16%", y: "66%", seats: 2, status: "reserved" },
  { id: "T8", x: "34%", y: "66%", seats: 4, status: "occupied" },
  { id: "T9", x: "50%", y: "66%", seats: 6, status: "open", time: "09m" },
  { id: "T10", x: "63%", y: "29%", seats: 4, status: "occupied" },
  { id: "T11", x: "63%", y: "54%", seats: 2, status: "open", time: "12m" },
  { id: "T12", x: "70%", y: "76%", seats: 4, status: "reserved" },
];

const barTops = [
  { id: "1", x: "61%", y: "15%", status: "reserved" },
  { id: "2", x: "68%", y: "15%", status: "open", time: "12m" },
  { id: "3", x: "75%", y: "15%", status: "occupied" },
  { id: "4", x: "82%", y: "15%", status: "open", time: "04m" },
  { id: "5", x: "89%", y: "15%", status: "occupied" },
];

const statusMeta = {
  open: {
    label: "Open",
    fill: "#daf7df",
    accent: "#2e9f57",
    text: "#166534",
  },
  occupied: {
    label: "Occupied",
    fill: "#e9edf2",
    accent: "#8e99a8",
    text: "#475569",
  },
  reserved: {
    label: "Reserved",
    fill: "#dceaff",
    accent: "#5b87d6",
    text: "#2853a6",
  },
};

function SidebarIcon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "login") {
    return (
      <svg {...common}>
        <path d="M15 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    );
  }

  if (type === "order") {
    return (
      <svg {...common}>
        <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7 18c-1.7 0-3-1.3-3-3V7.5A2.5 2.5 0 0 1 6.5 5H9" />
      <path d="M17 18c1.7 0 3-1.3 3-3V7.5A2.5 2.5 0 0 0 17.5 5H15" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function MainTable({ table }) {
  const meta = statusMeta[table.status];

  return (
    <button
      className="floor-table main-table"
      style={{ left: table.x, top: table.y, background: meta.fill, borderColor: meta.accent, color: meta.text }}
      type="button"
    >
      <span className="table-id">{table.id}</span>
      <span className="table-seats">{table.seats} seats</span>
      <div className="table-footer">
        <span className="table-state">{meta.label}</span>
        {table.time ? <span className="table-timer">{table.time}</span> : null}
      </div>
    </button>
  );
}

function BarTop({ table }) {
  const meta = statusMeta[table.status];

  return (
    <button
      className="floor-table bar-top"
      style={{ left: table.x, top: table.y, background: meta.fill, borderColor: meta.accent, color: meta.text }}
      type="button"
      aria-label={`Bar top ${table.id} ${meta.label}`}
    >
      <span className="bar-top-id">{table.id}</span>
    </button>
  );
}

export default function TablesPage() {
  return (
    <>
      <main className="tables-screen">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">
              <Image src="/lumii.png" alt="Lumi" width={84} height={84} priority />
            </div>
            <div>
              <p className="eyebrow">Lumi POS</p>
              <h1>Tables</h1>
            </div>
          </div>

          <nav className="nav-menu" aria-label="Primary">
            <button className="nav-item" type="button">
              <SidebarIcon type="login" />
              <span>Login</span>
            </button>
            <button className="nav-item active" type="button">
              <SidebarIcon type="order" />
              <span>Order</span>
            </button>
            <button className="nav-item" type="button">
              <SidebarIcon type="togo" />
              <span>To-Go</span>
            </button>
          </nav>
        </aside>

        <section className="content-area">
          <header className="content-header">
            <div>
              <p className="eyebrow">Dining Room Live View</p>
              <h2>Floor Plan</h2>
            </div>

            <div className="summary-row">
              <div className="summary-card">
                <strong>7</strong>
                <span>Open</span>
              </div>
              <div className="summary-card">
                <strong>6</strong>
                <span>Occupied</span>
              </div>
              <div className="summary-card">
                <strong>4</strong>
                <span>Reserved</span>
              </div>
            </div>
          </header>

          <div className="floor-shell">
            <div className="zone-label zone-main">Main Tables</div>
            <div className="zone-label zone-bar">Bar Tops</div>
            <div className="room-accent booths-left" />
            <div className="room-accent booths-bottom" />
            <div className="aisle aisle-vertical" />
            <div className="aisle aisle-horizontal" />
            <div className="bar-rail" />

            {mainTables.map((table) => (
              <MainTable key={table.id} table={table} />
            ))}

            {barTops.map((table) => (
              <BarTop key={table.id} table={table} />
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          background: #ffffff;
        }

        .tables-screen {
          --lumi-navy: #587392;
          --lumi-sky: #b9cae6;
          --lumi-ink: #334155;
          --panel: #f7f9fc;
          --line: #d8e0ea;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 124px minmax(0, 1fr);
          background:
            radial-gradient(circle at top left, rgba(185, 202, 230, 0.18), transparent 24%),
            linear-gradient(180deg, #ffffff, #f8fbff 72%);
          color: var(--lumi-ink);
          font-family: "Avenir Next", "Segoe UI", sans-serif;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 22px 14px;
          border-right: 1px solid rgba(88, 115, 146, 0.12);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
        }

        .brand-block {
          display: grid;
          gap: 10px;
          justify-items: center;
          text-align: center;
        }

        .brand-mark {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #ffffff, #eef4fb);
          box-shadow: 0 12px 24px rgba(88, 115, 146, 0.12);
          overflow: hidden;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b819b;
        }

        .brand-block h1,
        .content-header h2 {
          margin: 4px 0 0;
          font-size: 1.5rem;
          line-height: 1;
          color: #3f5a78;
        }

        .nav-menu {
          display: grid;
          gap: 10px;
        }

        .nav-item {
          display: grid;
          justify-items: center;
          gap: 7px;
          padding: 14px 8px;
          border: 1px solid transparent;
          border-radius: 20px;
          background: transparent;
          color: #617892;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .nav-item:hover,
        .nav-item.active {
          background: linear-gradient(180deg, #edf3fb, #e4edf8);
          color: #3f5a78;
          border-color: rgba(88, 115, 146, 0.12);
          box-shadow: 0 10px 22px rgba(88, 115, 146, 0.1);
        }

        .content-area {
          padding: 28px 28px 24px;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 20px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 16px;
        }

        .summary-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .summary-card {
          min-width: 90px;
          padding: 12px 16px;
          border-radius: 20px;
          background: linear-gradient(180deg, #ffffff, #f4f8fd);
          border: 1px solid rgba(88, 115, 146, 0.12);
          box-shadow: 0 12px 22px rgba(88, 115, 146, 0.08);
          text-align: center;
        }

        .summary-card strong {
          display: block;
          font-size: 1.3rem;
          color: #3f5a78;
        }

        .summary-card span {
          font-size: 0.78rem;
          font-weight: 700;
          color: #6a819a;
        }

        .floor-shell {
          position: relative;
          min-height: 760px;
          border-radius: 34px;
          background:
            radial-gradient(circle at 16% 16%, rgba(185, 202, 230, 0.12), transparent 14%),
            radial-gradient(circle at 75% 78%, rgba(185, 202, 230, 0.1), transparent 18%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 253, 0.98)),
            repeating-linear-gradient(0deg, transparent, transparent 41px, rgba(216, 224, 234, 0.35) 41px, rgba(216, 224, 234, 0.35) 42px),
            repeating-linear-gradient(90deg, transparent, transparent 41px, rgba(216, 224, 234, 0.35) 41px, rgba(216, 224, 234, 0.35) 42px);
          border: 1px solid rgba(88, 115, 146, 0.12);
          box-shadow: 0 24px 48px rgba(88, 115, 146, 0.12);
          overflow: hidden;
        }

        .room-accent,
        .aisle {
          position: absolute;
          pointer-events: none;
        }

        .booths-left {
          top: 14%;
          left: 4%;
          width: 48%;
          height: 64%;
          border-radius: 28px;
          border: 1px solid rgba(88, 115, 146, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(236, 242, 249, 0.28));
        }

        .booths-bottom {
          left: 8%;
          bottom: 8%;
          width: 70%;
          height: 16%;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(232, 239, 248, 0.32), rgba(255, 255, 255, 0.12));
          border: 1px dashed rgba(88, 115, 146, 0.12);
        }

        .aisle-vertical {
          top: 12%;
          left: 57%;
          width: 8%;
          height: 72%;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: inset 0 0 0 1px rgba(88, 115, 146, 0.06);
        }

        .aisle-horizontal {
          left: 8%;
          top: 56%;
          width: 48%;
          height: 9%;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: inset 0 0 0 1px rgba(88, 115, 146, 0.06);
        }

        .zone-label {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6d8198;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(88, 115, 146, 0.12);
        }

        .zone-main {
          top: 22px;
          left: 28px;
          padding: 10px 16px;
        }

        .zone-bar {
          top: 22px;
          right: 28px;
          padding: 10px 16px;
        }

        .bar-rail {
          position: absolute;
          top: 12.5%;
          right: 7%;
          width: 34%;
          height: 10%;
          border-radius: 24px;
          border: 2px dashed rgba(88, 115, 146, 0.25);
          background: linear-gradient(180deg, rgba(233, 240, 250, 0.72), rgba(255, 255, 255, 0.48));
        }

        .floor-table {
          position: absolute;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          border: 2px solid #587392;
          box-shadow: 0 16px 30px rgba(88, 115, 146, 0.12);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .floor-table:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 34px rgba(88, 115, 146, 0.16);
        }

        .main-table {
          width: 94px;
          height: 94px;
          padding: 10px 8px;
          border-radius: 18px;
          align-items: center;
          text-align: center;
          z-index: 2;
        }

        .bar-top {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          align-items: center;
          text-align: center;
          padding: 0;
          z-index: 2;
        }

        .table-id {
          font-size: 0.98rem;
          font-weight: 800;
          line-height: 1;
        }

        .table-seats,
        .table-state,
        .table-timer {
          font-size: 0.66rem;
          font-weight: 700;
        }

        .table-footer {
          margin-top: auto;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        .table-timer {
          padding: 3px 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
        }

        .bar-top-id {
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1;
        }

        @media (max-width: 1100px) {
          .tables-screen {
            grid-template-columns: 1fr;
          }

          .sidebar {
            border-right: 0;
            border-bottom: 1px solid rgba(88, 115, 146, 0.12);
          }

          .brand-block {
            grid-template-columns: auto 1fr;
            justify-items: start;
            align-items: center;
            text-align: left;
          }

          .nav-menu {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .content-area {
            padding: 20px 14px 16px;
          }

          .content-header {
            flex-direction: column;
            align-items: stretch;
          }

          .floor-shell {
            min-height: 980px;
            overflow-x: auto;
          }

          .main-table {
            width: 82px;
            height: 82px;
          }

          .bar-rail {
            right: 5%;
            width: 40%;
          }

          .aisle-vertical {
            left: 56%;
          }
        }
      `}</style>
    </>
  );
}