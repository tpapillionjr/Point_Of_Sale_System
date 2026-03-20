import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ActionList from "../../components/back-office/ActionList";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";

const managerActions = [
  {
    title: "Resolve low stock on Applewood Bacon and Maple Syrup",
    description: "Both items are below reorder point and may block breakfast menu availability.",
    priority: "High",
  },
  {
    title: "Review Texas Toast outage before dinner prep",
    description: "Item is unavailable and currently affects one linked menu offering.",
    priority: "High",
  },
  {
    title: "Approve two cycle-count variances from opening shift",
    description: "Count sheet still has unresolved discrepancies from morning inventory.",
    priority: "Medium",
  },
  {
    title: "Update spring modifier pricing",
    description: "Menu management change is staged but not yet published to front of house.",
    priority: "Low",
  },
];

export default function BackOfficePage() {
  return (
    <BackOfficeShell
      title="Manager Dashboard"
      description="A fast back-office landing page for the operational checks managers do every shift."
    >
      <ReportSection title="Today at a Glance">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Open Tables" value="11" />
          <ReportCard title="Open Checks" value="17" />
          <ReportCard title="Kitchen Tickets" value="6" />
          <ReportCard title="Inventory Alerts" value="5" />
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Manager Actions">
          <ActionList items={managerActions} />
        </ReportSection>

        <ReportSection title="Back Office Areas">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Inventory", "Stock health, menu coverage, waste, and alerts."],
              ["Inventory Counts", "Cycle counts, full counts, and variance checks."],
              ["Purchasing", "Reorder priorities, suppliers, and incoming stock."],
              ["Order History", "Refunds, voids, receipts, and audit review."],
              ["Labor", "Shifts, roles, and attendance review."],
              ["Settings", "Taxes, pricing rules, and back-office controls."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
