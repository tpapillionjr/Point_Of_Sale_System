import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import ReportsPageLayout from "../../components/reports/ReportsPageLayout";
import { getRevenueReport } from "../../lib/api";

const TYPE_COLORS = {
  Dine_in: "#2563eb",
  Takeout: "#16a34a",
  Online: "#f59e0b",
};

const PAYMENT_COLORS = {
  cash: "#16a34a",
  card: "#2563eb",
};

function fmt(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function useRevenueData(selectedRange, revenueType) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getRevenueReport(selectedRange, revenueType)
      .then((payload) => {
        if (isMounted) { setData(payload); setError(""); }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load revenue report.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedRange, revenueType]);

  return { data, isLoading, error };
}

function RevenueReportSection({ selectedRange }) {
  const [revenueType, setRevenueType] = useState("all");
  const { data, isLoading, error } = useRevenueData(selectedRange, revenueType);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const summary = data?.summary ?? {};
  const trend = data?.trend ?? [];
  const byOrderType = data?.byOrderType ?? [];
  const byPaymentMethod = data?.byPaymentMethod ?? [];

  return (
    <div className="space-y-8">
      {/* Revenue Type Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-600">Filter by type:</span>
        {[
          { value: "all", label: "All" },
          { value: "dine_in", label: "Dine-in" },
          { value: "takeout", label: "Takeout" },
          { value: "online", label: "Online" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRevenueType(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              revenueType === opt.value
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:border-blue-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ReportCard title="Total Revenue" value={fmt(summary.totalRevenue)} />
            <ReportCard title="Total Orders" value={String(summary.totalOrders ?? 0)} />
            <ReportCard title="Avg Order Value" value={fmt(summary.avgOrderValue)} />
            <ReportCard title="Total Tips" value={fmt(summary.totalTips)} />
          </div>

          {/* Revenue Trend Chart */}
          <ReportSection title="Revenue Trend">
            {trend.length === 0 ? (
              <p className="text-sm text-slate-500">No data for selected range.</p>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} width={64} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ReportSection>

          {/* Breakdown Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Order Type */}
            <ReportSection title="Revenue by Order Type">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Orders</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byOrderType.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No data</td>
                      </tr>
                    ) : (
                      byOrderType.map((row) => (
                        <tr key={row.type} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: TYPE_COLORS[row.type] ?? "#94a3b8" }}
                            />
                            {row.type === "Dine_in" ? "Dine-in" : row.type}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.orders}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(row.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ReportSection>

            {/* By Payment Method */}
            <ReportSection title="Revenue by Payment Method">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Method</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Transactions</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPaymentMethod.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No data</td>
                      </tr>
                    ) : (
                      byPaymentMethod.map((row) => (
                        <tr key={row.method} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 flex items-center gap-2 capitalize">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: PAYMENT_COLORS[row.method] ?? "#94a3b8" }}
                            />
                            {row.method}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.transactions}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(row.revenue)}</td>
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

export default function RevenueReportPage() {
  return (
    <ReportsPageLayout
      title="Revenue Report"
      description="Total revenue, orders, and payment breakdown for the restaurant."
    >
      {(selectedRange) => <RevenueReportSection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
