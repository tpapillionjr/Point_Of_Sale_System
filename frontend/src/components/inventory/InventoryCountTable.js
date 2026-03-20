function varianceClass(value) {
  if (value < 0) {
    return "text-red-700";
  }

  if (value > 0) {
    return "text-green-700";
  }

  return "text-gray-700";
}

export default function InventoryCountTable({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-600">No count sessions are available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Inventory Item</th>
            <th className="py-2 pr-4">Current Count</th>
            <th className="py-2 pr-4">Par Level</th>
            <th className="py-2 pr-4">Variance</th>
            <th className="py-2 pr-4">Last Counted</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventoryItemName} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
              <td className="py-3 pr-4 text-gray-700">
                {item.amountAvailable} {item.unit}
              </td>
              <td className="py-3 pr-4 text-gray-700">
                {item.parLevel} {item.unit}
              </td>
              <td className={`py-3 pr-4 font-medium ${varianceClass(item.countVariance)}`}>
                {item.countVariance > 0 ? `+${item.countVariance}` : item.countVariance}
              </td>
              <td className="py-3 pr-4 text-gray-700">{item.lastCountedAt}</td>
              <td className="py-3 pr-4 text-gray-700">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
