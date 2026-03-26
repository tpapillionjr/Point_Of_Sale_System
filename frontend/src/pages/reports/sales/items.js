import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesItemsSection } from "../../../components/reports/ReportPageSections";

export default function SalesItemsPage() {
  return (
    <ReportsPageLayout title="Sales by Item" description="Compare top-selling menu items and item revenue.">
      {(selectedRange) => <SalesItemsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
