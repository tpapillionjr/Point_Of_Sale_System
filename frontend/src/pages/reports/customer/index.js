import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { CustomerOverviewSection } from "../../../components/reports/ReportPageSections";

export default function CustomerReportsPage() {
  return (
    <ReportsPageLayout
      title="Customer Behavior"
      description="Review loyalty, repeat traffic, and order habits."
    >
      {(selectedRange) => <CustomerOverviewSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
