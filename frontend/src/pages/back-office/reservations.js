import { useEffect, useState } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { fetchReservations, confirmReservation, cancelReservation } from "../../lib/api";

const STATUS_LABELS = {
  requested: { label: "Requested", color: "#d97706", bg: "#fef3c7" },
  confirmed: { label: "Confirmed", color: "#16a34a", bg: "#dcfce7" },
  seated: { label: "Seated", color: "#2563eb", bg: "#dbeafe" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6" },
};

const TIME_LABELS = {
  "07:00": "7:00 AM", "07:30": "7:30 AM",
  "08:00": "8:00 AM", "08:30": "8:30 AM",
  "09:00": "9:00 AM", "09:30": "9:30 AM",
  "10:00": "10:00 AM", "10:30": "10:30 AM",
  "11:00": "11:00 AM", "11:30": "11:30 AM",
  "12:00": "12:00 PM", "12:30": "12:30 PM",
  "13:00": "1:00 PM", "13:30": "1:30 PM",
  "14:00": "2:00 PM",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(timeStr) {
  return TIME_LABELS[timeStr] ?? timeStr;
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: "700",
      color: s.color,
      backgroundColor: s.bg,
    }}>
      {s.label}
    </span>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("requested");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchReservations({ status: statusFilter, date: dateFilter || undefined });
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reservations.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter, dateFilter]);

  async function handleConfirm(reservationId) {
    setActionError("");
    setPendingId(reservationId);
    try {
      await confirmReservation(reservationId);
      await load();
    } catch (err) {
      setActionError(err.message || "Failed to confirm reservation.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(reservationId) {
    setActionError("");
    setPendingId(reservationId);
    try {
      await cancelReservation(reservationId);
      await load();
    } catch (err) {
      setActionError(err.message || "Failed to cancel reservation.");
    } finally {
      setPendingId(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <BackOfficeShell
      title="Reservations"
      description="Review and manage customer reservation requests."
    >
      <ReportSection title="Filters">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="lumi-report-select"
            >
              <option value="all">All</option>
              <option value="requested">Requested</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              min={today}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(148,163,184,0.4)",
                fontSize: "14px",
                color: "#111827",
                backgroundColor: "white",
              }}
            />
          </div>
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,116,139,0.3)",
                backgroundColor: "white",
                fontSize: "13px",
                fontWeight: "700",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Clear Date
            </button>
          )}
        </div>
      </ReportSection>

      {actionError && (
        <div style={{
          margin: "0 0 16px",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          fontSize: "13px",
          fontWeight: "700",
        }}>
          {actionError}
        </div>
      )}

      <ReportSection title={`Reservations${reservations.length > 0 ? ` (${reservations.length})` : ""}`}>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : reservations.length === 0 ? (
          <p className="text-sm text-gray-600">No reservations match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  {["Date", "Time", "Guest", "Party", "Phone", "Occasion", "Notes", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.reservationId} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatTime(r.time)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-900 whitespace-nowrap">
                      {r.firstName} {r.lastName}
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{r.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-700">
                      {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-700">{r.phone || "—"}</td>
                    <td className="py-3 pr-4 text-sm text-gray-700">{r.occasion || "—"}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500" style={{ maxWidth: "180px" }}>
                      {r.notes || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <div style={{ display: "flex", gap: "8px" }}>
                        {r.status === "requested" && (
                          <button
                            type="button"
                            disabled={pendingId === r.reservationId}
                            onClick={() => handleConfirm(r.reservationId)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: pendingId === r.reservationId ? "#86efac" : "#16a34a",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: pendingId === r.reservationId ? "not-allowed" : "pointer",
                            }}
                          >
                            Confirm
                          </button>
                        )}
                        {(r.status === "requested" || r.status === "confirmed") && (
                          <button
                            type="button"
                            disabled={pendingId === r.reservationId}
                            onClick={() => handleCancel(r.reservationId)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "1px solid #fca5a5",
                              backgroundColor: "white",
                              color: "#dc2626",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: pendingId === r.reservationId ? "not-allowed" : "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
    </BackOfficeShell>
  );
}
