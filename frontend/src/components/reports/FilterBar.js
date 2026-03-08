export default function FilterBar({ selectedRange, onChange }) {
  const baseClass =
    "rounded-lg px-4 py-2 font-medium transition";
  const activeClass = "bg-blue-600 text-white";
  const inactiveClass = "bg-gray-200 text-gray-800 hover:bg-gray-300";

  return (
    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <button
        className={`${baseClass} ${selectedRange === "today" ? activeClass : inactiveClass}`}
        onClick={() => onChange("today")}
      >
        Today
      </button>

      <button
        className={`${baseClass} ${selectedRange === "7days" ? activeClass : inactiveClass}`}
        onClick={() => onChange("7days")}
      >
        Last 7 Days
      </button>

      <button
        className={`${baseClass} ${selectedRange === "30days" ? activeClass : inactiveClass}`}
        onClick={() => onChange("30days")}
      >
        Last 30 Days
      </button>
    </div>
  );
}