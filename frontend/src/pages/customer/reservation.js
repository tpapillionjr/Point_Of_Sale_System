import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createCustomerReservation } from "../../lib/api";
import CustomerNav from "../../components/CustomerNav";

const TIME_SLOTS = [
  ["07:00", "7:00 AM"],
  ["07:30", "7:30 AM"],
  ["08:00", "8:00 AM"],
  ["08:30", "8:30 AM"],
  ["09:00", "9:00 AM"],
  ["09:30", "9:30 AM"],
  ["10:00", "10:00 AM"],
  ["10:30", "10:30 AM"],
  ["11:00", "11:00 AM"],
  ["11:30", "11:30 AM"],
  ["12:00", "12:00 PM"],
  ["12:30", "12:30 PM"],
  ["13:00", "1:00 PM"],
  ["13:30", "1:30 PM"],
  ["14:00", "2:00 PM"],
];

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(value) {
  return TIME_SLOTS.find(([slot]) => slot === value)?.[1] ?? value;
}

export default function CustomerReservationPage() {
  const router = useRouter();
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({
    date: today,
    time: "09:00",
    partySize: "2",
    phone: "",
    occasion: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("customerInfo");
    if (!stored) {
      router.replace("/customer/login?redirect=/customer/reservation");
      return;
    }

    startTransition(() => {
      setCustomer(JSON.parse(stored));
    });
  }, [router]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.date || !form.time || !form.partySize || !form.phone) {
      setError("Choose a date, time, party size, and phone number.");
      return;
    }

    if (form.date < today) {
      setError("Choose today or a future date.");
      return;
    }

    const partySize = Number(form.partySize);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 8) {
      setError("Party size must be between 1 and 8.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setIsSubmitting(true);
      const reservation = await createCustomerReservation({
        date: form.date,
        time: form.time,
        partySize,
        phone: form.phone,
        occasion: form.occasion,
        notes: form.notes,
      });
      setConfirmation(reservation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!customer) return null;

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(148,163,184,0.4)",
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "#111827",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700",
  };

  function RequiredLabel({ children }) {
    return (
      <label style={labelStyle}>
        {children} <span style={{ color: "#dc2626" }}>*</span>
      </label>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <CustomerNav right={
        <Link href="/customer/dashboard" style={{ fontSize: "13px", fontWeight: "600", color: "#475569", textDecoration: "none" }}>My Account</Link>
      } />

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "26px" }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: "14px", fontWeight: "700" }}>Welcome, {customer.firstName}</p>
          <h1 style={{ margin: 0, color: "#1e3a5f", fontSize: "32px", lineHeight: 1.15, fontWeight: "900" }}>Make a reservation</h1>
          <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: "15px", lineHeight: 1.6 }}>
            Choose a time for breakfast, and we will save your spot.
          </p>
        </div>

        {confirmation ? (
          <div style={{ backgroundColor: "rgba(255,255,255,0.88)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(148,163,184,0.18)", boxShadow: "0 8px 28px rgba(15,23,42,0.08)" }}>
            <p style={{ margin: "0 0 8px", color: "#16a34a", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>Reservation requested</p>
            <h2 style={{ margin: "0 0 18px", color: "#111827", fontSize: "24px", fontWeight: "900" }}>
              {confirmation.date} at {formatTime(confirmation.time)}
            </h2>
            <div style={{ display: "grid", gap: "10px", marginBottom: "22px" }}>
              {[
                ["Name", `${confirmation.firstName} ${confirmation.lastName}`],
                ["Party", `${confirmation.partySize} guest${confirmation.partySize !== 1 ? "s" : ""}`],
                ["Email", confirmation.email],
                ["Phone", confirmation.phone || "Not provided"],
                ["Occasion", confirmation.occasion || "None"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                  <span style={{ color: "#64748b", fontWeight: "700" }}>{label}</span>
                  <span style={{ color: "#111827", fontWeight: "700", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                style={{ padding: "11px 22px", borderRadius: "8px", border: "1px solid rgba(100,116,139,0.25)", backgroundColor: "white", color: "#334e6e", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}
              >
                Make Another
              </button>
              <Link href="/customer/dashboard" style={{ padding: "11px 22px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "white", fontSize: "14px", fontWeight: "800", textDecoration: "none" }}>
                Back to Account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ backgroundColor: "rgba(255,255,255,0.88)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(148,163,184,0.18)", boxShadow: "0 8px 28px rgba(15,23,42,0.08)", display: "grid", gap: "18px" }}>
            {error ? (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", padding: "10px 12px", fontSize: "13px", fontWeight: "700" }}>
                {error}
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <RequiredLabel>Date</RequiredLabel>
                <input type="date" min={today} value={form.date} onChange={(e) => updateField("date", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <RequiredLabel>Time</RequiredLabel>
                <select value={form.time} onChange={(e) => updateField("time", e.target.value)} className="lumi-report-select">
                  {TIME_SLOTS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <RequiredLabel>Party Size</RequiredLabel>
                <select value={form.partySize} onChange={(e) => updateField("partySize", e.target.value)} className="lumi-report-select">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>
              <div>
                <RequiredLabel>Phone</RequiredLabel>
                <input type="tel" placeholder="10 digits" value={form.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Occasion</label>
              <input type="text" placeholder="Birthday, meeting, family breakfast" value={form.occasion} onChange={(e) => updateField("occasion", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea placeholder="Anything we should know?" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            </div>

            <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "none", backgroundColor: isSubmitting ? "#93c5fd" : "#3b82f6", color: "white", fontSize: "15px", fontWeight: "900", cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(59,130,246,0.3)" }}>
              {isSubmitting ? "Requesting..." : "Request Reservation"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
