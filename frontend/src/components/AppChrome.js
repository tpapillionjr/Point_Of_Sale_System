import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { canAccessManagerRoutes, clearStaffSession, getStoredEmployee } from "../lib/session";

const NAV_ITEMS = [
  { href: "/clock-in", label: "Clock In" },
  { href: "/tables", label: "Tables" },
  { href: "/online-orders", label: "Takeout / Online Orders" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/back-office", label: "Back Office" },
  { href: "/reports", label: "Reports" },
];

function isActiveRoute(pathname, href) {
  if (href === pathname) {
    return true;
  }

  if (href === "/back-office" || href === "/reports") {
    return pathname.startsWith(href);
  }

  return false;
}

function subscribeToStorage(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener("pos-session-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("pos-session-change", listener);
  };
}

function getEmployeeSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("currentEmployee");
}

export default function AppChrome({ children }) {
  const router = useRouter();
  const employeeSnapshot = useSyncExternalStore(subscribeToStorage, getEmployeeSnapshot, () => null);
  const employee = useMemo(() => {
    if (!employeeSnapshot) {
      return null;
    }

    try {
      return JSON.parse(employeeSnapshot);
    } catch {
      return getStoredEmployee();
    }
  }, [employeeSnapshot]);

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/back-office" || item.href === "/reports") {
      return canAccessManagerRoutes(employee);
    }

    return true;
  });

  function handleLogout() {
    clearStaffSession();
    router.push("/clock-in");
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Image
            src="/lumii2.png"
            alt="Lumi POS logo"
            width={56}
            height={56}
            priority
            className="app-shell__logo"
          />

          <div>
            <h1 className="app-shell__title app-shell__title--brand">lumi POS</h1>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActiveRoute(router.pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "app-shell__link app-shell__link--active" : "app-shell__link"}
              >
                {item.label}
              </Link>
            );
          })}

          <button type="button" onClick={handleLogout} className="app-shell__logout">
            Logout
          </button>
        </nav>
      </header>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}
