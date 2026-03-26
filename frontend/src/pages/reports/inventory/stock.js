import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { InventoryStockSection } from "../../../components/reports/ReportPageSections";

export default function InventoryStockPage() {
  return (
    <ReportsPageLayout title="Stock Levels" description="Review low-stock inventory items.">
      {(selectedRange) => <InventoryStockSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
