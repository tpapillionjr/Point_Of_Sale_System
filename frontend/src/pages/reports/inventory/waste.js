import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { InventoryWasteSection } from "../../../components/reports/ReportPageSections";

export default function InventoryWastePage() {
  return (
    <ReportsPageLayout title="Waste Reduction" description="Review waste-related inventory insights.">
      {() => <InventoryWasteSection />}
    </ReportsPageLayout>
  );
}
