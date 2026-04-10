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
      {(selectedRange, selectedView, searchTerm) => {
        switch (selectedView) {
          case "trend":
            return <SalesOverviewSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "items":
            return <SalesItemsSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "categories":
            return <SalesCategoriesSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "servers":
            return <SalesServersSection selectedRange={selectedRange} searchTerm={searchTerm} />;
          case "tips":
            return <SalesTipsSection selectedRange={selectedRange} />;
          default:
            return <SalesOverviewSection selectedRange={selectedRange} searchTerm={searchTerm} />;
        }
      }}
    </ReportsPageLayout>
  );
}
