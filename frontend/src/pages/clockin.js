import { useState, useEffect } from "react";

const EMPLOYEES = {
  "1234": { name: "Alice", roles: ["Server", "Server Trainer"] },
  "5678": { name: "Bob", roles: ["Host", "Host Trainee", "Host Trainer"] },
  "9012": { name: "Charlie", roles: ["Kitchen Expo", "Kitchen Prep"] },
};

export default function ClockinPage() {
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
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

  function pressEnter() {
    const found = EMPLOYEES[pin];
    setPin("");

    if (found) {
      setUser(found);
      setRole(null);
      setMessage({ type: "success", text: "Welcome, " + found.name + "! Select your role." });
    } else {
      setMessage({ type: "error", text: "Incorrect PIN. Try again." });
    }
  }

  function selectRole(selectedRole) {
    setRole(selectedRole);
    setMessage({ type: "success", text: selectedRole + " selected." });
  }

  function handleClockInOut() {
    if (!user) return;

    const name = user.name;
    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!clockedIn) {
      setClockedIn(true);
      setMessage({
        type: "success",
        text: name + " (" + role + ") clocked in at " + timeNow,
      });
    } else {
      setClockedIn(false);
      setMessage({
        type: "success",
        text: name + " clocked out at " + timeNow,
      });
      setUser(null);
      setRole(null);
    }
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

  const clockBtnDisabled = !user || (!clockedIn && !role);

  return (
    <div className="ci-page">
      <div className="ci-card">

        <p className="ci-sub">{headerLabel}</p>

        <div className="ci-dots">{pinDots}</div>

        {message && (
          <p className={"ci-status ci-status--" + message.type}>{message.text}</p>
        )}

        {user && !clockedIn && (
          <div className="ci-roles">
            <p className="ci-roles__label">Select role:</p>
            <div className="ci-roles__grid">
              {user.roles.map((r) => {
                let btnClass = "ci-role-btn";
                if (role === r) {
                  btnClass += " ci-role-btn--active";
                }
                return (
                  <button key={r} className={btnClass} onClick={() => selectRole(r)}>
                    {r}
                  </button>
                );
              })}
            </div>
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

        <button className={clockBtnClass} onClick={handleClockInOut} disabled={clockBtnDisabled}>
          {clockedIn ? "Clock Out" : "Clock In"}
        </button>

      </div>
    </div>
  );
}
