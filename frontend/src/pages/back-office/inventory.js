import { useState } from "react";
import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import FilterBar from "../../components/reports/FilterBar";
import InventoryStockTable from "../../components/inventory/InventoryStockTable";
import InventoryUsageTable from "../../components/inventory/InventoryUsageTable";
import InventoryMenuCoverageTable from "../../components/inventory/InventoryMenuCoverageTable";
import ReorderQueueTable from "../../components/inventory/ReorderQueueTable";
import { getInventoryView } from "../../lib/inventoryData";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function InventoryPage() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const {
    summaryCards,
    usageSummary,
    alertRows,
    usageRows,
    menuCoverageRows,
    reorderRows,
  } = getInventoryView(selectedRange);

  return (
    <BackOfficeShell
      title="Inventory Dashboard"
      description="Monitor stock health, menu readiness, and ingredient usage from one manager view."
    >
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Inventory Snapshot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Inventory Updates">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Ingredient">
              <Input placeholder="Applewood Bacon" />
            </Field>
            <Field label="Update Type">
              <Select defaultValue="receive">
                <option value="receive">Receive stock</option>
                <option value="adjust">Manual adjustment</option>
                <option value="waste">Waste entry</option>
                <option value="transfer">Store transfer</option>
              </Select>
            </Field>
            <Field label="Quantity">
              <Input type="number" placeholder="24" />
            </Field>
            <Field label="Unit">
              <Select defaultValue="cases">
                <option value="cases">Cases</option>
                <option value="each">Each</option>
                <option value="lb">Pounds</option>
                <option value="oz">Ounces</option>
              </Select>
            </Field>
            <Field label="New Reorder Point">
              <Input type="number" placeholder="8" />
            </Field>
            <Field label="Supplier Status">
              <Select defaultValue="in-stock">
                <option value="in-stock">In stock</option>
                <option value="limited">Limited</option>
                <option value="out">Out of stock</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Manager Note">
              <Textarea placeholder="Document the reason for the update or vendor communication." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Save Inventory Update</ActionButton>
          </div>
        </ReportSection>

        <ReportSection title="Purchasing Queue">
          <ReorderQueueTable items={reorderRows.slice(0, 5)} />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Usage Snapshot">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {usageSummary.map((card) => (
              <ReportCard key={card.title} title={card.title} value={card.value} />
            ))}
          </div>
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Stock Watchlist">
          <InventoryStockTable items={alertRows} />
        </ReportSection>

        <ReportSection title="Menu Coverage">
          <InventoryMenuCoverageTable items={menuCoverageRows.slice(0, 5)} />
        </ReportSection>
      </div>

      <ReportSection title="High Usage Items">
        <InventoryUsageTable items={usageRows.slice(0, 5)} />
      </ReportSection>
    </BackOfficeShell>
  );
}
