export default function ReportSection({ title, action, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
