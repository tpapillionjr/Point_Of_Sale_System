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

function fmt(value) {
  return `$${Number(value || 0).toFixed(2)}`;
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

function ItemReportSection({ selectedRange }) {
  const [category, setCategory] = useState("all");
  const { data, isLoading, error } = useItemReportData(selectedRange, category);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const summary = data?.summary ?? {};
  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const lowStockItems = data?.lowStockItems ?? [];

  const topItems = items.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-600">Category:</span>
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            category === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-600 border border-slate-300 hover:border-blue-400"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:border-blue-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
              title="Need Restocking"
              value={String(summary.itemsNeedingRestock ?? 0)}
            />
          </div>

          {/* Top Items Chart */}
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

          {/* Full Items Table */}
          <ReportSection title="All Menu Items">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Base Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Units Sold</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Revenue</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
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
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.inStock
                              ? row.stock <= 10
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {row.inStock ? (row.stock <= 10 ? "Low Stock" : "In Stock") : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <ReportSection title="Restock Alerts">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Inventory Item</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Menu Item</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((row) => (
                      <tr key={row.itemName} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.itemName}</td>
                        <td className="px-4 py-3 text-slate-700">{row.menuItemName}</td>
                        <td className="px-4 py-3 text-slate-500">{row.category}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.stock}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.status === "Critical"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          )}
        </>
      )}
    </div>
  );
}

export default function ItemReportPage() {
  return (
    <ReportsPageLayout
      title="Item Report"
      description="Track menu item performance, popularity, and inventory stock levels."
    >
      {(selectedRange) => <ItemReportSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
