import { useEffect, useState } from "react";
import ReportCard from "./ReportCard";
import ReportSection from "./ReportSection";
import TopItemsTable from "./TopItemsTable";
import LowInventoryTable from "./LowInventoryTable";
import RevenueChart from "./RevenueChart";
import TopItemsChart from "./TopItemsChart";
import { getReportsDashboard } from "../../lib/api";

function SimpleTable({ headers, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            {headers.map((header) => (
              <th key={header} className="py-2 pr-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="text-sm text-gray-600">{message}</p>;
}

function ErrorState({ message }) {
  return <p className="text-sm text-red-600">{message}</p>;
}

function matchesSearch(value, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase());
}

function filterBySearch(rows, searchTerm, fields) {
  if (!searchTerm) {
    return rows;
  }

  return rows.filter((row) => fields.some((field) => matchesSearch(row[field], searchTerm)));
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <ReportCard key={index} title="Loading" value="..." />
      ))}
    </div>
  );
}

function useReportsData(selectedRange = "7days") {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setIsLoading(true);
        const payload = await getReportsDashboard(selectedRange);
        if (!isMounted) {
          return;
        }

        setData(payload);
        setError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "Failed to fetch reports data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  return { data, isLoading, error };
}

function RenderCardList({ cards, isLoading, error, emptyMessage }) {
  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingCards />;
  }

  if (!cards?.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <ReportCard key={card.title ?? card.label} title={card.title ?? card.label} value={card.value} />
      ))}
    </div>
  );
}

export function ReportsOverviewSection({ selectedRange, searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);
  const filteredLowInventory = filterBySearch(data?.lowInventory ?? [], searchTerm, ["itemName", "status"]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Revenue Trend">
          {error ? (
            <ErrorState message={error} />
          ) : data?.revenueTrend?.length ? (
            <RevenueChart data={data.revenueTrend} />
          ) : (
            <EmptyState message={isLoading ? "Loading revenue trend..." : "No revenue data available."} />
          )}
        </ReportSection>

        <ReportSection title="Top Selling Items">
          {error ? (
            <ErrorState message={error} />
          ) : filteredTopItems.length ? (
            <TopItemsChart items={filteredTopItems} />
          ) : (
            <EmptyState message={isLoading ? "Loading top items..." : "No item sales data available."} />
          )}
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Top Selling Items Table">
          {error ? (
            <ErrorState message={error} />
          ) : filteredTopItems.length ? (
            <TopItemsTable items={filteredTopItems} />
          ) : (
            <EmptyState message={isLoading ? "Loading top items..." : "No top-selling items are available."} />
          )}
        </ReportSection>

        <ReportSection title="Low Inventory">
          {error ? (
            <ErrorState message={error} />
          ) : filteredLowInventory.length ? (
            <LowInventoryTable items={filteredLowInventory} />
          ) : (
            <EmptyState message={isLoading ? "Loading inventory..." : "No low inventory alerts are active."} />
          )}
        </ReportSection>
      </div>
    </>
  );
}

export function SalesOverviewSection({ selectedRange, searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);

  return (
    <>
      <ReportSection title="Revenue Trend">
        {error ? (
          <ErrorState message={error} />
        ) : data?.revenueTrend?.length ? (
          <RevenueChart data={data.revenueTrend} />
        ) : (
          <EmptyState message={isLoading ? "Loading revenue trend..." : "No revenue trend is available."} />
        )}
      </ReportSection>

      <ReportSection title="Top Selling Items">
        {error ? (
          <ErrorState message={error} />
        ) : filteredTopItems.length ? (
          <TopItemsTable items={filteredTopItems} />
        ) : (
          <EmptyState message={isLoading ? "Loading top items..." : "No item sales data available."} />
        )}
      </ReportSection>
    </>
  );
}

export function SalesDailySection() {
  const { data, isLoading, error } = useReportsData("today");

  return (
    <>
      <ReportSection title="Daily Revenue">
        {error ? (
          <ErrorState message={error} />
        ) : data?.revenueTrend?.length ? (
          <RevenueChart data={data.revenueTrend} />
        ) : (
          <EmptyState message={isLoading ? "Loading daily revenue..." : "No daily revenue data available."} />
        )}
      </ReportSection>

      <ReportSection title="Daily Summary">
        <RenderCardList
          cards={data?.todaySummary}
          isLoading={isLoading}
          error={error}
          emptyMessage="No daily summary is available."
        />
      </ReportSection>
    </>
  );
}

