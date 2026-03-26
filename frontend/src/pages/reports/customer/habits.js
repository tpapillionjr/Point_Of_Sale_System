import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { CustomerHabitsSection } from "../../../components/reports/ReportPageSections";

export default function CustomerHabitsPage() {
  return (
    <ReportsPageLayout title="Ordering Habits" description="Review common order patterns and traffic behavior.">
      {(selectedRange) => <CustomerHabitsSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
