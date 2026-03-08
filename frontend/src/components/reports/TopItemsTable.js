export default function TopItemsTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4">Sold</th>
            <th className="py-2 pr-4">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.name}</td>
              <td className="py-3 pr-4 text-gray-700">{item.sold}</td>
              <td className="py-3 pr-4 text-gray-700">${item.revenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}