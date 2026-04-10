import ReportsPageLayout from "../../components/reports/ReportsPageLayout";
import { ReportsOverviewSection } from "../../components/reports/ReportPageSections";

export default function ReportsHomePage() {
  return (
    <ReportsPageLayout
      title="Reports Dashboard"
      description="View restaurant performance, sales, labor, inventory, operations, and customer trends."
    >
      {(selectedRange, _selectedView, searchTerm) => (
        <ReportsOverviewSection selectedRange={selectedRange} searchTerm={searchTerm} />
      )}
    </ReportsPageLayout>
  );
}
