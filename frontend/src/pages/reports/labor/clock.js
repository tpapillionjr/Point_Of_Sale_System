import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { LaborClockSection } from "../../../components/reports/ReportPageSections";

export default function LaborClockPage() {
  return (
    <ReportsPageLayout title="Clock In / Out" description="Review recent clock events and status.">
      {() => <LaborClockSection />}
    </ReportsPageLayout>
  );
}
