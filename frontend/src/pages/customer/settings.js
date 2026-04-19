import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import CustomerNav from "../../components/CustomerNav";
import { updateCustomerProfile } from "../../lib/api";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("customerInfo");
    if (!stored) { router.replace("/customer/login"); return; }
    const parsed = JSON.parse(stored);
    setCustomer(parsed);
    setForm((f) => ({
      ...f,
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
    }));
  }, [router]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("customerAuthToken");
      const updated = await updateCustomerProfile(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });

      const stored = JSON.parse(localStorage.getItem("customerInfo") || "{}");
      const next = { ...stored, firstName: updated.firstName, lastName: updated.lastName, email: updated.email, phone: updated.phone };
      localStorage.setItem("customerInfo", JSON.stringify(next));
      setCustomer(next);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      <CustomerNav right={
        <button
          onClick={() => { localStorage.removeItem("customerAuthToken"); localStorage.removeItem("customerInfo"); router.replace("/customer/login"); }}
          style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: "8px" }}
        >
          Sign Out
        </button>
      } />

      <div style={{ maxWidth: "520px", margin: "48px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Account Settings</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px" }}>Update your name, email, phone, or password.</p>

        <form onSubmit={handleSubmit} style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <Field label="First Name">
              <input name="firstName" value={form.firstName} onChange={handleChange} required style={inputStyle} />
            </Field>
            <Field label="Last Name">
              <input name="lastName" value={form.lastName} onChange={handleChange} required style={inputStyle} />
            </Field>
          </div>

          <Field label="Email" style={{ marginBottom: "16px" }}>
            <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </Field>

          <Field label="Phone Number" style={{ marginBottom: "32px" }}>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="10 digits" style={inputStyle} />
          </Field>

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: "24px" }} />
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Change Password (optional)</p>

          <Field label="Current Password" style={{ marginBottom: "16px" }}>
            <input name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} style={inputStyle} placeholder="Required to change password" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <Field label="New Password">
              <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} style={inputStyle} placeholder="Min. 6 characters" />
            </Field>
            <Field label="Confirm New Password">
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} style={inputStyle} />
            </Field>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", fontSize: "14px", marginBottom: "16px" }}>{success}</p>}

          <button type="submit" disabled={saving} style={{ width: "100%", padding: "12px", backgroundColor: saving ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#1e293b",
  outline: "none",
  boxSizing: "border-box",
};
