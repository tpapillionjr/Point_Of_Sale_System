import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { OperationsOverviewSection } from "../../../components/reports/ReportPageSections";

export default function OperationsReportsPage() {
  return (
    <ReportsPageLayout
      title="Operational Reports"
      description="Review voids, discounts, refunds, and payment mix."
    >
      {(selectedRange) => <OperationsOverviewSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
