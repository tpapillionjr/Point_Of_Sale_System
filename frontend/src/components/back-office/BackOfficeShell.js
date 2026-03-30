import Link from "next/link";
import { useRouter } from "next/router";

const navSections = [
  { href: "/back-office", label: "Dashboard" },
  { href: "/back-office/inventory", label: "Inventory" },
  { href: "/back-office/inventory-counts", label: "Inventory Counts" },
  { href: "/back-office/purchasing", label: "Purchasing" },
  { href: "/back-office/menu-management", label: "Menu Management" },
  { href: "/back-office/order-history", label: "Order History" },
  { href: "/back-office/labor", label: "Labor" },
  { href: "/back-office/create-employees", label: "Create Employees" },
  { href: "/back-office/customer-loyalty", label: "Customer Loyalty" },
  { href: "/back-office/settings", label: "Settings" },
];

export default function BackOfficeShell({ title, description, children }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-72 shrink-0 border-r bg-slate-950 px-6 py-8 text-white">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Restaurant POS
          </p>
          <h1 className="mt-3 text-2xl font-bold">Back Office</h1>
        </div>

        <nav className="space-y-2">
          {navSections.map((item) => {
            const isActive = router.pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-gray-600">{description}</p>
        </header>

        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
