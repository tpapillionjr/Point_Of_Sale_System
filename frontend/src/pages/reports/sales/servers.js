import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { SalesServersSection } from "../../../components/reports/ReportPageSections";

export default function SalesServersPage() {
  return (
    <ReportsPageLayout title="Sales by Server" description="Compare server-level sales performance.">
      {() => <SalesServersSection />}
    </ReportsPageLayout>
  );
}
