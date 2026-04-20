import { useEffect, useState } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ActionList from "../../components/back-office/ActionList";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import Link from "next/link";
import { fetchBackOfficeDashboard } from "../../lib/api";

export default function BackOfficePage() {
  const [dashboard, setDashboard] = useState({
    summary: {
      openTables: 0,
      openChecks: 0,
      kitchenTickets: 0,
      inventoryAlerts: 0,
    },
    managerActions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchBackOfficeDashboard();
        if (!isMounted) {
          return;
        }

        setDashboard(data);
        setError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "Failed to load the back office dashboard.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <BackOfficeShell
      title="Manager Dashboard"
      description="A fast back-office landing page for the operational checks managers do every shift."
    >
      <ReportSection title="Today at a Glance">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Open Tables"
            value={isLoading ? "..." : String(dashboard.summary.openTables)}
          />
          <ReportCard
            title="Open Checks"
            value={isLoading ? "..." : String(dashboard.summary.openChecks)}
          />
          <ReportCard
            title="Kitchen Tickets"
            value={isLoading ? "..." : String(dashboard.summary.kitchenTickets)}
          />
          <ReportCard
            title="Inventory Alerts"
            value={isLoading ? "..." : String(dashboard.summary.inventoryAlerts)}
          />
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Manager Actions">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <ActionList
              items={
                isLoading
                  ? [
                      {
                        title: "Loading manager actions",
                        description: "Fetching current kitchen and inventory issues.",
                        priority: "Low",
                      },
                    ]
                  : dashboard.managerActions
              }
            />
          )}
        </ReportSection>

        <ReportSection title="Back Office Areas">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["/back-office/inventory", "Inventory Updates", "Receive stock, adjust on-hand counts, and track reorder thresholds."],
              ["/back-office/menu-management", "Menu Management", "Update items, pricing, modifiers, and item availability."],
              ["/back-office/labor", "Labor Management", "Adjust roles, staffing plans, pay settings, and attendance notes."],
              ["/back-office/order-history", "Order Review", "Search receipts, review exceptions, and document refund decisions."],
              ["/back-office/customer-loyalty", "Customer & Loyalty", "Find guests, update profiles, and adjust loyalty balances."],
              ["/back-office/reservations", "Reservations", "Review and confirm customer reservation requests; capacity is checked automatically."],
              ["/back-office/settings", "System Settings", "Maintain taxes, receipt rules, approval controls, and device defaults."],
            ].map(([href, title, body]) => (
              <Link
                key={title}
                href={href}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-600">{body}</p>
                <span className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Open area
                </span>
              </Link>
            ))}
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
