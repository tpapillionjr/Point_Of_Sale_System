import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesCategoriesSection } from "../../../components/reports/ReportPageSections";

export default function SalesCategoriesPage() {
  return (
    <ReportsPageLayout title="Sales by Category" description="View sales totals grouped by menu category.">
      {(selectedRange) => <SalesCategoriesSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
