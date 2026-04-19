import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCustomerSession } from "../lib/useCustomerSession";

export default function CustomerNav({ right }) {
  const router = useRouter();
  const { customer } = useCustomerSession();

  const navLinks = [
    { href: "/customer", label: "Home" },
    { href: "/customer/dashboard", label: "Dashboard" },
    { href: "/customer/menu", label: "Menu" },
    { href: "/customer/order-tracking", label: "Track Order" },
    { href: "/customer/reservation", label: "Reservations" },
    { href: "/customer/settings", label: "Settings" },
  ];

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 40px",
      backgroundColor: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(148,163,184,0.15)",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>
      <Link href={customer ? "/customer/dashboard" : "/customer"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <Image src="/lumii2.png" alt="Lumi logo" width={36} height={36} style={{ objectFit: "contain" }} />
        <span style={{ fontSize: "20px", fontWeight: "700", color: "#334e6e" }}>lumi</span>
      </Link>

      {customer && (
        <div style={{ display: "flex", gap: "4px" }}>
          {navLinks.map(({ href, label }) => {
            const isActive = router.pathname === href || router.asPath.startsWith(href + "?");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#1d4ed8" : "#64748b",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ minWidth: "80px", display: "flex", justifyContent: "flex-end" }}>
        {right ?? null}
      </div>
    </nav>
  );
}
