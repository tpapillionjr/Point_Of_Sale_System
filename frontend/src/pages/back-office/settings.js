import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";

export default function SettingsPage() {
  return (
    <BackOfficeShell
      title="Settings"
      description="Central place for POS business rules, taxes, receipt behavior, and configuration."
    >
      <ReportSection title="Planned Scope">
        <div className="space-y-3 text-gray-700">
          <p>Configure taxes, service charges, and payment defaults.</p>
          <p>Set manager-only permissions for voids, discounts, and overrides.</p>
          <p>Control receipt numbering, order routing, and store-level preferences.</p>
        </div>
      </ReportSection>
    </BackOfficeShell>
  );
}
