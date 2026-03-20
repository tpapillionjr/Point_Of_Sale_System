function priorityClass(priority) {
  if (priority === "Unavailable" || priority === "Critical") {
    return "bg-red-100 text-red-700";
  }

  if (priority === "Low") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-green-100 text-green-700";
}

export default function ReorderQueueTable({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-600">No reorder recommendations right now.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Inventory Item</th>
            <th className="py-2 pr-4">Supplier</th>
            <th className="py-2 pr-4">Recommended Order</th>
            <th className="py-2 pr-4">Lead Time</th>
            <th className="py-2 pr-4">Days Left</th>
            <th className="py-2 pr-4">Priority</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventoryItemName} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
              <td className="py-3 pr-4 text-gray-700">{item.supplier}</td>
              <td className="py-3 pr-4 text-gray-700">{item.recommendedOrder}</td>
              <td className="py-3 pr-4 text-gray-700">{item.leadTimeDays} days</td>
              <td className="py-3 pr-4 text-gray-700">{item.estimatedDaysLeft}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${priorityClass(item.priority)}`}
                >
                  {item.priority}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
