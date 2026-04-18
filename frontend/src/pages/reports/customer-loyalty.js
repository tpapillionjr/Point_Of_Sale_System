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
import { getCustomerLoyaltyReport } from "../../lib/api";

function useCustomerLoyaltyData(selectedRange) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getCustomerLoyaltyReport(selectedRange)
      .then((payload) => {
        if (isMounted) { setData(payload); setError(""); }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load loyalty report.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedRange]);

  return { data, isLoading, error };
}

function CustomerLoyaltySection({ selectedRange }) {
  const { data, isLoading, error } = useCustomerLoyaltyData(selectedRange);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const summary = data?.summary ?? {};
  const mostLoyal = data?.mostLoyalCustomer;
  const topCustomers = data?.topCustomers ?? [];
  const trend = data?.trend ?? [];
  const recentActivity = data?.recentActivity ?? [];

  return (
    <div className="space-y-8">
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ReportCard title="Total Members" value={String(summary.totalMembers ?? 0)} />
            <ReportCard title="Points Issued" value={String(summary.totalPointsEarned ?? 0)} />
            <ReportCard title="Points Redeemed" value={String(summary.totalPointsRedeemed ?? 0)} />
            <ReportCard title="Total Points Balance" value={String(summary.totalPointsBalance ?? 0)} />
          </div>

          {/* Most Loyal Customer Highlight */}
          <ReportSection title="Most Loyal Customer">
            {mostLoyal ? (
              <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">
                      Top Customer — Selected Period
                    </p>
                    <h3 className="text-2xl font-bold">{mostLoyal.name}</h3>
                    <p className="text-blue-200 text-sm mt-0.5">{mostLoyal.email}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{mostLoyal.pointsEarned.toLocaleString()}</p>
                      <p className="text-xs text-blue-200 mt-0.5">Points Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{mostLoyal.currentBalance.toLocaleString()}</p>
                      <p className="text-xs text-blue-200 mt-0.5">Current Balance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{mostLoyal.orders}</p>
                      <p className="text-xs text-blue-200 mt-0.5">Orders</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No loyalty activity in this period.</p>
            )}
          </ReportSection>

          {/* Points Trend Chart */}
          <ReportSection title="Points Activity Over Time">
            {trend.length === 0 ? (
              <p className="text-sm text-slate-500">No data for selected range.</p>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={48} />
                    <Tooltip />
                    <Bar dataKey="pointsEarned" fill="#2563eb" radius={[4, 4, 0, 0]} name="Earned" />
                    <Bar dataKey="pointsRedeemed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Redeemed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ReportSection>

          {/* Top Customers Table */}
          <ReportSection title="Top 10 Customers by Points Earned">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Rank</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Points Earned</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Points Redeemed</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Balance</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">No data</td>
                    </tr>
                  ) : (
                    topCustomers.map((row, i) => (
                      <tr key={row.email} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 text-slate-400 font-medium">
                          {i === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="px-4 py-3 text-slate-500">{row.email}</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-semibold">{row.pointsEarned.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{row.pointsRedeemed.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.currentBalance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.orders}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* Recent Activity */}
          <ReportSection title="Recent Point Activity">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Points</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No recent activity</td>
                    </tr>
                  ) : (
                    recentActivity.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.type === "earned"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">+{row.points}</td>
                        <td className="px-4 py-3 text-slate-500">{row.description ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </>
      )}
    </div>
  );
}

export default function CustomerLoyaltyReportPage() {
  return (
    <ReportsPageLayout
      title="Customer Loyalty Report"
      description="Track loyalty members, points activity, and your most loyal customers."
    >
      {(selectedRange) => <CustomerLoyaltySection selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}
