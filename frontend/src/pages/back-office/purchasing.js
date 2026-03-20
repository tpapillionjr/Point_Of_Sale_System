import { useState } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import FilterBar from "../../components/reports/FilterBar";
import ReorderQueueTable from "../../components/inventory/ReorderQueueTable";
import { formatCurrency, getInventoryView } from "../../lib/inventoryData";

export default function PurchasingPage() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const { reorderRows, stockRows } = getInventoryView(selectedRange);

  const estimatedRefillCost = stockRows.reduce(
    (sum, item) => sum + Math.max(item.parGap, 0) * item.basePrice,
    0
  );

  return (
    <BackOfficeShell
      title="Purchasing"
      description="Prioritize reorder decisions, supplier timing, and projected refill cost."
    >
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Purchasing Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Suppliers" value="8" />
          <ReportCard title="Open Reorder Lines" value={reorderRows.length.toString()} />
          <ReportCard title="Critical Orders" value="4" />
          <ReportCard title="Projected Cost" value={formatCurrency(estimatedRefillCost)} />
        </div>
      </ReportSection>

      <ReportSection title="Recommended Reorders">
        <ReorderQueueTable items={reorderRows} />
      </ReportSection>
    </BackOfficeShell>
  );
}
