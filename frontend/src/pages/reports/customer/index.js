import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import {
  CustomerHabitsSection,
  CustomerLoyaltySection,
  CustomerOverviewSection,
  CustomerRepeatSection,
} from "../../../components/reports/ReportPageSections";

const viewOptions = [
  { id: "overview", label: "Overview" },
  { id: "habits", label: "Ordering Habits" },
  { id: "loyalty", label: "Loyalty" },
  { id: "repeat", label: "Repeat Guests" },
];

export default function CustomerReportsPage() {
  return (
    <ReportsPageLayout
      title="Customer Behavior"
      description="Review loyalty, repeat traffic, and order habits."
      viewOptions={viewOptions}
      defaultView="overview"
    >
      {(selectedRange, selectedView, searchTerm) => {
        switch (selectedView) {
          case "habits":
            return <CustomerHabitsSection selectedRange={selectedRange} />;
          case "loyalty":
            return <CustomerLoyaltySection selectedRange={selectedRange} />;
          case "repeat":
            return <CustomerRepeatSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          default:
            return <CustomerOverviewSection selectedRange={selectedRange} />;
        }
      }}
    </ReportsPageLayout>
  );
}
