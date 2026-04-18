import { useState } from "react";
import { useRouter } from "next/router";
import { getReportsDashboard } from "../../lib/api";
import FilterBar from "./FilterBar";

const sectionOptions = [
  { value: "/reports/revenue", label: "Revenue Report" },
  { value: "/reports/customer-loyalty", label: "Customer Loyalty Report" },
  { value: "/reports/item-report", label: "Item Report" },
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function createDefaultDateFilters() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  };
}

function filtersForDatePreset(preset) {
  if (preset === "7days") {
    return { days: 7 };
  }

  if (preset === "365days") {
    return { days: 365 };
  }

  return { days: 30 };
}

function matchesSearch(value, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase());
}

function filterRows(rows, searchTerm, fields) {
  return (rows ?? []).filter(
    (row) => !searchTerm || fields.some((field) => matchesSearch(row[field], searchTerm))
  );
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function cardsToRows(cards) {
  return (cards ?? []).map((card) => ({
    metric: card.title ?? card.label,
    value: card.value,
  }));
}

function section(title, columns, rows) {
  return { title, columns, rows: rows ?? [] };
}

function currentReportKey(pathname, selectedView) {
  const pathParts = pathname.split("/").filter(Boolean);
  if (pathParts.length === 1 && pathParts[0] === "reports") {
    return "reports:overview";
  }

  const reportGroup = pathParts[1] ?? "overview";
  const childPage = pathParts[2];

  if (childPage) {
    return `${reportGroup}:${childPage}`;
  }

  return `${reportGroup}:${selectedView || "overview"}`;
}

function buildVisibleExportSections(payload, pathname, selectedView, searchTerm) {
  const reportKey = currentReportKey(pathname, selectedView);
  const topItems = filterRows(payload.topItems, searchTerm, ["name"]);
  const lowInventory = filterRows(payload.lowInventory, searchTerm, ["itemName", "status"]);
  const salesCategories = filterRows(payload.salesCategories, searchTerm, ["category"]);
  const salesServers = filterRows(payload.salesServers, searchTerm, ["name"]);
  const laborOverview = filterRows(payload.laborOverview, searchTerm, ["name", "performance"]);
  const laborWeeklyHours = filterRows(payload.laborWeeklyHours, searchTerm, ["name"]);
  const laborClock = filterRows(payload.laborClock, searchTerm, ["name", "status"]);
  const voids = filterRows(payload.voids, searchTerm, ["order", "reason", "employee"]);
  const discounts = filterRows(payload.discounts, searchTerm, ["type"]);
  const refunds = filterRows(payload.refunds, searchTerm, ["order", "reason", "status"]);
  const paymentMethods = filterRows(payload.paymentMethods, searchTerm, ["method"]);
  const repeatCustomers = filterRows(payload.repeatCustomers, searchTerm, ["name", "favorite"]);

  const summarySection = section(
    "Summary",
    [
      { header: "Metric", key: "metric" },
      { header: "Value", key: "value" },
    ],
    cardsToRows(payload.customSummary)
  );
  const revenueSection = section(
    "Revenue Data Points",
    [
      { header: "Date", key: "date" },
      { header: "Revenue", key: "revenue", format: formatMoney },
    ],
    payload.revenueTrend
  );
  const topItemsSection = section(
    "Item Sales Data Points",
    [
      { header: "Item Bought", key: "name" },
      { header: "Amount Earned", key: "revenue", format: formatMoney },
      { header: "Quantity", key: "quantity" },
      { header: "Last Purchased", key: "lastPurchased" },
    ],
    topItems
  );
  const lowInventorySection = section(
    "Inventory Alert Data Points",
    [
      { header: "Item", key: "itemName" },
      { header: "Available", key: "amountAvailable" },
      { header: "Status", key: "status" },
    ],
    lowInventory
  );

  const reportMap = {
    "reports:overview": [summarySection, revenueSection, topItemsSection, lowInventorySection],
    "sales:overview": [summarySection, revenueSection, topItemsSection],
    "sales:trend": [summarySection, revenueSection, topItemsSection],
    "sales:daily": [summarySection, revenueSection],
    "sales:weekly": [summarySection, revenueSection],
    "sales:monthly": [summarySection, revenueSection],
    "sales:items": [topItemsSection],
    "inventory:overview": [lowInventorySection, topItemsSection],
    "inventory:stock": [lowInventorySection],
    "inventory:top-items": [topItemsSection],
  };

  if (reportKey === "sales:categories") {
    return [
      section(
        "Sales by Category",
        [
          { header: "Category", key: "category" },
          { header: "Revenue", key: "revenue", format: formatMoney },
        ],
        salesCategories
      ),
    ];
  }

  if (reportKey === "sales:servers") {
    return [
      section(
        "Sales by Server",
        [
          { header: "Server", key: "name" },
          { header: "Revenue", key: "revenue", format: formatMoney },
          { header: "Orders", key: "orders" },
        ],
        salesServers
      ),
    ];
  }

  if (reportKey === "sales:tips") {
    return [
      section(
        "Tips",
        [
          { header: "Metric", key: "metric" },
          { header: "Value", key: "value" },
        ],
        [
          { metric: "Total Tips", value: formatMoney(payload.tipSummary?.totalTips) },
          { metric: "Average Daily Tips", value: formatMoney(payload.tipSummary?.averageTips) },
        ]
      ),
    ];
  }

  if (reportKey === "labor:overview" || reportKey === "labor:performance") {
    return [
      section(
        "Labor Reports",
        [
          { header: "Employee", key: "name" },
          { header: "Scheduled Hours", key: "scheduled" },
          { header: "Actual Hours", key: "worked" },
          { header: "Hours This Week", key: "hoursWorkedThisWeek" },
          { header: "Clock-Ins", key: "clockIns" },
          { header: "Performance", key: "performance" },
        ],
        laborOverview
      ),
      section(
        "Hours Worked This Week",
        [
          { header: "Employee", key: "name" },
          { header: "Hours This Week", key: "hoursWorkedThisWeek" },
        ],
        laborWeeklyHours
      ),
    ];
  }

  if (reportKey === "labor:clock") {
    return [
      section(
        "Clock In / Out",
        [
          { header: "Employee", key: "name" },
          { header: "Last Clock In", key: "lastClockIn" },
          { header: "Last Clock Out", key: "lastClockOut" },
          { header: "Status", key: "status" },
        ],
        laborClock
      ),
    ];
  }

  if (reportKey === "labor:hours") {
    return [
      section(
        "Scheduled vs Actual Hours",
        [
          { header: "Employee", key: "name" },
          { header: "Scheduled Hours", key: "scheduled" },
          { header: "Actual Hours", key: "worked" },
          { header: "Hours This Week", key: "hoursWorkedThisWeek" },
          { header: "Difference", key: "difference" },
        ],
        laborOverview.map((row) => ({
          ...row,
          difference: (Number(row.worked || 0) - Number(row.scheduled || 0)).toFixed(1),
        }))
      ),
      section(
        "Hours Worked This Week",
        [
          { header: "Employee", key: "name" },
          { header: "Hours This Week", key: "hoursWorkedThisWeek" },
        ],
        laborWeeklyHours
      ),
    ];
  }

  if (reportKey === "inventory:usage") {
    return [
      section(
        "Ingredient Usage",
        [
          { header: "Item", key: "itemName" },
          { header: "Amount Used", key: "amountUsed" },
        ],
        filterRows(payload.inventoryUsage, searchTerm, ["itemName"])
      ),
    ];
  }

  if (reportKey === "inventory:waste") {
    return [
      section(
        "Waste Reduction",
        [
          { header: "Metric", key: "metric" },
          { header: "Value", key: "value" },
        ],
        [
          { metric: "High waste item", value: payload.inventoryWaste?.highWasteItem },
          { metric: "Most efficient item", value: payload.inventoryWaste?.mostEfficientItem },
          { metric: "Suggested reorder priority", value: payload.inventoryWaste?.reorderPriority },
        ]
      ),
    ];
  }

  if (reportKey === "operations:overview") {
    return [
      section(
        "Operational Summary",
        [
          { header: "Metric", key: "metric" },
          { header: "Value", key: "value" },
        ],
        cardsToRows(payload.operationalSummary)
      ),
      buildOperationsSection("Voids", voids),
      buildOperationsSection("Discounts", discounts),
      buildOperationsSection("Refunds", refunds),
      buildOperationsSection("Payment Methods", paymentMethods),
    ];
  }

  if (reportKey === "operations:voids") {
    return [buildOperationsSection("Voids", voids)];
  }

  if (reportKey === "operations:discounts") {
    return [buildOperationsSection("Discounts", discounts)];
  }

  if (reportKey === "operations:refunds") {
    return [buildOperationsSection("Refunds", refunds)];
  }

  if (reportKey === "operations:payments") {
    return [buildOperationsSection("Payment Methods", paymentMethods)];
  }

  if (reportKey === "customer:overview") {
    return [metricSection("Customer Behavior", payload.customerOverview)];
  }

  if (reportKey === "customer:habits") {
    return [metricSection("Ordering Habits", payload.customerHabits)];
  }

  if (reportKey === "customer:loyalty") {
    return [metricSection("Loyalty Usage", payload.customerLoyalty)];
  }

  if (reportKey === "customer:repeat") {
    return [
      section(
        "Repeat Customers",
        [
          { header: "Customer", key: "name" },
          { header: "Visits", key: "visits" },
          { header: "Favorite Item", key: "favorite" },
        ],
        repeatCustomers
      ),
    ];
  }

  return reportMap[reportKey] ?? [summarySection, revenueSection, topItemsSection];
}

function buildOperationsSection(title, rows) {
  const columnsByTitle = {
    Voids: [
      { header: "Order", key: "order" },
      { header: "Reason", key: "reason" },
      { header: "Employee", key: "employee" },
      { header: "Amount", key: "amount" },
    ],
    Discounts: [
      { header: "Type", key: "type" },
      { header: "Count", key: "count" },
      { header: "Amount", key: "amount" },
    ],
    Refunds: [
      { header: "Order", key: "order" },
      { header: "Reason", key: "reason" },
      { header: "Amount", key: "amount" },
      { header: "Status", key: "status" },
    ],
    "Payment Methods": [
      { header: "Method", key: "method" },
      { header: "Transactions", key: "count" },
      { header: "Amount", key: "amount" },
    ],
  };

  return section(title, columnsByTitle[title], rows);
}

function metricSection(title, cards) {
  return section(
    title,
    [
      { header: "Metric", key: "metric" },
      { header: "Value", key: "value" },
    ],
    cardsToRows(cards)
  );
}

function valueForExport(row, column) {
  const value = row?.[column.key];
  return column.format ? column.format(value) : value ?? "";
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function sectionsToCsv(metadata, sections) {
  const lines = [
    ["Report", metadata.title],
    ["View", metadata.view || "Overview"],
    ["Date Range", `${metadata.filters.startDate} to ${metadata.filters.endDate}`],
    ["Search", metadata.searchTerm || "None"],
    ["Exported At", metadata.exportedAt],
  ];

  lines.push([]);

  sections.forEach((item) => {
    lines.push([item.title]);
    lines.push(item.columns.map((column) => column.header));

    if (item.rows.length) {
      item.rows.forEach((row) => {
        lines.push(item.columns.map((column) => valueForExport(row, column)));
      });
    } else {
      lines.push(["No rows available"]);
    }

    lines.push([]);
  });

  return `\uFEFF${lines.map((line) => line.map(csvEscape).join(",")).join("\r\n")}`;
}

function sectionsToJson(metadata, sections) {
  return JSON.stringify(
    {
      metadata,
      sections: sections.map((item) => ({
        title: item.title,
        columns: item.columns.map((column) => column.header),
        rows: item.rows.map((row) =>
          Object.fromEntries(
            item.columns.map((column) => [column.header, valueForExport(row, column)])
          )
        ),
      })),
    },
    null,
    2
  );
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "-")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function splitPdfText(value, maxLength = 90) {
  const words = String(value ?? "").split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function buildPdfContent(metadata, sections) {
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 16;
  const pages = [];
  let lines = [];
  let y = pageHeight - margin;

  function addLine(text, size = 10) {
    if (y < margin) {
      pages.push(lines);
      lines = [];
      y = pageHeight - margin;
    }

    lines.push({ text, size, y });
    y -= lineHeight;
  }

  addLine(metadata.title, 16);
  addLine(`View: ${metadata.view || "Overview"}`, 10);
  addLine(`Date Range: ${metadata.filters.startDate} to ${metadata.filters.endDate}`, 10);
  addLine(`Search: ${metadata.searchTerm || "None"}`, 10);
  addLine(`Exported At: ${metadata.exportedAt}`, 10);
  addLine("", 10);

  sections.forEach((item) => {
    addLine(item.title, 13);
    addLine(item.columns.map((column) => column.header).join(" | "), 10);

    if (item.rows.length) {
      item.rows.forEach((row) => {
        const rowText = item.columns.map((column) => valueForExport(row, column)).join(" | ");
        splitPdfText(rowText).forEach((line) => addLine(line, 9));
      });
    } else {
      addLine("No rows available", 9);
    }

    addLine("", 10);
  });

  pages.push(lines);

  const objects = [];
  const pageObjectIds = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines) => {
    const content = [
      "BT",
      "/F1 10 Tf",
      ...pageLines.map((line) => `/F1 ${line.size} Tf 1 0 0 1 48 ${line.y} Tm (${escapePdfText(line.text)}) Tj`),
      "ET",
    ].join("\n");

    const contentId = objects.length + 1;
    const pageId = objects.length + 2;
    pageObjectIds.push(pageId);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export default function ReportsPageLayout({
  title,
  description,
  children,
  viewOptions = [],
  defaultView,
}) {
  const router = useRouter();
  const fallbackView = defaultView ?? viewOptions[0]?.id ?? "";
  const [selectedView, setSelectedView] = useState(fallbackView);
  const [defaultFilters] = useState(createDefaultDateFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [datePreset, setDatePreset] = useState("7days");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportChoices, setShowExportChoices] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filtersForDatePreset("7days"));
  const resolvedSelectedView = viewOptions.some((option) => option.id === selectedView)
    ? selectedView
    : fallbackView;

  function applyFilters() {
    if (datePreset === "custom") {
      setAppliedFilters({
        startDate: draftFilters.startDate || defaultFilters.startDate,
        endDate: draftFilters.endDate || defaultFilters.endDate,
      });
      return;
    }

    setAppliedFilters(filtersForDatePreset(datePreset));
  }

  function handleDatePresetChange(nextPreset) {
    setDatePreset(nextPreset);
    if (nextPreset !== "custom") {
      setAppliedFilters(filtersForDatePreset(nextPreset));
    }
  }

  async function handleExport(exportFormat) {
    const payload = await getReportsDashboard(appliedFilters);
    const sections = buildVisibleExportSections(payload, router.pathname, resolvedSelectedView, searchTerm);
    const metadata = {
      title,
      view: resolvedSelectedView,
      filters: appliedFilters,
      searchTerm,
      exportedAt: new Date().toLocaleString(),
    };
    const filenameBase = `${router.pathname.split("/").filter(Boolean).join("-") || "reports"}-${resolvedSelectedView || "overview"}`;

    if (exportFormat === "pdf") {
      downloadBlob(buildPdfContent(metadata, sections), "application/pdf", `${filenameBase}.pdf`);
      return;
    }

    if (exportFormat === "json") {
      downloadBlob(sectionsToJson(metadata, sections), "application/json;charset=utf-8", `${filenameBase}.json`);
      return;
    }

    downloadBlob(sectionsToCsv(metadata, sections), "text/csv;charset=utf-8", `${filenameBase}.csv`);
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 text-center">
          <h1 className="text-4xl font-normal tracking-tight text-slate-900">{title}</h1>
          {description && <p className="sr-only">{description}</p>}
        </div>

        {showExportChoices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Choose Export Type</h2>
                  <p className="mt-2 text-sm text-slate-600">Pick the file format for this report.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportChoices(false)}
                  className="rounded-md px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { format: "csv", label: "Excel CSV" },
                  { format: "pdf", label: "PDF" },
                  { format: "json", label: "JSON" },
                ].map((option) => (
                  <button
                    key={option.format}
                    type="button"
                    onClick={() => {
                      setShowExportChoices(false);
                      handleExport(option.format);
                    }}
                    className="rounded-md border border-blue-600 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <FilterBar
          sectionOptions={sectionOptions}
          selectedSection={router.pathname}
          onSectionChange={(nextPath) => router.push(nextPath)}
          viewOptions={viewOptions.length ? viewOptions : [{ id: "", label: "Overview" }]}
          selectedView={resolvedSelectedView}
          onViewChange={setSelectedView}
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          datePreset={datePreset}
          onDatePresetChange={handleDatePresetChange}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onApply={applyFilters}
          onExport={() => setShowExportChoices(true)}
        />

        <div className="space-y-6">{children(appliedFilters, resolvedSelectedView, searchTerm)}</div>
      </div>
    </div>
  );
}
