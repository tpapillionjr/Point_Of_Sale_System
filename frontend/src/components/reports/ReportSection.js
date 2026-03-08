export default function ReportSection({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}