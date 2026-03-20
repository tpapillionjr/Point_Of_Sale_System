import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import InventoryCountTable from "../../components/inventory/InventoryCountTable";
import { getInventoryView } from "../../lib/inventoryData";

export default function InventoryCountsPage() {
  const { stockRows } = getInventoryView("7days");

  return (
    <BackOfficeShell
      title="Inventory Counts"
      description="Use this page for cycle counts, count variance review, and closing shift count checks."
    >
      <ReportSection title="Count Session Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Items Counted Today" value="32" />
          <ReportCard title="Variance Flags" value="5" />
          <ReportCard title="Pending Recounts" value="2" />
          <ReportCard title="Last Full Count" value="Mar 18" />
        </div>
      </ReportSection>

      <ReportSection title="Cycle Count Sheet">
        <InventoryCountTable items={stockRows} />
      </ReportSection>
    </BackOfficeShell>
  );
}
