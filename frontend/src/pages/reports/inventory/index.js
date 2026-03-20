import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { InventoryOverviewSection } from "../../../components/reports/ReportPageSections";

export default function InventoryReportsPage() {
  return (
    <ReportsPageLayout
      title="Inventory & Menu Reports"
      description="Track stock health and item sales from the reporting view."
    >
      {() => <InventoryOverviewSection />}
    </ReportsPageLayout>
  );
}
