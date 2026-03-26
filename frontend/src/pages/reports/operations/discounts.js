import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { OperationsDiscountsSection } from "../../../components/reports/ReportPageSections";

export default function OperationsDiscountsPage() {
  return (
    <ReportsPageLayout title="Discounts" description="Review discount counts and total value.">
      {(selectedRange) => <OperationsDiscountsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
