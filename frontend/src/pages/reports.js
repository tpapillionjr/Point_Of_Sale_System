import { useMemo, useState } from "react";
import ReportCard from "../components/reports/ReportCard";
import ReportSection from "../components/reports/ReportSection";
import TopItemsTable from "../components/reports/TopItemsTable";
import LowInventoryTable from "../components/reports/LowInventoryTable";
import FilterBar from "../components/reports/FilterBar";
import RevenueChart from "../components/reports/RevenueChart";
import TopItemsChart from "../components/reports/TopItemsChart";

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState("7days");

  // mock sales data
  const salesData = [
    { date: "Mar 1", revenue: 1200, orders: 42 },
    { date: "Mar 2", revenue: 1450, orders: 50 },
    { date: "Mar 3", revenue: 1325, orders: 46 },
    { date: "Mar 4", revenue: 1680, orders: 58 },
    { date: "Mar 5", revenue: 1750, orders: 61 },
    { date: "Mar 6", revenue: 1910, orders: 66 },
    { date: "Mar 7", revenue: 2430, orders: 84 },
    { date: "Mar 8", revenue: 2210, orders: 79 },
    { date: "Mar 9", revenue: 1880, orders: 68 },
    { date: "Mar 10", revenue: 2055, orders: 73 },
    { date: "Mar 11", revenue: 2140, orders: 75 },
    { date: "Mar 12", revenue: 2265, orders: 80 },
    { date: "Mar 13", revenue: 2380, orders: 82 },
    { date: "Mar 14", revenue: 2525, orders: 88 },
    { date: "Mar 15", revenue: 2610, orders: 90 },
    { date: "Mar 16", revenue: 2490, orders: 86 },
    { date: "Mar 17", revenue: 2700, orders: 94 },
    { date: "Mar 18", revenue: 2550, orders: 89 },
    { date: "Mar 19", revenue: 2440, orders: 83 },
    { date: "Mar 20", revenue: 2635, orders: 91 },
    { date: "Mar 21", revenue: 2800, orders: 97 },
    { date: "Mar 22", revenue: 2745, orders: 95 },
    { date: "Mar 23", revenue: 2680, orders: 92 },
    { date: "Mar 24", revenue: 2595, orders: 88 },
    { date: "Mar 25", revenue: 2720, orders: 93 },
    { date: "Mar 26", revenue: 2815, orders: 96 },
    { date: "Mar 27", revenue: 2890, orders: 99 },
    { date: "Mar 28", revenue: 2950, orders: 101 },
    { date: "Mar 29", revenue: 3010, orders: 104 },
    { date: "Mar 30", revenue: 3125, orders: 108 },
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

  const filteredSalesData = useMemo(() => {
    if (selectedRange === "today") {
      return salesData.slice(-1);
    }
    if (selectedRange === "7days") {
      return salesData.slice(-7);
    }
    return salesData.slice(-30);
  }, [selectedRange]);

  const summaryData = useMemo(() => {
    const totalRevenue = filteredSalesData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = filteredSalesData.reduce((sum, day) => sum + day.orders, 0);
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const rangeLabel =
      selectedRange === "today"
        ? "Today"
        : selectedRange === "7days"
        ? "Last 7 Days"
        : "Last 30 Days";

    return [
      { title: `Revenue (${rangeLabel})`, value: `$${totalRevenue.toFixed(2)}` },
      { title: `Orders (${rangeLabel})`, value: totalOrders.toString() },
      { title: "Average Order", value: `$${averageOrder.toFixed(2)}` },
      { title: "Low Stock Items", value: lowInventory.length.toString() },
    ];
  }, [filteredSalesData, lowInventory.length, selectedRange]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="mb-6 text-gray-600">
          View restaurant performance, revenue, inventory, and top-selling items.
        </p>

        <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryData.map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportSection title="Revenue Trend">
            <RevenueChart data={filteredSalesData} />
          </ReportSection>

          <ReportSection title="Top Selling Items Chart">
            <TopItemsChart items={topItems} />
          </ReportSection>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportSection title="Top Selling Items">
            <TopItemsTable items={topItems} />
          </ReportSection>

          <ReportSection title="Low Inventory">
            <LowInventoryTable items={lowInventory} />
          </ReportSection>
        </div>
      </div>
    </div>
  );
}