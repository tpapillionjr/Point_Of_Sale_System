import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function LaborPage() {
  return (
    <BackOfficeShell
      title="Labor"
      description="Manager-facing labor controls for shifts, attendance, and staff roles."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Labor Management">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Employee">
              <Input placeholder="Alice Johnson" />
            </Field>
            <Field label="Role">
              <Select defaultValue="server">
                <option value="server">Server</option>
                <option value="host">Host</option>
                <option value="cook">Cook</option>
                <option value="manager">Manager</option>
              </Select>
            </Field>
            <Field label="Shift Date">
              <Input type="date" />
            </Field>
            <Field label="Scheduled Hours">
              <Input type="number" step="0.5" placeholder="8" />
            </Field>
            <Field label="Hourly Rate">
              <Input type="number" step="0.01" placeholder="15.50" />
            </Field>
            <Field label="Status">
              <Select defaultValue="scheduled">
                <option value="scheduled">Scheduled</option>
                <option value="clocked-in">Clocked In</option>
                <option value="warning">Attendance Warning</option>
                <option value="approved-ot">Approved Overtime</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Manager Note">
              <Textarea placeholder="Document role changes, overtime approval, or attendance issues." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Save Labor Update</ActionButton>
          </div>
        </ReportSection>

        <ReportSection title="Labor Review Checklist">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Review late clock-ins before payroll close.</p>
            <p>Confirm open shifts are assigned before dinner service.</p>
            <p>Document missed breaks and manager overrides.</p>
            <p>Track overtime exposure before approving schedule changes.</p>
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