export function SalesWeeklySection() {
  const { data, isLoading, error } = useReportsData("7days");

  return (
    <>
      <ReportSection title="Weekly Revenue">
        {error ? (
          <ErrorState message={error} />
        ) : data?.revenueTrend?.length ? (
          <RevenueChart data={data.revenueTrend} />
        ) : (
          <EmptyState message={isLoading ? "Loading weekly revenue..." : "No weekly revenue data available."} />
        )}
      </ReportSection>

      <ReportSection title="Weekly Summary">
        <RenderCardList
          cards={data?.weeklySummary}
          isLoading={isLoading}
          error={error}
          emptyMessage="No weekly summary is available."
        />
      </ReportSection>
    </>
  );
}

export function SalesMonthlySection() {
  const { data, isLoading, error } = useReportsData("30days");

  return (
    <>
      <ReportSection title="Monthly Revenue">
        {error ? (
          <ErrorState message={error} />
        ) : data?.revenueTrend?.length ? (
          <RevenueChart data={data.revenueTrend} />
        ) : (
          <EmptyState message={isLoading ? "Loading monthly revenue..." : "No monthly revenue data available."} />
        )}
      </ReportSection>

      <ReportSection title="Monthly Summary">
        <RenderCardList
          cards={data?.monthlySummary}
          isLoading={isLoading}
          error={error}
          emptyMessage="No monthly summary is available."
        />
      </ReportSection>
    </>
  );
}

export function SalesItemsSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);

  return (
    <>
      <ReportSection title="Sales by Item Chart">
        {error ? (
          <ErrorState message={error} />
        ) : filteredTopItems.length ? (
          <TopItemsChart items={filteredTopItems} />
        ) : (
          <EmptyState message={isLoading ? "Loading item sales..." : "No item sales data available."} />
        )}
      </ReportSection>
      <ReportSection title="Sales by Item Table">
        {error ? (
          <ErrorState message={error} />
        ) : filteredTopItems.length ? (
          <TopItemsTable items={filteredTopItems} />
        ) : (
          <EmptyState message={isLoading ? "Loading item sales..." : "No item sales data available."} />
        )}
      </ReportSection>
    </>
  );
}

export function SalesCategoriesSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredCategories = filterBySearch(data?.salesCategories ?? [], searchTerm, ["category"]);

  return (
    <ReportSection title="Sales by Category">
      {error ? (
        <ErrorState message={error} />
      ) : filteredCategories.length ? (
        <div className="space-y-3 text-gray-700">
          {filteredCategories.map((item) => (
            <p key={item.category}>
              {item.category}: ${item.revenue.toFixed(2)}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading category sales..." : "No category sales data available."} />
      )}
    </ReportSection>
  );
}

export function SalesServersSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredServers = filterBySearch(data?.salesServers ?? [], searchTerm, ["name"]);

  return (
    <ReportSection title="Sales by Server">
      {error ? (
        <ErrorState message={error} />
      ) : filteredServers.length ? (
        <div className="space-y-3 text-gray-700">
          {filteredServers.map((item) => (
            <p key={item.name}>
              {item.name}: ${item.revenue.toFixed(2)} ({item.orders} orders)
            </p>
          ))}
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading server sales..." : "No server sales data available."} />
      )}
    </ReportSection>
  );
}

export function SalesTipsSection({ selectedRange }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Tips">
      {error ? (
        <ErrorState message={error} />
      ) : isLoading ? (
        <EmptyState message="Loading tip data..." />
      ) : (
        <SimpleTable
          headers={["Metric", "Value"]}
          rows={[
            { label: "Total Tips", value: `$${(data?.tipSummary?.totalTips ?? 0).toFixed(2)}` },
            { label: "Average Daily Tips", value: `$${(data?.tipSummary?.averageTips ?? 0).toFixed(2)}` },
          ]}
          renderRow={(item) => (
            <tr key={item.label} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.label}</td>
              <td className="py-3 pr-4">{item.value}</td>
            </tr>
          )}
        />
      )}
    </ReportSection>
  );
}

