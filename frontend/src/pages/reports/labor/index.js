import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { LaborOverviewSection } from "../../../components/reports/ReportPageSections";

export default function LaborReportsPage() {
  return (
    <ReportsPageLayout
      title="Labor Reports"
      description="Monitor employee performance, attendance, and scheduled versus actual hours."
    >
      {() => <LaborOverviewSection />}
    </ReportsPageLayout>
  );
}
