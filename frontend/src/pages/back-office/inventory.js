import { useState } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import FilterBar from "../../components/reports/FilterBar";
import InventoryStockTable from "../../components/inventory/InventoryStockTable";
import InventoryUsageTable from "../../components/inventory/InventoryUsageTable";
import InventoryMenuCoverageTable from "../../components/inventory/InventoryMenuCoverageTable";
import ReorderQueueTable from "../../components/inventory/ReorderQueueTable";
import { getInventoryView } from "../../lib/inventoryData";

export default function InventoryPage() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const {
    summaryCards,
    usageSummary,
    alertRows,
    usageRows,
    menuCoverageRows,
    reorderRows,
  } = getInventoryView(selectedRange);

  return (
    <BackOfficeShell
      title="Inventory Dashboard"
      description="Monitor stock health, menu readiness, and ingredient usage from one manager view."
    >
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Inventory Snapshot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Usage Snapshot">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {usageSummary.map((card) => (
              <ReportCard key={card.title} title={card.title} value={card.value} />
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Purchasing Queue">
          <ReorderQueueTable items={reorderRows.slice(0, 5)} />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Stock Watchlist">
          <InventoryStockTable items={alertRows} />
        </ReportSection>

        <ReportSection title="Menu Coverage">
          <InventoryMenuCoverageTable items={menuCoverageRows.slice(0, 5)} />
        </ReportSection>
      </div>

      <ReportSection title="High Usage Items">
        <InventoryUsageTable items={usageRows.slice(0, 5)} />
      </ReportSection>
    </BackOfficeShell>
  );
}
