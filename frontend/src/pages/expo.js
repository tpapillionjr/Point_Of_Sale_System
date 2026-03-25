import { useEffect, useState } from "react";

function createTicket(id, table, items, minutesAgo) {
  return {
    id,
    table,
    items,
    createdAt: Date.now() - minutesAgo * 60 * 1000,
    status: "active",
  };
}

function getTicketColor(ticket, now) {
  if (ticket.status !== "active") return "#94a3b8";

  const ageMinutes = (now - ticket.createdAt) / 60000;
  if (ageMinutes >= 23) return "#dc2626";
  if (ageMinutes >= 15) return "#eab308";
  return "#16a34a";
}

export default function ExpoPage() {
  const [now, setNow] = useState(() => Date.now());
  const [tickets, setTickets] = useState([
    createTicket(1001, "12", ["Pancake Stack", "Crispy Bacon"], 4),
    createTicket(1002, "4", ["Breakfast Burrito", "Hash Browns"], 11),
    createTicket(1003, "15", ["Avocado Toast", "Fruit Cup"], 17),
    createTicket(1004, "9", ["Eggs Benedict", "Sausage Links"], 25),
    createTicket(1005, "2", ["French Toast", "Scrambled Eggs"], 7),
    createTicket(1006, "10", ["Belgian Waffle", "Turkey Sausage"], 3),
    createTicket(1007, "6", ["Omelet", "Toast"], 14),
    createTicket(1008, "1", ["Chicken and Waffles"], 20),
  ]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function markDone(id) {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  }

  return (
    <>
      <main className="expo-pos-page">
        <section className="expo-grid" aria-label="Breakfast tickets">
          {tickets.map((ticket) => {
            const ageMinutes = Math.floor((now - ticket.createdAt) / 60000);
            const borderColor = getTicketColor(ticket, now);

            return (
              <article key={ticket.id} className="expo-ticket" style={{ borderColor }}>
                <div className="expo-ticket-top">
                  <strong>Table {ticket.table}</strong>
                  <span className="expo-ticket-age">{ageMinutes}m</span>
                </div>

                <ul className="expo-ticket-items">
                  {ticket.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                {ticket.status === "active" && (
                  <div className="expo-actions">
                    <button onClick={() => markDone(ticket.id)}>Done</button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      <style jsx>{`
        .expo-pos-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
          padding: 8px 10px 16px;
          font-family: "Avenir Next", "Segoe UI", sans-serif;
        }

        .expo-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          align-items: start;
        }

        .expo-ticket {
          border: 3px solid #16a34a;
          border-radius: 16px;
          background: #ffffff;
          padding: 8px;
          min-height: 138px;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        }

        .expo-ticket-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .expo-ticket-top strong {
          font-size: 0.88rem;
        }

        .expo-ticket-age {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
        }

        .expo-ticket-items {
          margin: 0;
          padding-left: 14px;
          font-size: 0.74rem;
        }

        .expo-ticket-items li + li {
          margin-top: 3px;
        }

        .expo-actions {
          display: flex;
          margin-top: 8px;
        }

        .expo-actions button {
          width: 100%;
          height: 24px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.66rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        @media (max-width: 1280px) {
          .expo-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        @media (max-width: 960px) {
          .expo-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .expo-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 420px) {
          .expo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
