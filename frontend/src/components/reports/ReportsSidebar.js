import { useState } from "react";

const reportSections = [
  {
    id: "overview",
    label: "Overview",
    children: [],
  },
  {
    id: "sales",
    label: "Sales Reports",
    children: [
      { id: "sales-daily", label: "Daily Revenue" },
      { id: "sales-weekly", label: "Weekly Revenue" },
      { id: "sales-monthly", label: "Monthly Revenue" },
      { id: "sales-item", label: "Sales by Item" },
      { id: "sales-category", label: "Sales by Category" },
      { id: "sales-server", label: "Sales by Server" },
      { id: "sales-tips", label: "Tips" },
    ],
  },
  {
    id: "labor",
    label: "Labor Reports",
    children: [
      { id: "labor-performance", label: "Employee Performance" },
      { id: "labor-clock", label: "Clock In / Out" },
      { id: "labor-hours", label: "Scheduled vs Actual Hours" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Menu",
    children: [
      { id: "inventory-stock", label: "Stock Levels" },
      { id: "inventory-usage", label: "Ingredient Usage" },
      { id: "inventory-top", label: "Top Selling Items" },
      { id: "inventory-waste", label: "Waste Reduction" },
    ],
  },
  {
    id: "operations",
    label: "Operational Reports",
    children: [
      { id: "operations-voids", label: "Voids" },
      { id: "operations-discounts", label: "Discounts" },
      { id: "operations-refunds", label: "Refunds" },
      { id: "operations-payments", label: "Payment Methods" },
    ],
  },
  {
    id: "customer",
    label: "Customer Behavior",
    children: [
      { id: "customer-habits", label: "Ordering Habits" },
      { id: "customer-loyalty", label: "Loyalty Usage" },
      { id: "customer-repeat", label: "Repeat Customers" },
    ],
  },
];

export default function ReportsSidebar({
  selectedSection,
  selectedSubsection,
  onSectionChange,
  onSubsectionChange,
}) {
  const [openSections, setOpenSections] = useState({
    sales: true,
    labor: false,
    inventory: false,
    operations: false,
    customer: false,
  });

  function toggleSection(sectionId) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  return (
    <aside className="w-72 shrink-0 border-r bg-white p-6 shadow-sm">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">POS Reports</h1>

      <nav className="space-y-2">
        {reportSections.map((section) => {
          const isActiveSection = selectedSection === section.id;
          const hasChildren = section.children.length > 0;
          const isOpen = openSections[section.id];

          return (
            <div key={section.id}>
              <button
                onClick={() => {
                  onSectionChange(section.id);
                  onSubsectionChange(null);
                  if (hasChildren) toggleSection(section.id);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition ${
                  isActiveSection
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{section.label}</span>
                {hasChildren && (
                  <span className="ml-2 inline-block text-sm">
                    {isOpen ? "▼" : "▶"}
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {section.children.map((child) => {
                    const isActiveChild = selectedSubsection === child.id;

                    return (
                      <button
                        key={child.id}
                        onClick={() => {
                          onSectionChange(section.id);
                          onSubsectionChange(child.id);
                        }}
                        className={`block w-full rounded-lg px-4 py-2 text-left text-sm transition ${
                          isActiveChild
                            ? "bg-blue-100 font-medium text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {child.label}
                      </button>
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