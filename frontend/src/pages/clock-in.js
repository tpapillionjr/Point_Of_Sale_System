import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authenticateShift, clockInShift, clockOutShift } from "../lib/api";

export default function ClockinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);
  const [activePin, setActivePin] = useState(null);
  const [role, setRole] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [tipDeclaredAmount, setTipDeclaredAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  function pressNum(num) {
    if (pin.length >= 4) return;
    setPin(pin + num);
    setMessage(null);
  }

  function pressBackspace() {
    setPin(pin.slice(0, -1));
    setMessage(null);
  }

  async function pressEnter() {
    const enteredPin = pin;
    setPin("");
    setIsLoading(true);

    try {
      const session = await authenticateShift(enteredPin);
      setUser({
        userId: session.userId,
        name: session.name,
        roles: session.roles,
        role: session.role,
      });
      setActivePin(enteredPin);
      setRole(session.roles[0] ?? null);
      setClockedIn(session.clockedIn);
      setTipDeclaredAmount("");

      if (session.clockedIn) {
        setMessage({
          type: "success",
          text: `Welcome back, ${session.name}. You are already clocked in as ${session.roles[0]}.`,
        });
      } else if (!session.scheduledToday) {
        setMessage({
          type: "error",
          text: `${session.name} is not scheduled to work today.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Welcome, ${session.name}. Scheduled role: ${session.roles[0]}.`,
        });
      }
    } catch (error) {
      setUser(null);
      setActivePin(null);
      setRole(null);
      setClockedIn(false);
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClockInOut() {
    if (!user || !activePin) return;

    setIsLoading(true);

    try {
      if (!clockedIn) {
        const session = await clockInShift(activePin);
        setClockedIn(true);
        setRole(session.roles[0] ?? role);
        setMessage({
          type: "success",
          text: `${session.name} (${session.roles[0]}) clocked in successfully.`,
        });
      } else {
        const tipAmount = tipDeclaredAmount === "" ? null : Number(tipDeclaredAmount);
        const session = await clockOutShift(activePin, tipAmount);
        setClockedIn(false);
        setTipDeclaredAmount("");
        setMessage({
          type: "success",
          text: `${session.name} clocked out successfully.`,
        });
        setUser(null);
        setActivePin(null);
        setRole(null);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin() {
    if (!user || !activePin) return;

    if (!clockedIn) {
      setMessage({ type: "error", text: "You must clock in before login." });
      return;
    }

    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessage({
      type: "success",
      text: user.name + " logged in as " + role + " at " + timeNow,
    });

    localStorage.setItem(
      "currentEmployee",
      JSON.stringify({
        userId: user.userId,
        name: user.name,
        role: user.role,
        displayRole: role,
      })
    );

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

  const pinDots = [];
  for (let i = 0; i < 4; i++) {
    const filled = i < pin.length;
    pinDots.push(
      <div key={i} className={filled ? "ci-dot ci-dot--filled" : "ci-dot"} />
    );
  }

  const numButtons = [];
  for (let n = 1; n <= 9; n++) {
    const label = String(n);
    numButtons.push(
      <button key={label} className="ci-btn" onClick={() => pressNum(label)}>
        {label}
      </button>
    );
  }

  let headerLabel = "Enter your employee PIN";
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

        <div className="ci-dots">{pinDots}</div>

        {message && (
          <p className={"ci-status ci-status--" + message.type}>{message.text}</p>
        )}

        {user && role && (
          <div className="ci-roles">
            <p className="ci-roles__label">Scheduled role:</p>
            <div className="ci-roles__grid">
              <button className="ci-role-btn ci-role-btn--active" type="button">
                {role}
              </button>
            </div>
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

        <div className="ci-grid">
          {numButtons}
          <button className="ci-btn ci-btn--ghost" onClick={pressBackspace}>⌫</button>
          <button className="ci-btn" onClick={() => pressNum("0")}>0</button>
          <button className="ci-btn ci-btn--enter" onClick={pressEnter}>✓</button>
        </div>

        <div className="ci-clock">
          <span className="ci-clock__time">{timeStr}</span>
          <span className="ci-clock__date">{dateStr}</span>
        </div>

        <button className="ci-login-btn" onClick={handleLogin} disabled={!clockedIn || !user || isLoading}>
          Login
        </button>

        <button className={clockBtnClass} onClick={handleClockInOut} disabled={clockBtnDisabled}>
          {clockedIn ? "Clock Out" : "Clock In"}
        </button>

      </div>
    </div>
  );
}
