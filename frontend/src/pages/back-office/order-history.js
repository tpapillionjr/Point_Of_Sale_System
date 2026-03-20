import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";

export default function OrderHistoryPage() {
  return (
    <BackOfficeShell
      title="Order History"
      description="Search completed, paid, refunded, and voided checks for review."
    >
      <ReportSection title="Planned Scope">
        <div className="space-y-3 text-gray-700">
          <p>Receipt lookup by order ID, receipt number, table, employee, or date range.</p>
          <p>Void and refund review tied to `Orders` and `Payment` records.</p>
          <p>Reprint receipts and inspect order item details for disputes.</p>
        </div>
      </ReportSection>
    </BackOfficeShell>
  );
}
