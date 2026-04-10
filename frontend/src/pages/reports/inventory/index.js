import ReportsPageLayout from "../../../components/reports/ReportsPageLayout";
import {
  InventoryOverviewSection,
  InventoryStockSection,
  InventoryTopItemsSection,
  InventoryUsageSection,
  InventoryWasteSection,
} from "../../../components/reports/ReportPageSections";

const viewOptions = [
  { id: "overview", label: "Overview" },
  { id: "stock", label: "Stock Levels" },
  { id: "usage", label: "Usage" },
  { id: "top-items", label: "Top Items" },
  { id: "waste", label: "Waste" },
];

export default function InventoryReportsPage() {
  return (
    <ReportsPageLayout
      title="Inventory & Menu Reports"
      description="Track stock health and item sales from the reporting view."
      viewOptions={viewOptions}
      defaultView="overview"
    >
      {(selectedRange, selectedView) => {
        switch (selectedView) {
          case "stock":
            return <InventoryStockSection selectedRange={selectedRange} />;
          case "usage":
            return <InventoryUsageSection selectedRange={selectedRange} />;
          case "top-items":
            return <InventoryTopItemsSection selectedRange={selectedRange} />;
          case "waste":
            return <InventoryWasteSection selectedRange={selectedRange} />;
          default:
            return <InventoryOverviewSection selectedRange={selectedRange} />;
        }
      }}
    </ReportsPageLayout>
  );
}
