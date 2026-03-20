export default function InventoryMenuCoverageTable({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-600">No linked menu items are available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Menu Item ID</th>
            <th className="py-2 pr-4">Menu Item</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Base Price</th>
            <th className="py-2 pr-4">Linked Inventory</th>
            <th className="py-2 pr-4">Stock Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.menuItemId}-${item.ingredient}`} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.menuItemId}</td>
              <td className="py-3 pr-4 text-gray-700">{item.menuItemName}</td>
              <td className="py-3 pr-4 text-gray-700">{item.category}</td>
              <td className="py-3 pr-4 text-gray-700">${item.basePrice.toFixed(2)}</td>
              <td className="py-3 pr-4 text-gray-700">{item.ingredient}</td>
              <td className="py-3 pr-4 text-gray-700">{item.stockStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
