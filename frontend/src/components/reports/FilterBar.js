const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const dateInputClass =
  `${inputClass} appearance-none pr-12`;

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 2v3M17 2v3M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2 8h3v3H7Zm5 0h3v3h-3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FilterBar({
  title = "Report Filters",
  description = "Choose the report area and the date window you want to analyze.",
  sectionOptions = [],
  selectedSection,
  onSectionChange,
  viewOptions = [],
  selectedView,
  onViewChange,
  filters,
  onFiltersChange,
  searchTerm,
  onSearchTermChange,
  exportFormat,
  onExportFormatChange,
  onApply,
  onExport,
}) {
  return (
    <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Report Request</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilterField label="Report Group">
          <select
            value={selectedSection}
            onChange={(event) => onSectionChange(event.target.value)}
            className={inputClass}
          >
            {sectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Report View">
          <select
            value={selectedView ?? ""}
            onChange={(event) => onViewChange(event.target.value)}
            className={inputClass}
          >
            {viewOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Start Date">
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className={dateInputClass}
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
              <CalendarIcon />
            </span>
          </div>
        </FilterField>

        <FilterField label="End Date">
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className={dateInputClass}
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
              <CalendarIcon />
            </span>
          </div>
        </FilterField>

        <FilterField label="Search">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search employees, items, orders..."
            className={inputClass}
          />
        </FilterField>

        <FilterField label="Export Type">
          <select
            value={exportFormat}
            onChange={(event) => onExportFormatChange(event.target.value)}
            className={inputClass}
          >
            <option value="csv">Excel CSV</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </FilterField>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onExport}
          className="min-w-40 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
        >
          Save As / Export
        </button>
        <button
          type="button"
          onClick={onApply}
          className="min-w-40 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </div>
  );
}