export function LaborOverviewSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredLabor = filterBySearch(data?.laborOverview ?? [], searchTerm, ["name", "performance"]);

  return (
    <ReportSection title="Labor Reports">
      {error ? (
        <ErrorState message={error} />
      ) : filteredLabor.length ? (
        <SimpleTable
          headers={["Employee", "Scheduled Hours", "Actual Hours", "Clock-Ins", "Performance"]}
          rows={filteredLabor}
          renderRow={(employee) => (
            <tr key={employee.name} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
              <td className="py-3 pr-4">{employee.scheduled}</td>
              <td className="py-3 pr-4">{employee.worked}</td>
              <td className="py-3 pr-4">{employee.clockIns}</td>
              <td className="py-3 pr-4">{employee.performance}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading labor data..." : "No labor data available."} />
      )}
    </ReportSection>
  );
}

export function LaborPerformanceSection({ selectedRange = "7days", searchTerm = "" }) {
  return <LaborOverviewSection selectedRange={selectedRange} searchTerm={searchTerm} />;
}

export function LaborClockSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredClock = filterBySearch(data?.laborClock ?? [], searchTerm, ["name", "status"]);

  return (
    <ReportSection title="Clock In / Out">
      {error ? (
        <ErrorState message={error} />
      ) : filteredClock.length ? (
        <SimpleTable
          headers={["Employee", "Last Clock In", "Last Clock Out", "Status"]}
          rows={filteredClock}
          renderRow={(employee) => (
            <tr key={employee.name} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
              <td className="py-3 pr-4">{employee.lastClockIn}</td>
              <td className="py-3 pr-4">{employee.lastClockOut}</td>
              <td className="py-3 pr-4">{employee.status}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading clock data..." : "No clock data available."} />
      )}
    </ReportSection>
  );
}

export function LaborHoursSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredLabor = filterBySearch(data?.laborOverview ?? [], searchTerm, ["name", "performance"]);

  return (
    <ReportSection title="Scheduled vs Actual Hours">
      {error ? (
        <ErrorState message={error} />
      ) : filteredLabor.length ? (
        <div className="space-y-4">
          {filteredLabor.map((employee) => (
            <div key={employee.name} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold text-gray-900">{employee.name}</p>
              <p className="text-gray-600">Scheduled: {employee.scheduled} hrs</p>
              <p className="text-gray-600">Worked: {employee.worked} hrs</p>
              <p className="text-gray-600">Difference: {(employee.worked - employee.scheduled).toFixed(1)} hrs</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading labor hours..." : "No labor hours data available."} />
      )}
    </ReportSection>
  );
}

export function InventoryOverviewSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredLowInventory = filterBySearch(data?.lowInventory ?? [], searchTerm, ["itemName", "status"]);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);

  return (
    <>
      <ReportSection title="Inventory & Menu Reports">
        {error ? (
          <ErrorState message={error} />
        ) : filteredLowInventory.length ? (
          <LowInventoryTable items={filteredLowInventory} />
        ) : (
          <EmptyState message={isLoading ? "Loading inventory..." : "No stock alerts are active."} />
        )}
      </ReportSection>
      <ReportSection title="Top Selling Items">
        {error ? (
          <ErrorState message={error} />
        ) : filteredTopItems.length ? (
          <TopItemsTable items={filteredTopItems} />
        ) : (
          <EmptyState message={isLoading ? "Loading item demand..." : "No item demand data available."} />
        )}
      </ReportSection>
    </>
  );
}

export function InventoryStockSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredLowInventory = filterBySearch(data?.lowInventory ?? [], searchTerm, ["itemName", "status"]);

  return (
    <ReportSection title="Stock Levels">
      {error ? (
        <ErrorState message={error} />
      ) : filteredLowInventory.length ? (
        <LowInventoryTable items={filteredLowInventory} />
      ) : (
        <EmptyState message={isLoading ? "Loading stock levels..." : "No stock alerts are active."} />
      )}
    </ReportSection>
  );
}

export function InventoryUsageSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredUsage = filterBySearch(data?.inventoryUsage ?? [], searchTerm, ["itemName"]);

  return (
    <ReportSection title="Ingredient Usage">
      {error ? (
        <ErrorState message={error} />
      ) : filteredUsage.length ? (
        <div className="space-y-3 text-gray-700">
          {filteredUsage.map((item) => (
            <p key={item.itemName}>
              {item.itemName} used: {item.amountUsed}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading usage data..." : "No usage data available."} />
      )}
    </ReportSection>
  );
}

export function InventoryTopItemsSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);

  return (
    <ReportSection title="Top Selling Items">
      {error ? (
        <ErrorState message={error} />
      ) : filteredTopItems.length ? (
        <TopItemsTable items={filteredTopItems} />
      ) : (
        <EmptyState message={isLoading ? "Loading top items..." : "No top items data available."} />
      )}
    </ReportSection>
  );
}

export function InventoryWasteSection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Waste Reduction">
      {error ? (
        <ErrorState message={error} />
      ) : data?.inventoryWaste ? (
        <div className="space-y-3 text-gray-700">
          <p>High waste item: {data.inventoryWaste.highWasteItem}</p>
          <p>Most efficient item: {data.inventoryWaste.mostEfficientItem}</p>
          <p>Suggested reorder priority: {data.inventoryWaste.reorderPriority}</p>
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading waste insights..." : "No waste insights are available."} />
      )}
    </ReportSection>
  );
}

