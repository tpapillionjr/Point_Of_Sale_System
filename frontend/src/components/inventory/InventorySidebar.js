import { useState } from "react";

const inventorySections = [
  { id: "overview", label: "Overview", children: [] },
  {
    id: "stock",
    label: "Stock Levels",
    children: [
      { id: "stock-current", label: "Current Stock" },
      { id: "stock-alerts", label: "Low Stock Alerts" },
      { id: "stock-unavailable", label: "Unavailable Items" },
    ],
  },
  {
    id: "usage",
    label: "Usage & Waste",
    children: [
      { id: "usage-consumption", label: "Ingredient Usage" },
      { id: "usage-waste", label: "Waste Tracking" },
    ],
  },
  {
    id: "menu",
    label: "Menu Coverage",
    children: [
      { id: "menu-coverage", label: "Coverage Map" },
      { id: "menu-active", label: "Active Menu Links" },
    ],
  },
  {
    id: "purchasing",
    label: "Purchasing",
    children: [
      { id: "purchasing-reorder", label: "Reorder Queue" },
      { id: "purchasing-suppliers", label: "Suppliers" },
    ],
  },
];

export default function InventorySidebar({
  selectedSection,
  selectedSubsection,
  onSectionChange,
  onSubsectionChange,
}) {
  const [openSections, setOpenSections] = useState({
    stock: true,
    usage: false,
    menu: false,
    purchasing: false,
  });

  function toggleSection(sectionId) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  return (
    <aside className="w-72 shrink-0 border-r bg-white p-6 shadow-sm">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">POS Inventory</h1>

      <nav className="space-y-2">
        {inventorySections.map((section) => {
          const hasChildren = section.children.length > 0;
          const isOpen = openSections[section.id];
          const isActiveSection = selectedSection === section.id;

          return (
            <div key={section.id}>
              <button
                onClick={() => {
                  onSectionChange(section.id);
                  onSubsectionChange(null);
                  if (hasChildren) {
                    toggleSection(section.id);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-medium transition ${
                  isActiveSection
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{section.label}</span>
                {hasChildren ? <span className="ml-2 text-sm">{isOpen ? "▼" : "▶"}</span> : null}
              </button>

              {hasChildren && isOpen ? (
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
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
