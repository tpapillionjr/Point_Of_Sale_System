import { useState } from "react";
import { useRouter } from "next/router";
import { getReportsDashboard } from "../../lib/api";
import FilterBar from "./FilterBar";

const sectionOptions = [
  { value: "/reports", label: "Overview Dashboard" },
  { value: "/reports/sales", label: "Sales Reports" },
  { value: "/reports/labor", label: "Labor Reports" },
  { value: "/reports/inventory", label: "Inventory & Menu" },
  { value: "/reports/operations", label: "Operational Reports" },
  { value: "/reports/customer", label: "Customer Behavior" },
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function createDefaultDateFilters() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  };
}

export default function ReportsPageLayout({
  title,
  description,
  children,
  viewOptions = [],
  defaultView,
}) {
  const router = useRouter();
  const fallbackView = defaultView ?? viewOptions[0]?.id ?? "";
  const [selectedView, setSelectedView] = useState(fallbackView);
  const [defaultFilters] = useState(createDefaultDateFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const resolvedSelectedView = viewOptions.some((option) => option.id === selectedView)
    ? selectedView
    : fallbackView;

  function applyFilters() {
    setAppliedFilters({
      startDate: draftFilters.startDate || defaultFilters.startDate,
      endDate: draftFilters.endDate || defaultFilters.endDate,
    });
  }

  async function handleExport() {
    const payload = await getReportsDashboard(appliedFilters);
    const exportPayload = {
      reportTitle: title,
      route: router.pathname,
      view: resolvedSelectedView,
      filters: appliedFilters,
      searchTerm,
      exportedAt: new Date().toISOString(),
      data: payload,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${router.pathname.split("/").filter(Boolean).join("-") || "reports"}-${resolvedSelectedView || "overview"}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Restaurant POS</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-600">{description}</p>
        </div>

        <FilterBar
          sectionOptions={sectionOptions}
          selectedSection={router.pathname}
          onSectionChange={(nextPath) => router.push(nextPath)}
          viewOptions={viewOptions.length ? viewOptions : [{ id: "", label: "Overview" }]}
          selectedView={resolvedSelectedView}
          onViewChange={setSelectedView}
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onApply={applyFilters}
          onExport={handleExport}
        />

        <div className="space-y-6">{children(appliedFilters, resolvedSelectedView, searchTerm)}</div>
      </div>
    </div>
  );
}
