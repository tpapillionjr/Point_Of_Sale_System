import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportSection from "./ReportSection";
import { getReportsDashboard } from "../../lib/api";

const SALES_ROWS_PER_PAGE = 10;
const ITEM_DISTRIBUTION_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

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

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPlainNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getSalesSummary(rows) {
  const totalRevenue = rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const totalInventoryLeft = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSold = rows.reduce((sum, item) => sum + Number(item.sold || 0), 0);
  const topItem = [...rows].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))[0]?.name ?? "No data";

  return {
    totalRevenue,
    totalInventoryLeft,
    totalSold,
    topItem,
    itemCount: rows.length,
  };
}

function SalesSummaryStrip({ rows, isLoading }) {
  if (isLoading) {
    return (
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded bg-white p-4 text-center shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Loading</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">...</p>
          </div>
        ))}
      </div>
    );
  }

  const summary = getSalesSummary(rows);
  const cards = [
    { label: "Total Sales", value: formatMoney(summary.totalRevenue) },
    { label: "Items Sold", value: formatPlainNumber(summary.totalSold) },
    { label: "Inventory Left", value: formatPlainNumber(summary.totalInventoryLeft) },
    { label: "Most Popular", value: summary.topItem },
  ];

  return (
    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded bg-white p-4 text-center shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-900" title={card.value}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReportLedgerTable({ columns, rows, renderFooter, emptyMessage, isLoading }) {
  if (!rows?.length) {
    return <EmptyState message={isLoading ? "Loading report rows..." : emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded bg-white shadow">
      <table className="min-w-full border-collapse text-center text-sm text-gray-800">
        <thead>
          <tr className="border-b border-gray-200 bg-blue-50 text-base text-gray-950">
            {columns.map((column) => (
              <th key={column.key} className="border-r border-gray-200 px-4 py-3 font-semibold underline last:border-r-0">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.name ?? row.itemName ?? row.category ?? row.order ?? row.method ?? index} className="border-b border-gray-200 last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className="border-r border-gray-200 px-4 py-3 last:border-r-0">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {renderFooter && (
          <tfoot>
            <tr className="border-t border-gray-300 bg-blue-50 text-sm font-medium text-gray-950">
              {renderFooter()}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function ItemDistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm shadow">
      <p className="font-semibold text-slate-950">{item.name}</p>
      <p className="mt-1 text-slate-600">{formatPlainNumber(item.value)} sold</p>
    </div>
  );
}

function SalesReportChart({ rows, chartType }) {
  if (!rows.length) {
    return <EmptyState message="No item sales data available." />;
  }

  const chartRows = rows.map((item) => ({
    ...item,
    displayName: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
  }));
  const pieRows = rows
    .filter((item) => Number(item.sold || 0) > 0)
    .map((item) => ({
      name: item.name,
      value: Number(item.sold || 0),
    }));

  return (
    <div className="rounded bg-white p-4 shadow">
      <div className="h-[28rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Tooltip content={<ItemDistributionTooltip />} />
              <Legend />
              <Pie
                data={pieRows}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="54%"
                outerRadius={125}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieRows.map((item, index) => (
                  <Cell key={item.name} fill={ITEM_DISTRIBUTION_COLORS[index % ITEM_DISTRIBUTION_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === "line" ? (
            <LineChart data={chartRows} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayName" angle={-20} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === "revenue" ? formatMoney(value) : value, name === "revenue" ? "Amount Earned" : "Quantity"]} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} />
              <Line type="monotone" dataKey="quantity" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          ) : (
            <BarChart data={chartRows} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayName" angle={-20} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === "revenue" ? formatMoney(value) : value, name === "revenue" ? "Amount Earned" : "Quantity"]} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quantity" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SalesReportTable({ rows, isLoading, currentPage, onPageChange }) {
  const { totalRevenue, totalInventoryLeft, topItem } = getSalesSummary(rows);
  const pageCount = Math.max(1, Math.ceil(rows.length / SALES_ROWS_PER_PAGE));
  const normalizedPage = Math.min(currentPage, pageCount);
  const pageRows = rows.slice((normalizedPage - 1) * SALES_ROWS_PER_PAGE, normalizedPage * SALES_ROWS_PER_PAGE);

  return (
    <>
      <ReportLedgerTable
        columns={[
          { key: "name", header: "Item Bought" },
          { key: "revenue", header: "Amount Earned", render: (item) => formatMoney(item.revenue) },
          { key: "quantity", header: "Quantity" },
          { key: "lastPurchased", header: "Last Purchased" },
        ]}
        rows={pageRows}
        isLoading={isLoading}
        emptyMessage="No item sales data available."
        renderFooter={() => (
          <>
            <td className="border-r border-gray-200 px-4 py-3">Most Popular Item: {topItem}</td>
            <td className="border-r border-gray-200 px-4 py-3">Total Earned: {formatMoney(totalRevenue)}</td>
            <td className="border-r border-gray-200 px-4 py-3">Total Quantity: {formatPlainNumber(totalInventoryLeft)}</td>
            <td className="px-4 py-3">Total Count: {formatPlainNumber(rows.length)}</td>
          </>
        )}
      />

      {rows.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, normalizedPage - 1))}
            disabled={normalizedPage === 1}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`rounded px-4 py-2 text-sm font-medium ${
                normalizedPage === page ? "bg-blue-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount, normalizedPage + 1))}
            disabled={normalizedPage === pageCount}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

function SalesReportView({ rows, isLoading }) {
  const [isChartView, setIsChartView] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div>
      <SalesSummaryStrip rows={rows} isLoading={isLoading} />

      <div className="mb-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setIsChartView((current) => !current)}
          className="rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {isChartView ? "Switch to Table View" : "Switch to Chart View"}
        </button>

        {isChartView && (
          <div className="relative min-w-48">
            <select
              value={chartType}
              onChange={(event) => setChartType(event.target.value)}
              className="h-12 w-full appearance-none rounded-md border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Chart Type"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                <path
                  d="M5 7.5 10 12.5l5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </div>
        )}
      </div>

      {isChartView ? (
        <SalesReportChart rows={rows} chartType={chartType} />
      ) : (
        <SalesReportTable
          rows={rows}
          isLoading={isLoading}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function MetricReportTable({ rows, title = "Metric", valueTitle = "Value", emptyMessage, isLoading }) {
  return (
    <ReportLedgerTable
      columns={[
        { key: "label", header: title, render: (item) => item.title ?? item.label },
        { key: "value", header: valueTitle },
      ]}
      rows={rows ?? []}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      renderFooter={() => (
        <>
          <td className="border-r border-gray-200 px-4 py-3">Rows Reported: {formatPlainNumber(rows?.length ?? 0)}</td>
          <td className="px-4 py-3" aria-label="No total" />
        </>
      )}
    />
  );
}

export function ReportsOverviewSection({ selectedRange, searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);
  const filteredLowInventory = filterBySearch(data?.lowInventory ?? [], searchTerm, ["itemName", "status"]);
  const filteredLabor = filterBySearch(data?.laborOverview ?? [], searchTerm, ["name", "performance"]);
  const laborSnapshot = data
    ? [
        { label: "Employees Tracked", value: formatPlainNumber(filteredLabor.length) },
        {
          label: "Scheduled Hours",
          value: formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.scheduled || 0), 0), 1),
        },
        {
          label: "Actual Hours",
          value: formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.worked || 0), 0), 1),
        },
        {
          label: "Clock-Ins",
          value: formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.clockIns || 0), 0)),
        },
        {
          label: "Strong Performers",
          value: formatPlainNumber(filteredLabor.filter((item) => item.performance === "Strong").length),
        },
      ]
    : null;

  return (
    <>
      <ReportSection title="Sales Report">
        {error ? <ErrorState message={error} /> : <SalesReportView rows={filteredTopItems} isLoading={isLoading} />}
      </ReportSection>

      <ReportSection title="Inventory Support Report">
        {error ? (
          <ErrorState message={error} />
        ) : (
          <ReportLedgerTable
            columns={[
              { key: "itemName", header: "Item" },
              { key: "amountAvailable", header: "Available" },
              { key: "status", header: "Status" },
            ]}
            rows={filteredLowInventory}
            isLoading={isLoading}
            emptyMessage="No low inventory alerts are active."
            renderFooter={() => (
              <>
                <td className="border-r border-gray-200 px-4 py-3">Items Tracked: {formatPlainNumber(filteredLowInventory.length)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Total Available: {formatPlainNumber(filteredLowInventory.reduce((sum, item) => sum + Number(item.amountAvailable || 0), 0))}</td>
                <td className="px-4 py-3">Critical Count: {formatPlainNumber(filteredLowInventory.filter((item) => item.status === "Critical").length)}</td>
              </>
            )}
          />
        )}
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ReportSection title="Labor Snapshot">
          {error ? (
            <ErrorState message={error} />
          ) : (
            <MetricReportTable
              rows={laborSnapshot}
              isLoading={isLoading}
              emptyMessage="No labor snapshot is available."
            />
          )}
        </ReportSection>

        <ReportSection title="Operations Snapshot">
          {error ? (
            <ErrorState message={error} />
          ) : (
            <MetricReportTable
              rows={data?.operationalSummary}
              isLoading={isLoading}
              emptyMessage="No operational summary is available."
            />
          )}
        </ReportSection>

        <ReportSection title="Customer Snapshot">
          {error ? (
            <ErrorState message={error} />
          ) : (
            <MetricReportTable
              rows={data?.customerOverview}
              isLoading={isLoading}
              emptyMessage="No customer overview is available."
            />
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
    <ReportSection title="Sales Report">
      {error ? <ErrorState message={error} /> : <SalesReportView rows={filteredTopItems} isLoading={isLoading} />}
    </ReportSection>
  );
}

export function SalesDailySection() {
  const { data, isLoading, error } = useReportsData("today");
  const topItems = data?.topItems ?? [];

  return (
    <ReportSection title="Daily Sales Report">
      {error ? <ErrorState message={error} /> : <SalesReportView rows={topItems} isLoading={isLoading} />}
    </ReportSection>
  );
}

export function SalesWeeklySection() {
  const { data, isLoading, error } = useReportsData("7days");
  const topItems = data?.topItems ?? [];

  return (
    <ReportSection title="Weekly Sales Report">
      {error ? <ErrorState message={error} /> : <SalesReportView rows={topItems} isLoading={isLoading} />}
    </ReportSection>
  );
}

export function SalesMonthlySection() {
  const { data, isLoading, error } = useReportsData("30days");
  const topItems = data?.topItems ?? [];

  return (
    <ReportSection title="Monthly Sales Report">
      {error ? <ErrorState message={error} /> : <SalesReportView rows={topItems} isLoading={isLoading} />}
    </ReportSection>
  );
}

export function SalesItemsSection({ selectedRange = "30days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredTopItems = filterBySearch(data?.topItems ?? [], searchTerm, ["name"]);

  return (
    <ReportSection title="Sales by Item">
      {error ? <ErrorState message={error} /> : <SalesReportView rows={filteredTopItems} isLoading={isLoading} />}
    </ReportSection>
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
        <ReportLedgerTable
          columns={[
            { key: "category", header: "Category" },
            { key: "revenue", header: "Amount Earned", render: (item) => formatMoney(item.revenue) },
          ]}
          rows={filteredCategories}
          emptyMessage="No category sales data available."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Top Category: {filteredCategories[0]?.category ?? "No data"}</td>
              <td className="px-4 py-3">Total Earned: {formatMoney(filteredCategories.reduce((sum, item) => sum + Number(item.revenue || 0), 0))}</td>
            </>
          )}
        />
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
        <ReportLedgerTable
          columns={[
            { key: "name", header: "Server" },
            { key: "revenue", header: "Amount Earned", render: (item) => formatMoney(item.revenue) },
            { key: "orders", header: "Orders" },
          ]}
          rows={filteredServers}
          emptyMessage="No server sales data available."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Top Server: {filteredServers[0]?.name ?? "No data"}</td>
              <td className="border-r border-gray-200 px-4 py-3">Total Earned: {formatMoney(filteredServers.reduce((sum, item) => sum + Number(item.revenue || 0), 0))}</td>
              <td className="px-4 py-3">Total Orders: {formatPlainNumber(filteredServers.reduce((sum, item) => sum + Number(item.orders || 0), 0))}</td>
            </>
          )}
        />
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
        <MetricReportTable
          rows={[
            { label: "Total Tips", value: `$${(data?.tipSummary?.totalTips ?? 0).toFixed(2)}` },
            { label: "Average Daily Tips", value: `$${(data?.tipSummary?.averageTips ?? 0).toFixed(2)}` },
          ]}
          emptyMessage="No tip data available."
        />
      )}
    </ReportSection>
  );
}

export function LaborOverviewSection({ selectedRange = "7days", searchTerm = "" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);
  const filteredLabor = filterBySearch(data?.laborOverview ?? [], searchTerm, ["name", "performance"]);
  const filteredWeeklyHours = filterBySearch(data?.laborWeeklyHours ?? [], searchTerm, ["name"]);

  return (
    <>
      <ReportSection title="Labor Reports">
        {error ? (
          <ErrorState message={error} />
        ) : filteredLabor.length ? (
          <ReportLedgerTable
            columns={[
              { key: "name", header: "Employee" },
              { key: "scheduled", header: "Scheduled Hours" },
              { key: "worked", header: "Actual Hours" },
              { key: "hoursWorkedThisWeek", header: "Hours This Week", render: (employee) => employee.hoursWorkedThisWeek ?? 0 },
              { key: "clockIns", header: "Clock-Ins" },
              { key: "performance", header: "Performance" },
            ]}
            rows={filteredLabor}
            emptyMessage="No labor data available."
            renderFooter={() => (
              <>
                <td className="border-r border-gray-200 px-4 py-3">Employees: {formatPlainNumber(filteredLabor.length)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Scheduled: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.scheduled || 0), 0), 1)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Worked: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.worked || 0), 0), 1)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Week Hours: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.hoursWorkedThisWeek || 0), 0), 1)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Clock-Ins: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.clockIns || 0), 0))}</td>
                <td className="px-4 py-3">Strong: {formatPlainNumber(filteredLabor.filter((item) => item.performance === "Strong").length)}</td>
              </>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading labor data..." : "No labor data available."} />
        )}
      </ReportSection>

      <ReportSection title="Hours Worked This Week">
        {error ? (
          <ErrorState message={error} />
        ) : filteredWeeklyHours.length ? (
          <ReportLedgerTable
            columns={[
              { key: "name", header: "Employee" },
              { key: "hoursWorkedThisWeek", header: "Hours This Week" },
            ]}
            rows={filteredWeeklyHours}
            emptyMessage="No employee hours are logged for this week."
            renderFooter={() => (
              <>
                <td className="border-r border-gray-200 px-4 py-3">Employees: {formatPlainNumber(filteredWeeklyHours.length)}</td>
                <td className="px-4 py-3">Total Hours: {formatPlainNumber(filteredWeeklyHours.reduce((sum, item) => sum + Number(item.hoursWorkedThisWeek || 0), 0), 1)}</td>
              </>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading weekly hours..." : "No employee hours are logged for this week."} />
        )}
      </ReportSection>
    </>
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
        <ReportLedgerTable
          columns={[
            { key: "name", header: "Employee" },
            { key: "lastClockIn", header: "Last Clock In" },
            { key: "lastClockOut", header: "Last Clock Out" },
            { key: "status", header: "Status" },
          ]}
          rows={filteredClock}
          emptyMessage="No clock data available."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Employees: {formatPlainNumber(filteredClock.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Clocked In: {formatPlainNumber(filteredClock.filter((item) => item.status === "Clocked In").length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Clocked Out: {formatPlainNumber(filteredClock.filter((item) => item.status === "Clocked Out").length)}</td>
              <td className="px-4 py-3">Current Status Count</td>
            </>
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
        <ReportLedgerTable
          columns={[
            { key: "name", header: "Employee" },
            { key: "scheduled", header: "Scheduled Hours" },
            { key: "worked", header: "Actual Hours" },
            { key: "hoursWorkedThisWeek", header: "Hours This Week", render: (employee) => employee.hoursWorkedThisWeek ?? 0 },
            { key: "difference", header: "Difference", render: (employee) => (Number(employee.worked || 0) - Number(employee.scheduled || 0)).toFixed(1) },
          ]}
          rows={filteredLabor}
          emptyMessage="No labor hours data available."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Employees: {formatPlainNumber(filteredLabor.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Scheduled: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.scheduled || 0), 0), 1)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Worked: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.worked || 0), 0), 1)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Week Hours: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.hoursWorkedThisWeek || 0), 0), 1)}</td>
              <td className="px-4 py-3">Difference: {formatPlainNumber(filteredLabor.reduce((sum, item) => sum + Number(item.worked || 0) - Number(item.scheduled || 0), 0), 1)}</td>
            </>
          )}
        />
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
          <ReportLedgerTable
            columns={[
              { key: "itemName", header: "Item" },
              { key: "amountAvailable", header: "Available" },
              { key: "status", header: "Status" },
            ]}
            rows={filteredLowInventory}
            emptyMessage="No stock alerts are active."
            renderFooter={() => (
              <>
                <td className="border-r border-gray-200 px-4 py-3">Items Tracked: {formatPlainNumber(filteredLowInventory.length)}</td>
                <td className="border-r border-gray-200 px-4 py-3">Total Available: {formatPlainNumber(filteredLowInventory.reduce((sum, item) => sum + Number(item.amountAvailable || 0), 0))}</td>
                <td className="px-4 py-3">Critical Count: {formatPlainNumber(filteredLowInventory.filter((item) => item.status === "Critical").length)}</td>
              </>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading inventory..." : "No stock alerts are active."} />
        )}
      </ReportSection>
      <ReportSection title="Top Selling Items">
        {error ? (
          <ErrorState message={error} />
        ) : filteredTopItems.length ? (
          <SalesReportView rows={filteredTopItems} isLoading={isLoading} />
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
        <ReportLedgerTable
          columns={[
            { key: "itemName", header: "Item" },
            { key: "amountAvailable", header: "Available" },
            { key: "status", header: "Status" },
          ]}
          rows={filteredLowInventory}
          emptyMessage="No stock alerts are active."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Items Tracked: {formatPlainNumber(filteredLowInventory.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Total Available: {formatPlainNumber(filteredLowInventory.reduce((sum, item) => sum + Number(item.amountAvailable || 0), 0))}</td>
              <td className="px-4 py-3">Critical Count: {formatPlainNumber(filteredLowInventory.filter((item) => item.status === "Critical").length)}</td>
            </>
          )}
        />
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
        <ReportLedgerTable
          columns={[
            { key: "itemName", header: "Item" },
            { key: "amountUsed", header: "Amount Used" },
          ]}
          rows={filteredUsage}
          emptyMessage="No usage data available."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Most Used: {filteredUsage[0]?.itemName ?? "No data"}</td>
              <td className="px-4 py-3">Total Used: {formatPlainNumber(filteredUsage.reduce((sum, item) => sum + Number(item.amountUsed || 0), 0))}</td>
            </>
          )}
        />
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
        <SalesReportView rows={filteredTopItems} isLoading={isLoading} />
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
        <MetricReportTable
          rows={[
            { label: "High Waste Item", value: data.inventoryWaste.highWasteItem },
            { label: "Most Efficient Item", value: data.inventoryWaste.mostEfficientItem },
            { label: "Suggested Reorder Priority", value: data.inventoryWaste.reorderPriority },
          ]}
          emptyMessage="No waste insights are available."
        />
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
      {error ? (
        <ErrorState message={error} />
      ) : (
        <MetricReportTable
          rows={data?.operationalSummary}
          isLoading={isLoading}
          emptyMessage="No operational summary is available."
        />
      )}
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
        <ReportLedgerTable
          columns={[
            { key: "order", header: "Order" },
            { key: "reason", header: "Reason" },
            { key: "employee", header: "Employee" },
            { key: "amount", header: "Amount" },
          ]}
          rows={filteredVoids}
          emptyMessage="No voided orders were found for this range."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Total Voids: {formatPlainNumber(filteredVoids.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Top Reason: {filteredVoids[0]?.reason ?? "No data"}</td>
              <td className="border-r border-gray-200 px-4 py-3">Employees: {formatPlainNumber(new Set(filteredVoids.map((item) => item.employee)).size)}</td>
              <td className="px-4 py-3">Review Count: {formatPlainNumber(filteredVoids.length)}</td>
            </>
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
        <ReportLedgerTable
          columns={[
            { key: "type", header: "Type" },
            { key: "count", header: "Count" },
            { key: "amount", header: "Amount" },
          ]}
          rows={filteredDiscounts}
          emptyMessage="No discounts were found for this range."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Discount Types: {formatPlainNumber(filteredDiscounts.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Total Count: {formatPlainNumber(filteredDiscounts.reduce((sum, item) => sum + Number(item.count || 0), 0))}</td>
              <td className="px-4 py-3">Amount Tracked</td>
            </>
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
        <ReportLedgerTable
          columns={[
            { key: "order", header: "Order" },
            { key: "reason", header: "Reason" },
            { key: "amount", header: "Amount" },
            { key: "status", header: "Status" },
          ]}
          rows={filteredRefunds}
          emptyMessage="No refunds were found for this range."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Refunds: {formatPlainNumber(filteredRefunds.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Top Reason: {filteredRefunds[0]?.reason ?? "No data"}</td>
              <td className="border-r border-gray-200 px-4 py-3">Amount Tracked</td>
              <td className="px-4 py-3">Approved: {formatPlainNumber(filteredRefunds.filter((item) => item.status === "Approved").length)}</td>
            </>
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
        <ReportLedgerTable
          columns={[
            { key: "method", header: "Method" },
            { key: "count", header: "Transactions" },
            { key: "amount", header: "Amount" },
          ]}
          rows={filteredPayments}
          emptyMessage="No payment data is available for this range."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Methods: {formatPlainNumber(filteredPayments.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Transactions: {formatPlainNumber(filteredPayments.reduce((sum, item) => sum + Number(item.count || 0), 0))}</td>
              <td className="px-4 py-3">Payment Mix</td>
            </>
          )}
        />
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
      {error ? (
        <ErrorState message={error} />
      ) : (
        <MetricReportTable
          rows={data?.customerOverview}
          isLoading={isLoading}
          emptyMessage="No customer overview is available."
        />
      )}
    </ReportSection>
  );
}

export function CustomerHabitsSection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Ordering Habits">
      {error ? (
        <ErrorState message={error} />
      ) : (
        <MetricReportTable
          rows={data?.customerHabits}
          isLoading={isLoading}
          emptyMessage="No customer habit data is available."
        />
      )}
    </ReportSection>
  );
}

export function CustomerLoyaltySection({ selectedRange = "30days" }) {
  const { data, isLoading, error } = useReportsData(selectedRange);

  return (
    <ReportSection title="Loyalty Usage">
      {error ? (
        <ErrorState message={error} />
      ) : (
        <MetricReportTable
          rows={data?.customerLoyalty}
          isLoading={isLoading}
          emptyMessage="No loyalty data is available."
        />
      )}
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
        <ReportLedgerTable
          columns={[
            { key: "name", header: "Customer" },
            { key: "visits", header: "Visits" },
            { key: "favorite", header: "Favorite Item" },
          ]}
          rows={filteredCustomers}
          emptyMessage="Repeat customer tracking is not available with the current schema."
          renderFooter={() => (
            <>
              <td className="border-r border-gray-200 px-4 py-3">Customers: {formatPlainNumber(filteredCustomers.length)}</td>
              <td className="border-r border-gray-200 px-4 py-3">Total Visits: {formatPlainNumber(filteredCustomers.reduce((sum, item) => sum + Number(item.visits || 0), 0))}</td>
              <td className="px-4 py-3">Top Favorite: {filteredCustomers[0]?.favorite ?? "No data"}</td>
            </>
          )}
        />
      ) : (
        <EmptyState message={isLoading ? "Loading repeat-customer data..." : "Repeat customer tracking is not available with the current schema."} />
      )}
    </ReportSection>
  );
}
