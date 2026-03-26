import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function OrderHistoryPage() {
  return (
    <BackOfficeShell
      title="Order History"
      description="Search completed, paid, refunded, and voided checks for review."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Order Review">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Order ID">
              <Input placeholder="ORD-10492" />
            </Field>
            <Field label="Receipt Number">
              <Input placeholder="RCPT-8821" />
            </Field>
            <Field label="Table">
              <Input placeholder="T12" />
            </Field>
            <Field label="Employee">
              <Input placeholder="Jordan" />
            </Field>
            <Field label="Business Date">
              <Input type="date" />
            </Field>
            <Field label="Review Action">
              <Select defaultValue="review">
                <option value="review">Manager Review</option>
                <option value="refund">Refund Review</option>
                <option value="void">Void Review</option>
                <option value="reprint">Receipt Reprint</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Review Notes">
              <Textarea placeholder="Capture dispute details, guest communication, or approval notes." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Submit Review</ActionButton>
          </div>
        </ReportSection>

        <ReportSection title="Audit Focus">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Validate discount use against manager approvals.</p>
            <p>Inspect refund reason codes and payment tender mix.</p>
            <p>Confirm voids are tied to the correct employee and timestamp.</p>
            <p>Keep a note trail for receipt disputes and guest callbacks.</p>
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
