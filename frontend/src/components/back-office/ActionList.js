export default function ActionList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                item.priority === "High"
                  ? "bg-red-100 text-red-700"
                  : item.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {item.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
