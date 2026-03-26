import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { href: "/tables", label: "Tables" },
  { href: "/server-order", label: "Server Order" },
  { href: "/checkout", label: "Checkout" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/back-office", label: "Back Office" },
  { href: "/reports", label: "Reports" },
];

function isActiveRoute(pathname, href) {
  if (href === pathname) {
    return true;
  }

  if (href === "/back-office" || href === "/reports" || href === "/checkout") {
    return pathname.startsWith(href);
  }

  return false;
}

export default function AppChrome({ children }) {
  const router = useRouter();

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
            <p className="app-shell__eyebrow">Lumi POS</p>
            <h1 className="app-shell__title">Front of House</h1>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
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

          <Link href="/" className="app-shell__logout">
            Logout
          </Link>
        </nav>
      </header>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}
