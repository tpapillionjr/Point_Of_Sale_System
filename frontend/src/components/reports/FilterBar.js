const inputClass =
  "h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const selectClass =
  `${inputClass} appearance-none pr-10`;

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

function StyledSelect({ value, onChange, ariaLabel, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={selectClass}
        aria-label={ariaLabel}
      >
        {children}
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
  );
}

export default function FilterBar({
  sectionOptions = [],
  selectedSection,
  onSectionChange,
  viewOptions = [],
  selectedView,
  onViewChange,
  filters,
  onFiltersChange,
  datePreset,
  onDatePresetChange,
  searchTerm,
  onSearchTermChange,
  onApply,
  onExport,
}) {
  return (
    <div className="mb-5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-4">
        <FilterField label="Report Group">
          <StyledSelect
            value={selectedSection}
            onChange={(event) => onSectionChange(event.target.value)}
            ariaLabel="Report Group"
          >
            {sectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        </FilterField>

        <FilterField label="Search">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search by item name"
            className={inputClass}
            aria-label="Search by item name"
          />
        </FilterField>

        <FilterField label="Report View">
          <StyledSelect
            value={selectedView ?? ""}
            onChange={(event) => onViewChange(event.target.value)}
            ariaLabel="Report View"
          >
            {viewOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        </FilterField>

        <FilterField label="Date Range">
          <StyledSelect
            value={datePreset}
            onChange={(event) => onDatePresetChange(event.target.value)}
            ariaLabel="Date Range"
          >
            <option value="7days">Last Week</option>
            <option value="30days">Last Month</option>
            <option value="365days">Last Year</option>
            <option value="custom">Custom Dates</option>
          </StyledSelect>
        </FilterField>
      </div>

      {datePreset === "custom" && (
        <div className="mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-3">
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
