import { useEffect, useMemo, useState } from "react";

function createTicket(id, station, table, items, minutesAgo) {
  return {
    id,
    station,
    table,
    items,
    createdAt: Date.now() - minutesAgo * 60 * 1000,
  };
}

function getTicketState(ticket, now) {
  const ageMinutes = (now - ticket.createdAt) / 60000;

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
  const [tickets, setTickets] = useState([
    createTicket(1001, "Grill", "12", ["Pancake Stack", "Crispy Bacon"], 4),
    createTicket(1002, "Saute", "4", ["Breakfast Burrito", "Hash Browns"], 11),
    createTicket(1003, "Cold Line", "15", ["Avocado Toast", "Fruit Cup"], 17),
    createTicket(1004, "Grill", "9", ["Eggs Benedict", "Sausage Links"], 22),
    createTicket(1005, "Window", "2", ["French Toast", "Scrambled Eggs"], 7),
    createTicket(1006, "Saute", "10", ["Belgian Waffle", "Turkey Sausage"], 3),
  ]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    return tickets.reduce(
      (totals, ticket) => {
        const state = getTicketState(ticket, now);
        totals[state] += 1;
        return totals;
      },
      { green: 0, yellow: 0, red: 0 }
    );
  }, [now, tickets]);

  function markReady(id) {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  }

  return (
    <section className="expo-screen">
      <header className="expo-header">
        <div>
          <p className="expo-header__eyebrow">Kitchen Production Board</p>
          <h2 className="expo-header__title">Kitchen</h2>
          <p className="expo-header__subtext">Track active tickets by station, watch aging orders, and clear plates once they hit the window.</p>
        </div>

        <div className="expo-legend">
          <span className="expo-pill expo-pill--green">On Pace</span>
          <span className="expo-pill expo-pill--yellow">Watch</span>
          <span className="expo-pill expo-pill--red">Rush</span>
        </div>
      </header>

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
          const ageMinutes = Math.floor((now - ticket.createdAt) / 60000);
          const state = getTicketState(ticket, now);

          return (
            <article key={ticket.id} className={`expo-ticket expo-ticket--${state}`}>
              <div className="expo-ticket__top">
                <div>
                  <p className="expo-ticket__source">{ticket.station}</p>
                  <h3 className="expo-ticket__id">Table {ticket.table}</h3>
                </div>

                <div className={`expo-ticket__timer expo-ticket__timer--${state}`}>{ageMinutes}m</div>
              </div>

              <div className="expo-ticket__meta">
                <span>Ticket #{ticket.id}</span>
                <span>{ticket.items.length} items</span>
              </div>

              <ul className="expo-ticket__items">
                {ticket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <button className="expo-ticket__button" type="button" onClick={() => markReady(ticket.id)}>
                Mark Ready
              </button>
            </article>
          );
        })}
      </section>
    </section>
  );
}
