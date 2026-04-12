import { useEffect, useMemo, useState, startTransition } from "react";
import { fetchKitchenTickets, updateKitchenTicket } from "../lib/api";

function getTicketState(ticket, now) {
  const baseAgeSeconds = Number(ticket.ageSeconds ?? 0);
  const fetchedAt = Number(ticket.fetchedAt ?? now);
  const ageMinutes = Math.max(0, (baseAgeSeconds + ((now - fetchedAt) / 1000)) / 60);

  if (ageMinutes >= 18) {
    return "red";
  }

  if (ageMinutes >= 10) {
    return "yellow";
  }

  return "green";
}

export default function KitchenPage() {
  const [now, setNow] = useState(() => Date.now());
  const [tickets, setTickets] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedEmployee = localStorage.getItem("currentEmployee");
    if (storedEmployee) {
      startTransition(() => setEmployee(JSON.parse(storedEmployee)));
    }

    async function loadTickets() {
      try {
        const rows = await fetchKitchenTickets();
        const fetchedAt = Date.now();
        setTickets(rows.map((ticket) => ({ ...ticket, fetchedAt })));
        setMessage(null);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadTickets();
    const interval = setInterval(loadTickets, 15000);
    return () => clearInterval(interval);
  }, []);

  const summary = useMemo(
    () =>
      tickets.reduce(
        (totals, ticket) => {
          const state = getTicketState(ticket, now);
          totals[state] += 1;
          return totals;
        },
        { green: 0, yellow: 0, red: 0 }
      ),
    [now, tickets]
  );

  async function updateTicket(ticketId, status) {
    if (!employee?.userId) {
      setMessage("Kitchen login required.");
      return;
    }

    try {
      await updateKitchenTicket(ticketId, {
        userId: employee.userId,
        status,
      });
      setTickets((current) =>
        current
          .filter((ticket) => !(ticket.ticketId === ticketId && status === "done"))
          .map((ticket) => ticket.ticketId === ticketId ? { ...ticket, status } : ticket)
      );
      setMessage(null);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="expo-screen">
      <header className="expo-header">
        <div>
          <p className="expo-header__eyebrow">Kitchen Production Board</p>
          <h2 className="expo-header__title">Kitchen</h2>
          <p className="expo-header__subtext">
            Track live backend tickets, watch aging orders, and only let kitchen staff close them.
          </p>
        </div>

        <div className="expo-legend">
          <span className="expo-pill expo-pill--green">On Pace</span>
          <span className="expo-pill expo-pill--yellow">Watch</span>
          <span className="expo-pill expo-pill--red">Rush</span>
        </div>
      </header>

      {message && <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: "16px" }}>{message}</div>}

      <section className="expo-summary">
        <div className="expo-summary__card">
          <span className="expo-summary__label">Active Tickets</span>
          <strong className="expo-summary__value">{tickets.length}</strong>
        </div>
        <div className="expo-summary__card">
          <span className="expo-summary__label">On Pace</span>
          <strong className="expo-summary__value">{summary.green}</strong>
        </div>
        <div className="expo-summary__card">
          <span className="expo-summary__label">Watch</span>
          <strong className="expo-summary__value">{summary.yellow}</strong>
        </div>
        <div className="expo-summary__card">
          <span className="expo-summary__label">Rush</span>
          <strong className="expo-summary__value">{summary.red}</strong>
        </div>
      </section>

      <section className="expo-grid" aria-label="Kitchen tickets">
        {tickets.map((ticket) => {
          const baseAgeSeconds = Number(ticket.ageSeconds ?? 0);
          const fetchedAt = Number(ticket.fetchedAt ?? now);
          const ageMinutes = Math.max(0, Math.floor((baseAgeSeconds + ((now - fetchedAt) / 1000)) / 60));
          const state = getTicketState(ticket, now);

          return (
            <article key={ticket.ticketId} className={`expo-ticket expo-ticket--${state}`}>
              <div className="expo-ticket__top">
                <div>
                  <p className="expo-ticket__source">{ticket.status.replace("_", " ")}</p>
                  <h3 className="expo-ticket__id">
                    {String(ticket.tableNumber) === "10000"
                      ? `TAKEOUT${ticket.takeoutName ? ` — ${ticket.takeoutName}` : ""}`
                      : ticket.tableNumber === "Online"
                      ? "Online Order"
                      : `Table ${ticket.tableNumber}`}
                  </h3>
                </div>

                <div className={`expo-ticket__timer expo-ticket__timer--${state}`}>{ageMinutes}m</div>
              </div>

              <div className="expo-ticket__meta">
                <span>Ticket #{ticket.ticketId}</span>
                <span>{ticket.items.length} items</span>
              </div>

              <ul className="expo-ticket__items">
                {ticket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div style={{ display: "grid", gap: "8px" }}>
                {ticket.status === "new" && (
                  <button className="expo-ticket__button" type="button" onClick={() => updateTicket(ticket.ticketId, "in_progress")}>
                    Mark In Progress
                  </button>
                )}
                <button className="expo-ticket__button" type="button" onClick={() => updateTicket(ticket.ticketId, "done")}>
                  Mark Ready
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
