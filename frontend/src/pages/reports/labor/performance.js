import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { LaborPerformanceSection } from "../../../components/reports/ReportPageSections";

export default function LaborPerformancePage() {
  return (
    <ReportsPageLayout
      title="Employee Performance"
      description="Review staff productivity and scheduled versus worked hours."
    >
      {() => <LaborPerformanceSection />}
    </ReportsPageLayout>
  );
}
