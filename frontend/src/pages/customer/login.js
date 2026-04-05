import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const mode = router.query.mode === "signup" ? "signup" : "login";

  function handleModeSwitch(next) {
    setError("");
    setMessage("");
    router.push(next === "signup" ? "/customer/login?mode=signup" : "/customer/login", undefined, { shallow: true });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!loginForm.email || !loginForm.password) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(loginForm.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    console.log("Login form data:", loginForm);
    setMessage("Login successful! (mock — no API connected yet)");
  }

  function handleSignupSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const { firstName, lastName, email, phone, password, confirmPassword } = signupForm;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Sign up form data:", signupForm);
    setMessage("Account created! (mock — no API connected yet)");
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(148,163,184,0.4)",
    fontSize: "14px",
    color: "#1e3a5f",
    backgroundColor: "rgba(255,255,255,0.8)",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        backgroundColor: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(148,163,184,0.15)",
      }}>
        <Link href="/customer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/lumii2.png" alt="Lumi logo" width={32} height={32} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e", letterSpacing: "-0.01em" }}>lumi</span>
        </Link>
        <Link href="/customer" style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", textDecoration: "none" }}>
          ← Back to Home
        </Link>
      </nav>

      {/* Main */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.75)",
          borderRadius: "20px",
          border: "1px solid rgba(148,163,184,0.2)",
          boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
          backdropFilter: "blur(12px)",
          padding: "40px",
          width: "100%",
          maxWidth: "440px",
        }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Image src="/lumii2.png" alt="Lumi" width={56} height={56} style={{ objectFit: "contain" }} />
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px", fontWeight: "500" }}>
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "rgba(241,245,249,0.8)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
          }}>
            {[{ key: "login", label: "Log In" }, { key: "signup", label: "Sign Up" }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleModeSwitch(key)}
                style={{
                  padding: "9px",
                  borderRadius: "9px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  backgroundColor: mode === key ? "white" : "transparent",
                  color: mode === key ? "#1e3a5f" : "#94a3b8",
                  boxShadow: mode === key ? "0 1px 4px rgba(15,23,42,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div style={{ backgroundColor: "rgba(254,242,242,0.9)", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#b91c1c", fontWeight: "600" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ backgroundColor: "rgba(240,253,244,0.9)", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#15803d", fontWeight: "600" }}>
              {message}
            </div>
          )}

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <button type="submit" style={{
                width: "100%",
                padding: "12px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "4px",
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}>
                Log In
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", margin: 0 }}>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => handleModeSwitch("signup")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: "700", cursor: "pointer", fontSize: "13px", padding: 0 }}>
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* Signup form */}
          {mode === "signup" && (
            <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input
                    type="text"
                    placeholder="Jane"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="10 digits, no dashes"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <button type="submit" style={{
                width: "100%",
                padding: "12px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "4px",
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}>
                Create Account
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", margin: 0 }}>
                Already have an account?{" "}
                <button type="button" onClick={() => handleModeSwitch("login")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: "700", cursor: "pointer", fontSize: "13px", padding: 0 }}>
                  Log in
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px", borderTop: "1px solid rgba(148,163,184,0.15)" }}>
        © 2026 Lumi Restaurant · All rights reserved.
      </footer>

    </div>
  );
}
