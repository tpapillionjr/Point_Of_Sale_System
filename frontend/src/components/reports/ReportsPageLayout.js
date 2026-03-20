import { useState } from "react";
import FilterBar from "./FilterBar";
import ReportsSidebar from "./ReportsSidebar";

export default function ReportsPageLayout({ title, description, children }) {
  const [selectedRange, setSelectedRange] = useState("7days");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ReportsSidebar />

      <div className="flex-1 p-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mb-6 text-gray-600">{description}</p>

        <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

        <div className="space-y-6">{children(selectedRange)}</div>
      </div>
    </div>
  );
}
