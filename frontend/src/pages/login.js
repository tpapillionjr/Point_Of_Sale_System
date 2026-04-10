import { useState } from "react";
import { useRouter } from "next/router";

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsCaptcha, setNeedsCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaSessionToken, setCaptchaSessionToken] = useState("");

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!loginForm.email || !loginForm.password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    if (!validateEmail(loginForm.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          captchaToken: needsCaptcha ? captchaSessionToken : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if CAPTCHA is required
        if (data.needsCaptcha) {
          setNeedsCaptcha(true);
          setCaptchaSessionToken(data.captchaSessionToken);
          setError(data.error);
          setLoading(false);
          return;
        }

        // Check if account is locked
        if (data.locked) {
          setError(data.error);
          setLoading(false);
          return;
        }

        // Rate limited
        if (response.status === 429) {
          setError(`${data.error} (Retry after ${data.retryAfter} seconds)`);
          setLoading(false);
          return;
        }

        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      // Successful login
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Login successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/index"); // Redirect to main page
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }

    setLoading(false);
  }

  async function handleCaptchaValidate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!captchaToken) {
      setError("Please solve the CAPTCHA.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users/validate-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
          captchaToken: captchaSessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "CAPTCHA validation failed.");
        setLoading(false);
        return;
      }

      // Successful login after CAPTCHA
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        router.push("/index");
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }

    setLoading(false);
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #f8fafc 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          backgroundColor: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e", letterSpacing: "-0.01em" }}>
          POS System
        </span>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>
          Employee Login
        </span>
      </nav>

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.75)",
            borderRadius: "20px",
            border: "1px solid rgba(148,163,184,0.2)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
            backdropFilter: "blur(12px)",
            padding: "40px",
            width: "100%",
            maxWidth: "440px",
          }}
        >
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e3a5f", margin: "0 0 6px 0" }}>
              Employee Login
            </h1>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontWeight: "500" }}>
              Sign in to your account
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(254,242,242,0.9)",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#b91c1c",
                fontWeight: "600",
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              style={{
                backgroundColor: "rgba(240,253,244,0.9)",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#15803d",
                fontWeight: "600",
              }}
            >
              {message}
            </div>
          )}

          {/* Login Form or CAPTCHA */}
          {!needsCaptcha ? (
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="employee@restaurant.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={inputStyle}
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "4px",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCaptchaValidate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Security Challenge</label>
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "16px",
                    textAlign: "center",
                    marginBottom: "12px",
                  }}
                >
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#475569" }}>
                    Too many failed attempts. Please verify you&apos;re human.
                  </p>
                  <div
                    style={{
                      backgroundColor: "white",
                      border: "2px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    I&apos;m not a robot
                  </div>
                  <input
                    type="text"
                    placeholder="Enter CAPTCHA code here"
                    value={captchaToken}
                    onChange={(e) => setCaptchaToken(e.target.value)}
                    style={{
                      ...inputStyle,
                      marginBottom: "12px",
                    }}
                    disabled={loading}
                  />
                  <small style={{ display: "block", color: "#94a3b8", fontSize: "11px" }}>
                    Session token: {captchaSessionToken.slice(0, 20)}...
                  </small>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "4px",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                }}
              >
                {loading ? "Verifying..." : "Verify and Continue"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setNeedsCaptcha(false);
                  setError("");
                  setCaptchaToken("");
                }}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "transparent",
                  color: "#3b82f6",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "#94a3b8",
          fontSize: "13px",
          borderTop: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        © 2026 Restaurant POS System · All rights reserved.
      </footer>
    </div>
  );
}
