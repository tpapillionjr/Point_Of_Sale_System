function statusClass(status) {
  if (status === "Unavailable" || status === "Critical") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Low") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-green-100 text-green-700";
}

export default function InventoryStockTable({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-600">No inventory rows match this view.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Inventory Item</th>
            <th className="py-2 pr-4">Linked Menu Item</th>
            <th className="py-2 pr-4">Available</th>
            <th className="py-2 pr-4">Par</th>
            <th className="py-2 pr-4">Supplier</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventoryItemName} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
              <td className="py-3 pr-4 text-gray-700">{item.linkedMenuItem}</td>
              <td className="py-3 pr-4 text-gray-700">
                {item.amountAvailable} {item.unit}
              </td>
              <td className="py-3 pr-4 text-gray-700">
                {item.parLevel} {item.unit}
              </td>
              <td className="py-3 pr-4 text-gray-700">{item.supplier}</td>
              <td className="py-3 pr-4">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
