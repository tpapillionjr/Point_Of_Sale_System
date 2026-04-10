const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

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
  onApply,
  activeSummary,
}) {
  return (
    <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Dynamic Report Builder</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-950">Current filter:</span> {activeSummary}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
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

        <FilterField label="Filter Type">
          <select
            value={filters.mode}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                mode: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="days">Custom Day Count</option>
            <option value="dates">Date Range</option>
          </select>
        </FilterField>

        {filters.mode === "days" ? (
          <FilterField label="Days">
            <input
              type="number"
              min="1"
              max="365"
              value={filters.days}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  days: event.target.value,
                }))
              }
              placeholder="7"
              className={inputClass}
            />
          </FilterField>
        ) : (
          <FilterField label="Apply Filters">
            <button
              type="button"
              onClick={onApply}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Refresh Report
            </button>
          </FilterField>
        )}
      </div>

      {filters.mode === "dates" && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Start Date">
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className={inputClass}
            />
          </FilterField>

          <FilterField label="End Date">
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className={inputClass}
            />
          </FilterField>
        </div>
      )}

      {filters.mode === "days" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {["7", "14", "30", "90"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onFiltersChange((current) => ({
                  ...current,
                  days: value,
                }))
              }
              className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              {value} days
            </button>
          ))}

          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Refresh Report
          </button>
        </div>
      )}
    </div>
  );
}
