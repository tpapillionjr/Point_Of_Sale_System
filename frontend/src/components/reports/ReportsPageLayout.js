import { useState } from "react";
import { useRouter } from "next/router";
import FilterBar from "./FilterBar";

const sectionOptions = [
  { value: "/reports", label: "Overview Dashboard" },
  { value: "/reports/sales", label: "Sales Reports" },
  { value: "/reports/labor", label: "Labor Reports" },
  { value: "/reports/inventory", label: "Inventory & Menu" },
  { value: "/reports/operations", label: "Operational Reports" },
  { value: "/reports/customer", label: "Customer Behavior" },
];

function buildActiveSummary(filters) {
  if (filters.startDate || filters.endDate) {
    const start = filters.startDate || "beginning";
    const end = filters.endDate || "today";
    return `${start} to ${end}`;
  }

  const dayLabel = filters.days || "7";
  return `Last ${dayLabel} day${dayLabel === "1" ? "" : "s"}`;
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
  const [draftFilters, setDraftFilters] = useState({
    mode: "days",
    days: "7",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    days: "7",
  });
  const resolvedSelectedView = viewOptions.some((option) => option.id === selectedView)
    ? selectedView
    : fallbackView;

  function applyFilters() {
    if (draftFilters.mode === "dates") {
      setAppliedFilters({
        startDate: draftFilters.startDate,
        endDate: draftFilters.endDate,
      });
      return;
    }

    setAppliedFilters({
      days: draftFilters.days || "7",
    });
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
          onApply={applyFilters}
          activeSummary={buildActiveSummary(appliedFilters)}
        />

        <div className="space-y-6">{children(appliedFilters, resolvedSelectedView)}</div>
      </div>
    </div>
  );
}
