import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import {
  OperationsDiscountsSection,
  OperationsOverviewSection,
  OperationsPaymentsSection,
  OperationsRefundsSection,
  OperationsVoidsSection,
} from "../../../components/reports/ReportPageSections";

const viewOptions = [
  { id: "overview", label: "Overview" },
  { id: "voids", label: "Voids" },
  { id: "discounts", label: "Discounts" },
  { id: "refunds", label: "Refunds" },
  { id: "payments", label: "Payments" },
];

export default function OperationsReportsPage() {
  return (
    <ReportsPageLayout
      title="Operational Reports"
      description="Review voids, discounts, refunds, and payment mix."
      viewOptions={viewOptions}
      defaultView="overview"
    >
      {(selectedRange, selectedView) => {
        switch (selectedView) {
          case "voids":
            return <OperationsVoidsSection selectedRange={selectedRange} />;
          case "discounts":
            return <OperationsDiscountsSection selectedRange={selectedRange} />;
          case "refunds":
            return <OperationsRefundsSection selectedRange={selectedRange} />;
          case "payments":
            return <OperationsPaymentsSection selectedRange={selectedRange} />;
          default:
            return <OperationsOverviewSection selectedRange={selectedRange} />;
        }
      }}
    </ReportsPageLayout>
  );
}
