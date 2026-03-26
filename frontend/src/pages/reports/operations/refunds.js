import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { OperationsRefundsSection } from "../../../components/reports/ReportPageSections";

export default function OperationsRefundsPage() {
  return (
    <ReportsPageLayout title="Refunds" description="Review refunded payments and approval status.">
      {(selectedRange) => <OperationsRefundsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
