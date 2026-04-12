import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authenticateShift, clockInShift, clockOutShift } from "../lib/api";

export default function ClockinPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ identifier: "", password: "" });
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [scheduledHours, setScheduledHours] = useState(0);
  const [tipDeclaredAmount, setTipDeclaredAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [authToken, setAuthToken] = useState(null);


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = currentTime.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function handleAuthenticate(event) {
    event?.preventDefault();
    if (user) return;
    if (!credentials.identifier.trim() || !credentials.password) {
      setMessage({ type: "error", text: "Username/email and password are required." });
      return;
    }

    setIsLoading(true);

    try {
      const session = await authenticateShift({
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      });
      setAuthToken(session.token);
      localStorage.setItem("authToken", session.token);
      setUser({
        userId: session.userId,
        name: session.name,
        roles: session.roles,
        role: session.role,
      });
      setRole(session.roles[0] ?? null);
      setClockedIn(session.clockedIn);
      setScheduledHours(Number(session.scheduledHours ?? 0));
      setTipDeclaredAmount("");
      setCredentials({ identifier: "", password: "" });

      if (session.clockedIn) {
        setMessage({
          type: "success",
          text: `Welcome back, ${session.name}. You are already clocked in as ${session.roles[0]}.`,
        });
      } else if (!session.scheduledToday) {
        setMessage({
          type: "success",
          text: `${session.name} is not scheduled to clock in today`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Welcome, ${session.name}. Scheduled role: ${session.roles[0]}.`,
        });
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      setClockedIn(false);
      setScheduledHours(0);
      setAuthToken(null);
      localStorage.removeItem("authToken");
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClockInOut() {
    if (!user || !authToken) return;

    setIsLoading(true);

    try {
      if (!clockedIn) {
        const session = await clockInShift();
        setClockedIn(true);
        setRole(session.roles[0] ?? role);
        setScheduledHours(Number(session.scheduledHours ?? scheduledHours));
        setMessage({
          type: "success",
          text: `${session.name} (${session.roles[0]}) clocked in successfully.`,
        });
      } else {
        const tipAmount = tipDeclaredAmount === "" ? null : Number(tipDeclaredAmount);
        const session = await clockOutShift(tipAmount);
        setClockedIn(false);
        setTipDeclaredAmount("");
        setMessage({
          type: "success",
          text: `${session.name} clocked out successfully.`,
        });
        setUser(null);
        setRole(null);
        setScheduledHours(0);
        setAuthToken(null);
        localStorage.removeItem("authToken");

      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin() {
    if (!user || !authToken) return;

    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessage({
      type: "success",
      text: user.name + " logged in as " + role + " at " + timeNow,
    });

    localStorage.setItem("authToken", authToken);

    localStorage.setItem(
      "currentEmployee",
      JSON.stringify({
        userId: user.userId,
        name: user.name,
        role: user.role,
        displayRole: role,
      })
    );
    window.dispatchEvent(new Event("pos-session-change"));

    if (user.role === "kitchen") {
      router.push("/expo");
      return;
    }

    if (user.role === "manager") {
      router.push("/back-office");
      return;
    }

    router.push("/tables");
  }

  let headerLabel = "Employee Login";
  if (user) {
    headerLabel = user.name;
  }

  let clockBtnClass = "ci-clock-btn";
  if (clockedIn) {
    clockBtnClass += " ci-clock-btn--out";
  }

  const clockBtnDisabled = !user || !role || isLoading;

  return (
    <div className="ci-page">
      <div className="ci-card">

        <p className="ci-sub">{headerLabel}</p>

        {message && (
          <p className={"ci-status ci-status--" + message.type}>{message.text}</p>
        )}

        {!user && (
          <form onSubmit={handleAuthenticate} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            <input
              type="text"
              value={credentials.identifier}
              onChange={(event) => {
                setCredentials({ ...credentials, identifier: event.target.value });
                setMessage(null);
              }}
              placeholder="Username or email"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                backgroundColor: "#ffffff",
                color: "#0f172a",
              }}
            />
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => {
                setCredentials({ ...credentials, password: event.target.value });
                setMessage(null);
              }}
              placeholder="Password"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                backgroundColor: "#ffffff",
                color: "#0f172a",
              }}
            />
            <button className="ci-login-btn" type="submit" disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {user && role && (
          <div className="ci-roles">
            <p className="ci-roles__label">Scheduled role:</p>
            <div className="ci-roles__grid">
              <button className="ci-role-btn ci-role-btn--active" type="button">
                {role}
              </button>
            </div>
            {["employee", "manager"].includes(user.role) && (
              <p className="ci-roles__label" style={{ marginTop: "12px" }}>
                Scheduled hours today: {scheduledHours ? `${scheduledHours.toFixed(2)} hours` : "No shift scheduled"}
              </p>
            )}
          </div>
        )}

        {clockedIn && user?.role === "employee" && (
          <div className="ci-roles">
            <p className="ci-roles__label">Tips to declare before clock out:</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tipDeclaredAmount}
              onChange={(event) => setTipDeclaredAmount(event.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                backgroundColor: "#ffffff",
                color: "#0f172a",
              }}
            />
          </div>
        )}

        <div className="ci-clock">
          <span className="ci-clock__time">{timeStr}</span>
          <span className="ci-clock__date">{dateStr}</span>
        </div>

        <button className="ci-login-btn" onClick={handleLogin} disabled={!user || isLoading}>
          Login
        </button>

        <button className={clockBtnClass} onClick={handleClockInOut} disabled={clockBtnDisabled}>
          {clockedIn ? "Clock Out" : "Clock In"}
        </button>

      </div>
    </div>
  );
}
