import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { LaborHoursSection } from "../../../components/reports/ReportPageSections";

export default function LaborHoursPage() {
  return (
    <ReportsPageLayout
      title="Scheduled vs Actual Hours"
      description="Compare planned labor against worked hours."
    >
      {(selectedRange) => <LaborHoursSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