export function OperationsOverviewSection({ selectedRange = "7days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Operational Reports">
      <RenderCardList
        cards={data?.operationalSummary}
        isLoading={isLoading}
        error={error}
        emptyMessage="No operational summary is available."
      />
    </ReportSection>
  );
}

export function OperationsVoidsSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredVoids = filterBySearch(data?.voids ?? [], searchTerm, ["order", "reason", "employee"]);

  return (
    <ReportSection title="Voids">
      {error ? (
        <ErrorState message={error} />
      ) : filteredVoids.length ? (
        <SimpleTable
          headers={["Order", "Reason", "Employee", "Amount"]}
          rows={filteredVoids}
          renderRow={(item) => (
            <tr key={`${item.order}-${item.reason}`} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
              <td className="py-3 pr-4">{item.reason}</td>
              <td className="py-3 pr-4">{item.employee}</td>
              <td className="py-3 pr-4">{item.amount}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading voids..." : "No voided orders were found for this range."} />
      )}
    </ReportSection>
  );
}

export function OperationsDiscountsSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredDiscounts = filterBySearch(data?.discounts ?? [], searchTerm, ["type"]);

  return (
    <ReportSection title="Discounts">
      {error ? (
        <ErrorState message={error} />
      ) : filteredDiscounts.length ? (
        <SimpleTable
          headers={["Type", "Count", "Amount"]}
          rows={filteredDiscounts}
          renderRow={(item) => (
            <tr key={item.type} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.type}</td>
              <td className="py-3 pr-4">{item.count}</td>
              <td className="py-3 pr-4">{item.amount}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading discounts..." : "No discounts were found for this range."} />
      )}
    </ReportSection>
  );
}

export function OperationsRefundsSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredRefunds = filterBySearch(data?.refunds ?? [], searchTerm, ["order", "reason", "status"]);

  return (
    <ReportSection title="Refunds">
      {error ? (
        <ErrorState message={error} />
      ) : filteredRefunds.length ? (
        <SimpleTable
          headers={["Order", "Reason", "Amount", "Status"]}
          rows={filteredRefunds}
          renderRow={(item) => (
            <tr key={`${item.order}-${item.reason}`} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
              <td className="py-3 pr-4">{item.reason}</td>
              <td className="py-3 pr-4">{item.amount}</td>
              <td className="py-3 pr-4">{item.status}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading refunds..." : "No refunds were found for this range."} />
      )}
    </ReportSection>
  );
}

export function OperationsPaymentsSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredPayments = filterBySearch(data?.paymentMethods ?? [], searchTerm, ["method"]);

  return (
    <ReportSection title="Payment Methods">
      {error ? (
        <ErrorState message={error} />
      ) : filteredPayments.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPayments.map((item) => (
            <div key={item.method} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold text-gray-900">{item.method}</p>
              <p className="text-gray-600">Transactions: {item.count}</p>
              <p className="text-gray-600">Amount: {item.amount}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={isLoading ? "Loading payment mix..." : "No payment data is available for this range."} />
      )}
    </ReportSection>
  );
}

export function CustomerOverviewSection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Customer Behavior">
      <RenderCardList
        cards={data?.customerOverview}
        isLoading={isLoading}
        error={error}
        emptyMessage="No customer overview is available."
      />
    </ReportSection>
  );
}

export function CustomerHabitsSection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Ordering Habits">
      <RenderCardList
        cards={data?.customerHabits}
        isLoading={isLoading}
        error={error}
        emptyMessage="No customer habit data is available."
      />
    </ReportSection>
  );
}

export function CustomerLoyaltySection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Loyalty Usage">
      <RenderCardList
        cards={data?.customerLoyalty}
        isLoading={isLoading}
        error={error}
        emptyMessage="No loyalty data is available."
      />
    </ReportSection>
  );
}

export function CustomerRepeatSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredCustomers = filterBySearch(data?.repeatCustomers ?? [], searchTerm, ["name", "favorite"]);

  return (
    <ReportSection title="Repeat Customers">
      {error ? (
        <ErrorState message={error} />
      ) : filteredCustomers.length ? (
        <SimpleTable
          headers={["Customer", "Visits", "Favorite Item"]}
          rows={filteredCustomers}
          renderRow={(customer) => (
            <tr key={customer.name} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{customer.name}</td>
              <td className="py-3 pr-4">{customer.visits}</td>
              <td className="py-3 pr-4">{customer.favorite}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading repeat-customer data..." : "Repeat customer tracking is not available with the current schema."} />
      )}
    </ReportSection>
  );
}
