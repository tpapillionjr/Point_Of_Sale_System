import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesOverviewSection } from "../../../components/reports/ReportPageSections";

export default function SalesReportsPage() {
  return (
    <ReportsPageLayout
      title="Sales Reports"
      description="Track revenue, orders, average ticket value, and sales performance."
    >
      {(selectedRange) => <SalesOverviewSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
