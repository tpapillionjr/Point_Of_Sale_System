import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import ReportsPageLayout from "../../components/reports/ReportsPageLayout";
import { getItemReport } from "../../lib/api";
import { MENU_CATEGORIES } from "../../lib/menuCategories";

function fmt(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function matchesSearch(value, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase());
}

function filterRows(rows, searchTerm, fields) {
  if (!searchTerm) {
    return rows;
  }

  return rows.filter((row) => fields.some((field) => matchesSearch(row[field], searchTerm)));
}

function useItemReportData(selectedRange, category) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getItemReport(selectedRange, category)
      .then((payload) => {
        if (isMounted) { setData(payload); setError(""); }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load item report.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedRange, category]);

  return { data, isLoading, error };
}

function buildSummary(items, restockItems) {
  const withSales = items.filter((item) => Number(item.unitsSold || 0) > 0);
  const rankedByPopularity = [...withSales].sort(
    (left, right) =>
      Number(right.unitsSold || 0) - Number(left.unitsSold || 0) ||
      Number(right.revenue || 0) - Number(left.revenue || 0) ||
      left.name.localeCompare(right.name)
  );
  const rankedByRevenue = [...items].sort(
    (left, right) =>
      Number(right.revenue || 0) - Number(left.revenue || 0) ||
      Number(right.unitsSold || 0) - Number(left.unitsSold || 0) ||
      left.name.localeCompare(right.name)
  );

  return {
    totalItems: items.length,
    mostPopularItem: rankedByPopularity[0] ?? null,
    leastPopularItem: rankedByPopularity.length > 1 ? rankedByPopularity[rankedByPopularity.length - 1] : rankedByPopularity[0] ?? null,
    highestRevenueItem: rankedByRevenue[0] ?? null,
    inStockItems: items.filter((item) => item.availableNow).length,
    itemsNeedingRestock: restockItems.length,
    outOfStockItems: items.filter((item) => item.stockStatus === "Out of Stock").length,
  };
}

function stockBadgeClass(status) {
  if (status === "In Stock") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Low Stock") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "Critical" || status === "Out of Stock") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function ItemReportSection({ selectedRange, searchTerm = "" }) {
  const category = typeof selectedRange === "object" ? selectedRange.menuItemType ?? "all" : "all";
  const { data, isLoading, error } = useItemReportData(selectedRange, category);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = filterRows(data?.items ?? [], searchTerm, ["name", "category", "stockStatus"]);
  const lowStockItems = filterRows(data?.lowStockItems ?? [], searchTerm, ["itemName", "menuItemName", "category", "status"]);
  const summary = buildSummary(items, lowStockItems);
  const topItems = [...items]
    .sort((left, right) => Number(right.unitsSold || 0) - Number(left.unitsSold || 0) || left.name.localeCompare(right.name))
    .slice(0, 10);
  const inStockItems = items.filter((item) => item.availableNow);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <ReportCard title="Total Items" value={String(summary.totalItems ?? 0)} />
            <ReportCard
              title="Most Popular"
              value={summary.mostPopularItem ? `${summary.mostPopularItem.name} (${summary.mostPopularItem.unitsSold} sold)` : "No data"}
            />
            <ReportCard
              title="Least Popular"
              value={summary.leastPopularItem ? `${summary.leastPopularItem.name} (${summary.leastPopularItem.unitsSold} sold)` : "No data"}
            />
            <ReportCard
              title="Highest Revenue"
              value={summary.highestRevenueItem ? `${summary.highestRevenueItem.name} (${fmt(summary.highestRevenueItem.revenue)})` : "No data"}
            />
            <ReportCard
              title="Items In Stock"
              value={String(summary.inStockItems ?? 0)}
            />
            <ReportCard
              title="Need Restocking"
              value={String(summary.itemsNeedingRestock ?? 0)}
            />
          </div>

          <ReportSection title="Top 10 Items by Units Sold">
            {topItems.length === 0 ? (
              <p className="text-sm text-slate-500">No sales data for selected range.</p>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={topItems}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 80, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v, name) => [v, name === "unitsSold" ? "Units Sold" : name]} />
                    <Bar dataKey="unitsSold" fill="#2563eb" radius={[0, 4, 4, 0]} name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ReportSection>

          <ReportSection title="All Menu Items">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Menu Item Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Base Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Units Sold</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Revenue</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">No items found</td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.name} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="px-4 py-3 text-slate-500">{row.category}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{fmt(row.basePrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">{row.unitsSold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(row.revenue)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.stock}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockBadgeClass(row.stockStatus)}`}>
                            {row.stockStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <ReportSection title="Items In Stock">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Item</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Menu Item Type</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Units Sold</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No in-stock items found</td>
                      </tr>
                    ) : (
                      inStockItems.map((row) => (
                        <tr key={row.name} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                          <td className="px-4 py-3 text-slate-500">{row.category}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.stock}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">{row.unitsSold}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockBadgeClass(row.stockStatus)}`}>
                              {row.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection title="Needs Restocking">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Inventory Item</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Menu Item</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Menu Item Type</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No restock alerts</td>
                      </tr>
                    ) : (
                      lowStockItems.map((row) => (
                        <tr key={row.itemName} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.itemName}</td>
                          <td className="px-4 py-3 text-slate-700">{row.menuItemName}</td>
                          <td className="px-4 py-3 text-slate-500">{row.category}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.stock}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockBadgeClass(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          </div>
        </>
      )}
    </div>
  );
}

export default function ItemReportPage() {
  return (
    <ReportsPageLayout
      title="Menu Report"
      description="Track menu item performance, popularity, and inventory stock levels."
      extraFilters={[
        {
          id: "menuItemType",
          label: "Menu Item Type",
          ariaLabel: "Menu Item Type",
          defaultValue: "all",
          options: [
            { value: "all", label: "All Types" },
            ...MENU_CATEGORIES.map((category) => ({ value: category, label: category })),
            { value: "Uncategorized", label: "Uncategorized" },
          ],
        },
      ]}
    >
      {(selectedRange, _selectedView, searchTerm) => (
        <ItemReportSection selectedRange={selectedRange} searchTerm={searchTerm} />
      )}
    </ReportsPageLayout>
  );
}
