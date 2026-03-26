import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import { CustomerLoyaltySection } from "../../../components/reports/ReportPageSections";

export default function CustomerLoyaltyPage() {
  return (
    <ReportsPageLayout title="Loyalty Usage" description="Review loyalty signups and point activity.">
      {(selectedRange) => <CustomerLoyaltySection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
