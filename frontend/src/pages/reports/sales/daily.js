import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesDailySection } from "../../../components/reports/ReportPageSections";

export default function SalesDailyPage() {
  return (
    <ReportsPageLayout title="Daily Revenue" description="Review the most recent daily sales snapshot.">
      {() => <SalesDailySection />}
    </ReportsPageLayout>
  );
}
