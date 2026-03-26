import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function SettingsPage() {
  return (
    <BackOfficeShell
      title="Settings"
      description="Central place for POS business rules, taxes, receipt behavior, and configuration."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="System Settings">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Sales Tax %">
              <Input type="number" step="0.01" placeholder="8.25" />
            </Field>
            <Field label="Service Charge %">
              <Input type="number" step="0.01" placeholder="18" />
            </Field>
            <Field label="Default Tip Prompt">
              <Select defaultValue="20">
                <option value="18">18%</option>
                <option value="20">20%</option>
                <option value="22">22%</option>
                <option value="custom">Custom</option>
              </Select>
            </Field>
            <Field label="Receipt Prefix">
              <Input placeholder="LUMI" />
            </Field>
            <Field label="Void Approval">
              <Select defaultValue="manager">
                <option value="manager">Manager Required</option>
                <option value="supervisor">Supervisor or Manager</option>
                <option value="open">No Approval</option>
              </Select>
            </Field>
            <Field label="Kitchen Routing">
              <Select defaultValue="station">
                <option value="station">By Station</option>
                <option value="expo">Single Expo Queue</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Store Preference Notes">
              <Textarea placeholder="Document printer mapping, device behavior, or override policy changes." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Save Settings</ActionButton>
          </div>
        </ReportSection>

        <ReportSection title="Manager Controls">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Lock discount thresholds behind approval when margin pressure increases.</p>
            <p>Keep tax and surcharge changes logged before deployment to terminals.</p>
            <p>Review printer and kitchen routing after menu updates.</p>
            <p>Confirm receipt numbering rules before end-of-day close.</p>
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
