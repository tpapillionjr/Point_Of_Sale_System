import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { CustomerRepeatSection } from "../../../components/reports/ReportPageSections";

export default function CustomerRepeatPage() {
  return (
    <ReportsPageLayout title="Repeat Customers" description="Review repeat-visit behavior and favorite items.">
      {(selectedRange) => <CustomerRepeatSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
