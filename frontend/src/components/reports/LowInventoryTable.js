export default function LowInventoryTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4">Available</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemName} className="border-b last:border-b-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{item.itemName}</td>
              <td className="py-3 pr-4 text-gray-700">{item.amountAvailable}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    item.status === "Critical"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
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