import ReportCard from "./ReportCard";
import ReportSection from "./ReportSection";
import TopItemsTable from "./TopItemsTable";
import LowInventoryTable from "./LowInventoryTable";
import RevenueChart from "./RevenueChart";
import TopItemsChart from "./TopItemsChart";
import {
  clockData,
  customerData,
  customerHabitData,
  discountData,
  laborData,
  loyaltyData,
  lowInventory,
  operationalData,
  paymentMethodData,
  repeatCustomerData,
  salesData,
  topItems,
  voidData,
  refundData,
  getReportsView,
} from "../../lib/reportsData";

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

export function ReportsOverviewSection({ selectedRange }) {
  const { filteredSalesData, todaySummary, weeklySummary, monthlySummary } =
    getReportsView(selectedRange);

  return (
    <>
      <ReportSection title="Today Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {todaySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Weekly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {weeklySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Monthly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {monthlySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Revenue Trend">
          <RevenueChart data={filteredSalesData} />
        </ReportSection>

        <ReportSection title="Top Selling Items">
          <TopItemsChart items={topItems} />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Top Selling Items Table">
          <TopItemsTable items={topItems} />
        </ReportSection>

        <ReportSection title="Low Inventory">
          <LowInventoryTable items={lowInventory} />
        </ReportSection>
      </div>
    </>
  );
}

export function SalesOverviewSection({ selectedRange }) {
  const { filteredSalesData, summaryData } = getReportsView(selectedRange);

  return (
    <>
      <ReportSection title="Sales Reports">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryData.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Revenue Trend">
        <RevenueChart data={filteredSalesData} />
      </ReportSection>
    </>
  );
}

export function SalesDailySection() {
  const { todaySummary } = getReportsView("today");

  return (
    <>
      <ReportSection title="Daily Revenue">
        <RevenueChart data={salesData.slice(-1)} />
      </ReportSection>

      <ReportSection title="Daily Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {todaySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>
    </>
  );
}

export function SalesWeeklySection() {
  const { weeklySummary } = getReportsView("7days");

  return (
    <>
      <ReportSection title="Weekly Revenue">
        <RevenueChart data={salesData.slice(-7)} />
      </ReportSection>

      <ReportSection title="Weekly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {weeklySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>
    </>
  );
}

export function SalesMonthlySection() {
  const { monthlySummary } = getReportsView("30days");

  return (
    <>
      <ReportSection title="Monthly Revenue">
        <RevenueChart data={salesData.slice(-30)} />
      </ReportSection>

      <ReportSection title="Monthly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {monthlySummary.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>
    </>
  );
}

export function SalesItemsSection() {
  return (
    <>
      <ReportSection title="Sales by Item Chart">
        <TopItemsChart items={topItems} />
      </ReportSection>
      <ReportSection title="Sales by Item Table">
        <TopItemsTable items={topItems} />
      </ReportSection>
    </>
  );
}

export function SalesCategoriesSection() {
  return (
    <ReportSection title="Sales by Category">
      <div className="space-y-3 text-gray-700">
        <p>Breakfast: $4,820.00</p>
        <p>Drinks: $1,340.00</p>
        <p>Sides: $980.00</p>
        <p>Combos: $2,410.00</p>
      </div>
    </ReportSection>
  );
}

export function SalesServersSection() {
  return (
    <ReportSection title="Sales by Server">
      <div className="space-y-3 text-gray-700">
        <p>Alice: $2,450.00</p>
        <p>Brian: $2,180.00</p>
        <p>Carla: $1,970.00</p>
      </div>
    </ReportSection>
  );
}

export function SalesTipsSection({ selectedRange }) {
  const { totalTips, averageTips } = getReportsView(selectedRange);

  return (
    <ReportSection title="Tips">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard title="Total Tips" value={`$${totalTips.toFixed(2)}`} />
        <ReportCard title="Average Daily Tips" value={`$${averageTips.toFixed(2)}`} />
      </div>
    </ReportSection>
  );
}

export function LaborOverviewSection() {
  return (
    <ReportSection title="Labor Reports">
      <SimpleTable
        headers={["Employee", "Scheduled Hours", "Actual Hours", "Clock-Ins", "Performance"]}
        rows={laborData}
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
    </ReportSection>
  );
}

export function LaborPerformanceSection() {
  return <LaborOverviewSection />;
}

export function LaborClockSection() {
  return (
    <ReportSection title="Clock In / Out">
      <SimpleTable
        headers={["Employee", "Last Clock In", "Last Clock Out", "Status"]}
        rows={clockData}
        renderRow={(employee) => (
          <tr key={employee.name} className="border-b last:border-b-0">
            <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
            <td className="py-3 pr-4">{employee.lastClockIn}</td>
            <td className="py-3 pr-4">{employee.lastClockOut}</td>
            <td className="py-3 pr-4">{employee.status}</td>
          </tr>
        )}
      />
    </ReportSection>
  );
}

