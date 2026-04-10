import Link from "next/link";
import { useRouter } from "next/router";

const reportSections = [
  {
    id: "overview",
    label: "Overview",
    href: "/reports",
  },
  {
    id: "sales",
    label: "Sales Reports",
    href: "/reports/sales",
  },
  {
    id: "labor",
    label: "Labor Reports",
    href: "/reports/labor",
  },
  {
    id: "inventory",
    label: "Inventory & Menu",
    href: "/reports/inventory",
  },
  {
    id: "operations",
    label: "Operational Reports",
    href: "/reports/operations",
  },
  {
    id: "customer",
    label: "Customer Behavior",
    href: "/reports/customer",
  },
];

function getCurrentSection(pathname) {
  if (pathname === "/reports") {
    return "overview";
  }

  const match = reportSections.find(
    (section) => section.id !== "overview" && pathname.startsWith(`${section.href}/`)
  );

  if (match) {
    return match.id;
  }

  const parentMatch = reportSections.find((section) => section.href === pathname);
  return parentMatch?.id ?? "overview";
}

export default function ReportsSidebar() {
  const router = useRouter();
  const currentSection = getCurrentSection(router.pathname);

  return (
    <aside className="w-72 shrink-0 border-r bg-slate-950 px-6 py-8 text-white">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Restaurant POS
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">POS Reports</h1>
      </div>

      <nav className="space-y-2">
        {reportSections.map((section) => {
          const isActiveSection = currentSection === section.id;

          return (
            <Link
              key={section.id}
              href={section.href}
              className={`block rounded-2xl px-4 py-3 font-medium transition ${
                isActiveSection
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <p>{section.label}</p>
              <p className={`mt-1 text-xs ${isActiveSection ? "text-blue-100" : "text-slate-500"}`}>
                Open {section.label.toLowerCase()}
              </p>
            </Link>
            
          );
        })}
      </nav>
    </aside>
  );
}
