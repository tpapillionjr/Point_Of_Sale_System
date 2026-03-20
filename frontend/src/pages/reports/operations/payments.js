import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { OperationsPaymentsSection } from "../../../components/reports/ReportPageSections";

export default function OperationsPaymentsPage() {
  return (
    <ReportsPageLayout title="Payment Methods" description="Review cash and card transaction mix.">
      {() => <OperationsPaymentsSection />}
    </ReportsPageLayout>
  );
}