export function LaborHoursSection() {
  return (
    <ReportSection title="Scheduled vs Actual Hours">
      <div className="space-y-4">
        {laborData.map((employee) => (
          <div key={employee.name} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-gray-900">{employee.name}</p>
            <p className="text-gray-600">Scheduled: {employee.scheduled} hrs</p>
            <p className="text-gray-600">Worked: {employee.worked} hrs</p>
            <p className="text-gray-600">Difference: {employee.worked - employee.scheduled} hrs</p>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

export function InventoryOverviewSection() {
  return (
    <>
      <ReportSection title="Inventory & Menu Reports">
        <LowInventoryTable items={lowInventory} />
      </ReportSection>
      <ReportSection title="Top Selling Items">
        <TopItemsTable items={topItems} />
      </ReportSection>
    </>
  );
}

export function InventoryStockSection() {
  return (
    <ReportSection title="Stock Levels">
      <LowInventoryTable items={lowInventory} />
    </ReportSection>
  );
}

export function InventoryUsageSection() {
  return (
    <ReportSection title="Ingredient Usage">
      <div className="space-y-3 text-gray-700">
        <p>Eggs used: 120</p>
        <p>Bacon used: 84</p>
        <p>Syrup used: 46</p>
      </div>
    </ReportSection>
  );
}

export function InventoryTopItemsSection() {
  return (
    <ReportSection title="Top Selling Items">
      <TopItemsTable items={topItems} />
    </ReportSection>
  );
}

export function InventoryWasteSection() {
  return (
    <ReportSection title="Waste Reduction">
      <div className="space-y-3 text-gray-700">
        <p>High waste item: Bacon</p>
        <p>Most efficient item: Coffee</p>
        <p>Suggested reorder priority: Eggs, Syrup</p>
      </div>
    </ReportSection>
  );
}

export function OperationsOverviewSection() {
  return (
    <ReportSection title="Operational Reports">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {operationalData.map((item) => (
          <ReportCard key={item.label} title={item.label} value={item.value} />
        ))}
      </div>
    </ReportSection>
  );
}

export function OperationsVoidsSection() {
  return (
    <ReportSection title="Voids">
      <SimpleTable
        headers={["Order", "Reason", "Employee", "Amount"]}
        rows={voidData}
        renderRow={(item) => (
          <tr key={item.order} className="border-b last:border-b-0">
            <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
            <td className="py-3 pr-4">{item.reason}</td>
            <td className="py-3 pr-4">{item.employee}</td>
            <td className="py-3 pr-4">{item.amount}</td>
          </tr>
        )}
      />
    </ReportSection>
  );
}

export function OperationsDiscountsSection() {
  return (
    <ReportSection title="Discounts">
      <SimpleTable
        headers={["Type", "Count", "Amount"]}
        rows={discountData}
        renderRow={(item) => (
          <tr key={item.type} className="border-b last:border-b-0">
            <td className="py-3 pr-4 font-medium text-gray-800">{item.type}</td>
            <td className="py-3 pr-4">{item.count}</td>
            <td className="py-3 pr-4">{item.amount}</td>
          </tr>
        )}
      />
    </ReportSection>
  );
}

export function OperationsRefundsSection() {
  return (
    <ReportSection title="Refunds">
      <SimpleTable
        headers={["Order", "Reason", "Amount", "Status"]}
        rows={refundData}
        renderRow={(item) => (
          <tr key={item.order} className="border-b last:border-b-0">
            <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
            <td className="py-3 pr-4">{item.reason}</td>
            <td className="py-3 pr-4">{item.amount}</td>
            <td className="py-3 pr-4">{item.status}</td>
          </tr>
        )}
      />
    </ReportSection>
  );
}

export function OperationsPaymentsSection() {
  return (
    <ReportSection title="Payment Methods">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {paymentMethodData.map((item) => (
          <div key={item.method} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-gray-900">{item.method}</p>
            <p className="text-gray-600">Transactions: {item.count}</p>
            <p className="text-gray-600">Amount: {item.amount}</p>
          </div>
        ))}
      </div>
    </ReportSection>
  );
}

export function CustomerOverviewSection() {
  return (
    <ReportSection title="Customer Behavior">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customerData.map((item) => (
          <ReportCard key={item.label} title={item.label} value={item.value} />
        ))}
      </div>
    </ReportSection>
  );
}

export function CustomerHabitsSection() {
  return (
    <ReportSection title="Ordering Habits">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customerHabitData.map((item) => (
          <ReportCard key={item.label} title={item.label} value={item.value} />
        ))}
      </div>
    </ReportSection>
  );
}

export function CustomerLoyaltySection() {
  return (
    <ReportSection title="Loyalty Usage">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loyaltyData.map((item) => (
          <ReportCard key={item.label} title={item.label} value={item.value} />
        ))}
      </div>
    </ReportSection>
  );
}

export function CustomerRepeatSection() {
  return (
    <ReportSection title="Repeat Customers">
      <SimpleTable
        headers={["Customer", "Visits", "Favorite Item"]}
        rows={repeatCustomerData}
        renderRow={(customer) => (
          <tr key={customer.name} className="border-b last:border-b-0">
            <td className="py-3 pr-4 font-medium text-gray-800">{customer.name}</td>
            <td className="py-3 pr-4">{customer.visits}</td>
            <td className="py-3 pr-4">{customer.favorite}</td>
          </tr>
        )}
      />
    </ReportSection>
  );
}
