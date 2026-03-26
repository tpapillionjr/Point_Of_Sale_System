import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { OperationsVoidsSection } from "../../../components/reports/ReportPageSections";

export default function OperationsVoidsPage() {
  return (
    <ReportsPageLayout title="Voids" description="Review voided checks and reasons.">
      {(selectedRange) => <OperationsVoidsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
