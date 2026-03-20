import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesMonthlySection } from "../../../components/reports/ReportPageSections";

export default function SalesMonthlyPage() {
  return (
    <ReportsPageLayout title="Monthly Revenue" description="Review 30-day sales and order performance.">
      {() => <SalesMonthlySection />}
    </ReportsPageLayout>
  );
}
