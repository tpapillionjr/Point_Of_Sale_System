import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { InventoryTopItemsSection } from "../../../components/reports/ReportPageSections";

export default function InventoryTopItemsPage() {
  return (
    <ReportsPageLayout title="Top Selling Items" description="Review the top-selling items tied to inventory demand.">
      {() => <InventoryTopItemsSection />}
    </ReportsPageLayout>
  );
}
