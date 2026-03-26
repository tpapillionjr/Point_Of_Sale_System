import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { InventoryUsageSection } from "../../../components/reports/ReportPageSections";

export default function InventoryUsagePage() {
  return (
    <ReportsPageLayout title="Ingredient Usage" description="Review key ingredient consumption trends.">
      {(selectedRange) => <InventoryUsageSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
