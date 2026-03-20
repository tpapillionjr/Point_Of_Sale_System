import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesWeeklySection } from "../../../components/reports/ReportPageSections";

export default function SalesWeeklyPage() {
  return (
    <ReportsPageLayout title="Weekly Revenue" description="Review weekly sales and order trends.">
      {() => <SalesWeeklySection />}
    </ReportsPageLayout>
  );
}
