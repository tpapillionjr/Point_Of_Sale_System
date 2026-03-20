function riskClass(level) {
  if (level === "Critical") {
    return "text-red-700";
  }

  if (level === "Low") {
    return "text-yellow-700";
  }

  return "text-green-700";
}

export default function InventoryUsageTable({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-600">No usage data is available for this range.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Inventory Item</th>
            <th className="py-2 pr-4">Units Used</th>
            <th className="py-2 pr-4">Waste</th>
            <th className="py-2 pr-4">Menu Orders Impacted</th>
            <th className="py-2 pr-4">Depletion Risk</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventoryItemName} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
              <td className="py-3 pr-4 text-gray-700">{item.used}</td>
              <td className="py-3 pr-4 text-gray-700">{item.waste}</td>
              <td className="py-3 pr-4 text-gray-700">{item.salesImpact}</td>
              <td className={`py-3 pr-4 font-medium ${riskClass(item.depletionRisk)}`}>
                {item.depletionRisk}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
