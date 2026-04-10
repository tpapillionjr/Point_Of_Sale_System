import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import {
  SalesCategoriesSection,
  SalesItemsSection,
  SalesOverviewSection,
  SalesServersSection,
  SalesTipsSection,
} from "../../../components/reports/ReportPageSections";

const viewOptions = [
  { id: "overview", label: "Overview" },
  { id: "trend", label: "Revenue Trend" },
  { id: "items", label: "Items" },
  { id: "categories", label: "Categories" },
  { id: "servers", label: "Servers" },
  { id: "tips", label: "Tips" },
];

export default function SalesReportsPage() {
  return (
    <ReportsPageLayout
      title="Sales Reports"
      description="Track revenue, orders, average ticket value, and sales performance."
      viewOptions={viewOptions}
      defaultView="overview"
    >
      {(selectedRange, selectedView) => {
        switch (selectedView) {
          case "trend":
            return <SalesOverviewSection selectedRange={selectedRange} />;
          case "items":
            return <SalesItemsSection selectedRange={selectedRange} />;
          case "categories":
            return <SalesCategoriesSection selectedRange={selectedRange} />;
          case "servers":
            return <SalesServersSection selectedRange={selectedRange} />;
          case "tips":
            return <SalesTipsSection selectedRange={selectedRange} />;
          default:
            return <SalesOverviewSection selectedRange={selectedRange} />;
        }
      }}
    </ReportsPageLayout>
  );
}
