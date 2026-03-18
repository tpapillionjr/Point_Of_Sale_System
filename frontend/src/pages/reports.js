import { useMemo, useState } from "react";
import ReportCard from "../components/reports/ReportCard";
import ReportSection from "../components/reports/ReportSection";
import TopItemsTable from "../components/reports/TopItemsTable";
import LowInventoryTable from "../components/reports/LowInventoryTable";
import FilterBar from "../components/reports/FilterBar";
import RevenueChart from "../components/reports/RevenueChart";
import TopItemsChart from "../components/reports/TopItemsChart";
import ReportsSidebar from "../components/reports/ReportsSidebar";

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const [selectedSection, setSelectedSection] = useState("overview");
  const [selectedSubsection, setSelectedSubsection] = useState(null);

  const salesData = [
    { date: "Mar 1", revenue: 1200, orders: 42, tips: 140 },
    { date: "Mar 2", revenue: 1450, orders: 50, tips: 160 },
    { date: "Mar 3", revenue: 1325, orders: 46, tips: 145 },
    { date: "Mar 4", revenue: 1680, orders: 58, tips: 190 },
    { date: "Mar 5", revenue: 1750, orders: 61, tips: 210 },
    { date: "Mar 6", revenue: 1910, orders: 66, tips: 230 },
    { date: "Mar 7", revenue: 2430, orders: 84, tips: 290 },
    { date: "Mar 8", revenue: 2210, orders: 79, tips: 250 },
    { date: "Mar 9", revenue: 1880, orders: 68, tips: 215 },
    { date: "Mar 10", revenue: 2055, orders: 73, tips: 220 },
    { date: "Mar 11", revenue: 2140, orders: 75, tips: 235 },
    { date: "Mar 12", revenue: 2265, orders: 80, tips: 245 },
    { date: "Mar 13", revenue: 2380, orders: 82, tips: 265 },
    { date: "Mar 14", revenue: 2525, orders: 88, tips: 295 },
    { date: "Mar 15", revenue: 2610, orders: 90, tips: 310 },
    { date: "Mar 16", revenue: 2490, orders: 86, tips: 285 },
    { date: "Mar 17", revenue: 2700, orders: 94, tips: 325 },
    { date: "Mar 18", revenue: 2550, orders: 89, tips: 300 },
    { date: "Mar 19", revenue: 2440, orders: 83, tips: 278 },
    { date: "Mar 20", revenue: 2635, orders: 91, tips: 315 },
    { date: "Mar 21", revenue: 2800, orders: 97, tips: 340 },
    { date: "Mar 22", revenue: 2745, orders: 95, tips: 330 },
    { date: "Mar 23", revenue: 2680, orders: 92, tips: 320 },
    { date: "Mar 24", revenue: 2595, orders: 88, tips: 302 },
    { date: "Mar 25", revenue: 2720, orders: 93, tips: 318 },
    { date: "Mar 26", revenue: 2815, orders: 96, tips: 336 },
    { date: "Mar 27", revenue: 2890, orders: 99, tips: 348 },
    { date: "Mar 28", revenue: 2950, orders: 101, tips: 355 },
    { date: "Mar 29", revenue: 3010, orders: 104, tips: 367 },
    { date: "Mar 30", revenue: 3125, orders: 108, tips: 380 },
  ];

  const topItems = [
    { name: "Hashbrowns", sold: 120, revenue: 540.0 },
    { name: "Waffle", sold: 95, revenue: 665.0 },
    { name: "Coffee", sold: 88, revenue: 220.0 },
    { name: "Bacon Plate", sold: 73, revenue: 730.0 },
    { name: "Texas Toast", sold: 60, revenue: 180.0 },
  ];

  const lowInventory = [
    { itemName: "Eggs", amountAvailable: 4, status: "Low" },
    { itemName: "Syrup", amountAvailable: 2, status: "Low" },
    { itemName: "Bacon", amountAvailable: 1, status: "Critical" },
  ];

  const laborData = [
    { name: "Alice", scheduled: 40, worked: 38, clockIns: 5, performance: "Strong" },
    { name: "Brian", scheduled: 35, worked: 36, clockIns: 5, performance: "Good" },
    { name: "Carla", scheduled: 30, worked: 28, clockIns: 4, performance: "Average" },
  ];

  const clockData = [
    { name: "Alice", lastClockIn: "7:00 AM", lastClockOut: "3:10 PM", status: "Clocked Out" },
    { name: "Brian", lastClockIn: "8:00 AM", lastClockOut: "4:02 PM", status: "Clocked Out" },
    { name: "Carla", lastClockIn: "6:55 AM", lastClockOut: "—", status: "Clocked In" },
  ];

  const operationalData = [
    { label: "Voids", value: 8 },
    { label: "Discounts", value: 14 },
    { label: "Refunds", value: 3 },
    { label: "Cash Payments", value: 42 },
    { label: "Card Payments", value: 96 },
  ];

  const voidData = [
    { order: "A102", reason: "Wrong item", employee: "Alice", amount: "$12.50" },
    { order: "A118", reason: "Customer canceled", employee: "Brian", amount: "$8.99" },
    { order: "A126", reason: "Duplicate ticket", employee: "Carla", amount: "$16.25" },
  ];

  const discountData = [
    { type: "Promo", count: 6, amount: "$42.00" },
    { type: "Manager Comp", count: 4, amount: "$58.00" },
    { type: "Employee Meal", count: 4, amount: "$29.00" },
  ];

  const refundData = [
    { order: "R201", reason: "Order error", amount: "$14.99", status: "Approved" },
    { order: "R214", reason: "Wrong charge", amount: "$9.50", status: "Approved" },
    { order: "R219", reason: "Customer complaint", amount: "$21.25", status: "Pending Review" },
  ];

  const paymentMethodData = [
    { method: "Cash", count: 42, amount: "$1,240.00" },
    { method: "Card", count: 96, amount: "$3,890.00" },
  ];

  const customerData = [
    { label: "Loyalty Signups", value: 22 },
    { label: "Repeat Customers", value: 48 },
    { label: "Most Common Order", value: "Waffle Combo" },
  ];

  const customerHabitData = [
    { label: "Most Common Order", value: "Waffle Combo" },
    { label: "Most Common Time", value: "8:00 AM - 10:00 AM" },
    { label: "Average Party Size", value: "2.6" },
  ];

  const loyaltyData = [
    { label: "New Loyalty Signups", value: 22 },
    { label: "Points Redeemed", value: 185 },
    { label: "Active Loyalty Members", value: 71 },
  ];

  const repeatCustomerData = [
    { name: "Customer #104", visits: 8, favorite: "Hashbrowns" },
    { name: "Customer #217", visits: 6, favorite: "Coffee" },
    { name: "Customer #318", visits: 5, favorite: "Waffle Combo" },
  ];

  const filteredSalesData = useMemo(() => {
    if (selectedRange === "today") return salesData.slice(-1);
    if (selectedRange === "7days") return salesData.slice(-7);
    return salesData.slice(-30);
  }, [selectedRange]);

  const summaryData = useMemo(() => {
    const totalRevenue = filteredSalesData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = filteredSalesData.reduce((sum, day) => sum + day.orders, 0);
    const totalTips = filteredSalesData.reduce((sum, day) => sum + day.tips, 0);
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return [
      { title: "Revenue", value: `$${totalRevenue.toFixed(2)}` },
      { title: "Orders", value: totalOrders.toString() },
      { title: "Average Order", value: `$${averageOrder.toFixed(2)}` },
      { title: "Tips", value: `$${totalTips.toFixed(2)}` },
    ];
  }, [filteredSalesData]);

  const todaySummary = useMemo(() => {
    const todayData = salesData.slice(-1);
    const revenue = todayData.reduce((sum, day) => sum + day.revenue, 0);
    const orders = todayData.reduce((sum, day) => sum + day.orders, 0);
    const tips = todayData.reduce((sum, day) => sum + day.tips, 0);

    return [
      { title: "Today Revenue", value: `$${revenue.toFixed(2)}` },
      { title: "Today Orders", value: orders.toString() },
      { title: "Today Tips", value: `$${tips.toFixed(2)}` },
    ];
  }, [salesData]);

  const weeklySummary = useMemo(() => {
    const weeklyData = salesData.slice(-7);
    const revenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0);
    const orders = weeklyData.reduce((sum, day) => sum + day.orders, 0);
    const tips = weeklyData.reduce((sum, day) => sum + day.tips, 0);

    return [
      { title: "Weekly Revenue", value: `$${revenue.toFixed(2)}` },
      { title: "Weekly Orders", value: orders.toString() },
      { title: "Weekly Tips", value: `$${tips.toFixed(2)}` },
    ];
  }, [salesData]);

  const monthlySummary = useMemo(() => {
    const monthlyData = salesData.slice(-30);
    const revenue = monthlyData.reduce((sum, day) => sum + day.revenue, 0);
    const orders = monthlyData.reduce((sum, day) => sum + day.orders, 0);
    const tips = monthlyData.reduce((sum, day) => sum + day.tips, 0);

    return [
      { title: "Monthly Revenue", value: `$${revenue.toFixed(2)}` },
      { title: "Monthly Orders", value: orders.toString() },
      { title: "Monthly Tips", value: `$${tips.toFixed(2)}` },
    ];
  }, [salesData]);

  function renderOverview() {
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

  function renderSalesSubsection() {
  switch (selectedSubsection) {
    case "sales-daily":
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

    case "sales-weekly":
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

    case "sales-monthly":
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

    case "sales-item":
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

    case "sales-category":
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

    case "sales-server":
      return (
        <ReportSection title="Sales by Server">
          <div className="space-y-3 text-gray-700">
            <p>Alice: $2,450.00</p>
            <p>Brian: $2,180.00</p>
            <p>Carla: $1,970.00</p>
          </div>
        </ReportSection>
      );

    case "sales-tips":
      return (
        <ReportSection title="Tips">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportCard
              title="Total Tips"
              value={`$${filteredSalesData.reduce((sum, day) => sum + day.tips, 0).toFixed(2)}`}
            />
            <ReportCard
              title="Average Daily Tips"
              value={`$${(
                filteredSalesData.reduce((sum, day) => sum + day.tips, 0) /
                filteredSalesData.length
              ).toFixed(2)}`}
            />
          </div>
        </ReportSection>
      );

    default:
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
}

  function renderLaborSubsection() {
    switch (selectedSubsection) {
      case "labor-performance":
        return (
          <ReportSection title="Employee Performance">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Scheduled Hours</th>
                    <th className="py-2 pr-4">Actual Hours</th>
                    <th className="py-2 pr-4">Clock-Ins</th>
                    <th className="py-2 pr-4">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {laborData.map((employee) => (
                    <tr key={employee.name} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
                      <td className="py-3 pr-4">{employee.scheduled}</td>
                      <td className="py-3 pr-4">{employee.worked}</td>
                      <td className="py-3 pr-4">{employee.clockIns}</td>
                      <td className="py-3 pr-4">{employee.performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      case "labor-clock":
        return (
          <ReportSection title="Clock In / Out">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Last Clock In</th>
                    <th className="py-2 pr-4">Last Clock Out</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clockData.map((employee) => (
                    <tr key={employee.name} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
                      <td className="py-3 pr-4">{employee.lastClockIn}</td>
                      <td className="py-3 pr-4">{employee.lastClockOut}</td>
                      <td className="py-3 pr-4">{employee.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      case "labor-hours":
        return (
          <ReportSection title="Scheduled vs Actual Hours">
            <div className="space-y-4">
              {laborData.map((employee) => (
                <div
                  key={employee.name}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <p className="font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-gray-600">Scheduled: {employee.scheduled} hrs</p>
                  <p className="text-gray-600">Worked: {employee.worked} hrs</p>
                  <p className="text-gray-600">
                    Difference: {employee.worked - employee.scheduled} hrs
                  </p>
                </div>
              ))}
            </div>
          </ReportSection>
        );

      default:
        return (
          <ReportSection title="Labor Reports">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Scheduled Hours</th>
                    <th className="py-2 pr-4">Actual Hours</th>
                    <th className="py-2 pr-4">Clock-Ins</th>
                    <th className="py-2 pr-4">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {laborData.map((employee) => (
                    <tr key={employee.name} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{employee.name}</td>
                      <td className="py-3 pr-4">{employee.scheduled}</td>
                      <td className="py-3 pr-4">{employee.worked}</td>
                      <td className="py-3 pr-4">{employee.clockIns}</td>
                      <td className="py-3 pr-4">{employee.performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );
    }
  }

  function renderInventorySubsection() {
    switch (selectedSubsection) {
      case "inventory-top":
        return (
          <ReportSection title="Top Selling Items">
            <TopItemsTable items={topItems} />
          </ReportSection>
        );

      case "inventory-stock":
        return (
          <ReportSection title="Stock Levels">
            <LowInventoryTable items={lowInventory} />
          </ReportSection>
        );

      case "inventory-usage":
        return (
          <ReportSection title="Ingredient Usage">
            <div className="space-y-3 text-gray-700">
              <p>Eggs used: 120</p>
              <p>Bacon used: 84</p>
              <p>Syrup used: 46</p>
            </div>
          </ReportSection>
        );

      case "inventory-waste":
        return (
          <ReportSection title="Waste Reduction">
            <div className="space-y-3 text-gray-700">
              <p>High waste item: Bacon</p>
              <p>Most efficient item: Coffee</p>
              <p>Suggested reorder priority: Eggs, Syrup</p>
            </div>
          </ReportSection>
        );

      default:
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
  }

  function renderOperationsSubsection() {
    switch (selectedSubsection) {
      case "operations-voids":
        return (
          <ReportSection title="Voids">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {voidData.map((item) => (
                    <tr key={item.order} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
                      <td className="py-3 pr-4">{item.reason}</td>
                      <td className="py-3 pr-4">{item.employee}</td>
                      <td className="py-3 pr-4">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      case "operations-discounts":
        return (
          <ReportSection title="Discounts">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Count</th>
                    <th className="py-2 pr-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {discountData.map((item) => (
                    <tr key={item.type} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{item.type}</td>
                      <td className="py-3 pr-4">{item.count}</td>
                      <td className="py-3 pr-4">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      case "operations-refunds":
        return (
          <ReportSection title="Refunds">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refundData.map((item) => (
                    <tr key={item.order} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{item.order}</td>
                      <td className="py-3 pr-4">{item.reason}</td>
                      <td className="py-3 pr-4">{item.amount}</td>
                      <td className="py-3 pr-4">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      case "operations-payments":
        return (
          <ReportSection title="Payment Methods">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paymentMethodData.map((item) => (
                <div
                  key={item.method}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <p className="font-semibold text-gray-900">{item.method}</p>
                  <p className="text-gray-600">Transactions: {item.count}</p>
                  <p className="text-gray-600">Amount: {item.amount}</p>
                </div>
              ))}
            </div>
          </ReportSection>
        );

      default:
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
  }

  function renderCustomerSubsection() {
    switch (selectedSubsection) {
      case "customer-habits":
        return (
          <ReportSection title="Ordering Habits">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {customerHabitData.map((item) => (
                <ReportCard key={item.label} title={item.label} value={item.value} />
              ))}
            </div>
          </ReportSection>
        );

      case "customer-loyalty":
        return (
          <ReportSection title="Loyalty Usage">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {loyaltyData.map((item) => (
                <ReportCard key={item.label} title={item.label} value={item.value} />
              ))}
            </div>
          </ReportSection>
        );

      case "customer-repeat":
        return (
          <ReportSection title="Repeat Customers">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Visits</th>
                    <th className="py-2 pr-4">Favorite Item</th>
                  </tr>
                </thead>
                <tbody>
                  {repeatCustomerData.map((customer) => (
                    <tr key={customer.name} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{customer.name}</td>
                      <td className="py-3 pr-4">{customer.visits}</td>
                      <td className="py-3 pr-4">{customer.favorite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        );

      default:
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
  }

  function renderSection() {
    switch (selectedSection) {
      case "overview":
        return renderOverview();
      case "sales":
        return renderSalesSubsection();
      case "labor":
        return renderLaborSubsection();
      case "inventory":
        return renderInventorySubsection();
      case "operations":
        return renderOperationsSubsection();
      case "customer":
        return renderCustomerSubsection();
      default:
        return renderOverview();
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ReportsSidebar
        selectedSection={selectedSection}
        selectedSubsection={selectedSubsection}
        onSectionChange={setSelectedSection}
        onSubsectionChange={setSelectedSubsection}
      />

      <div className="flex-1 p-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Reports Dashboard</h1>

        <p className="mb-6 text-gray-600">
          View restaurant performance, sales, labor, inventory, operations, and customer trends.
        </p>

        <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

        <div className="space-y-6">{renderSection()}</div>
      </div>
    </div>
  );
}