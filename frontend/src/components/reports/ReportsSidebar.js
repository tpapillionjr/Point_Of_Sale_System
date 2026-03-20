import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const reportSections = [
  {
    id: "overview",
    label: "Overview",
    href: "/reports",
    children: [],
  },
  {
    id: "sales",
    label: "Sales Reports",
    children: [
      { id: "sales-daily", label: "Daily Revenue", href: "/reports/sales/daily" },
      { id: "sales-weekly", label: "Weekly Revenue", href: "/reports/sales/weekly" },
      { id: "sales-monthly", label: "Monthly Revenue", href: "/reports/sales/monthly" },
      { id: "sales-item", label: "Sales by Item", href: "/reports/sales/items" },
      { id: "sales-category", label: "Sales by Category", href: "/reports/sales/categories" },
      { id: "sales-server", label: "Sales by Server", href: "/reports/sales/servers" },
      { id: "sales-tips", label: "Tips", href: "/reports/sales/tips" },
    ],
    href: "/reports/sales",
  },
  {
    id: "labor",
    label: "Labor Reports",
    children: [
      { id: "labor-performance", label: "Employee Performance", href: "/reports/labor/performance" },
      { id: "labor-clock", label: "Clock In / Out", href: "/reports/labor/clock" },
      { id: "labor-hours", label: "Scheduled vs Actual Hours", href: "/reports/labor/hours" },
    ],
    href: "/reports/labor",
  },
  {
    id: "inventory",
    label: "Inventory & Menu",
    children: [
      { id: "inventory-stock", label: "Stock Levels", href: "/reports/inventory/stock" },
      { id: "inventory-usage", label: "Ingredient Usage", href: "/reports/inventory/usage" },
      { id: "inventory-top", label: "Top Selling Items", href: "/reports/inventory/top-items" },
      { id: "inventory-waste", label: "Waste Reduction", href: "/reports/inventory/waste" },
    ],
    href: "/reports/inventory",
  },
  {
    id: "operations",
    label: "Operational Reports",
    children: [
      { id: "operations-voids", label: "Voids", href: "/reports/operations/voids" },
      { id: "operations-discounts", label: "Discounts", href: "/reports/operations/discounts" },
      { id: "operations-refunds", label: "Refunds", href: "/reports/operations/refunds" },
      { id: "operations-payments", label: "Payment Methods", href: "/reports/operations/payments" },
    ],
    href: "/reports/operations",
  },
  {
    id: "customer",
    label: "Customer Behavior",
    children: [
      { id: "customer-habits", label: "Ordering Habits", href: "/reports/customer/habits" },
      { id: "customer-loyalty", label: "Loyalty Usage", href: "/reports/customer/loyalty" },
      { id: "customer-repeat", label: "Repeat Customers", href: "/reports/customer/repeat" },
    ],
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
  const [manualOpenSections, setManualOpenSections] = useState({
    sales: currentSection === "sales",
    labor: currentSection === "labor",
    inventory: currentSection === "inventory",
    operations: currentSection === "operations",
    customer: currentSection === "customer",
  });

  const openSections =
    currentSection === "overview"
      ? manualOpenSections
      : {
          ...manualOpenSections,
          [currentSection]: true,
        };

  function toggleSection(sectionId) {
    setManualOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

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
          const hasChildren = section.children.length > 0;
          const isOpen = openSections[section.id];

          return (
            <div key={section.id}>
              <div
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition ${
                  isActiveSection
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Link href={section.href} className="flex-1">
                  {section.label}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`ml-2 inline-block text-sm ${
                      isActiveSection ? "text-white" : "text-slate-400"
                    }`}
                    aria-label={isOpen ? `Collapse ${section.label}` : `Expand ${section.label}`}
                  >
                    {isOpen ? "▼" : "▶"}
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {section.children.map((child) => {
                    const isActiveChild = router.pathname === child.href;

                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`block w-full rounded-lg px-4 py-2 text-left text-sm transition ${
                          isActiveChild
                            ? "bg-blue-100 font-medium text-blue-700"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
