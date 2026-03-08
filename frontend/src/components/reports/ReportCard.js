export default function ReportCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h2 className="mt-2 text-2xl font-bold text-gray-900">{value}</h2>
    </div>
  );
}