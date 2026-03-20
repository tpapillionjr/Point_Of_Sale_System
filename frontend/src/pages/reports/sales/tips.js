import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesTipsSection } from "../../../components/reports/ReportPageSections";

export default function SalesTipsPage() {
  return (
    <ReportsPageLayout title="Tips" description="Track total and average tips across the selected range.">
      {(selectedRange) => <SalesTipsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
