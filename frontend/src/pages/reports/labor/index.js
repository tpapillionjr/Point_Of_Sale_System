import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import {
  LaborClockSection,
  LaborHoursSection,
  LaborOverviewSection,
  LaborPerformanceSection,
} from "../../../components/reports/ReportPageSections";

const viewOptions = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "clock", label: "Clock Status" },
  { id: "hours", label: "Hours" },
];

export default function LaborReportsPage() {
  return (
    <ReportsPageLayout
      title="Labor Reports"
      description="Monitor employee performance, attendance, and scheduled versus actual hours."
      viewOptions={viewOptions}
      defaultView="overview"
    >
      {(selectedRange, selectedView, searchTerm) => {
        switch (selectedView) {
          case "performance":
            return <LaborPerformanceSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "clock":
            return <LaborClockSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "hours":
            return <LaborHoursSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          default:
            return <LaborOverviewSection selectedRange={selectedRange} searchTerm={searchTerm} />;
        }
      }}
    </ReportsPageLayout>
  );
}
