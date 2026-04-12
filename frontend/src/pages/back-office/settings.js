import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { SettingsSection } from "../../components/back-office/BackOfficeSections";

export default function SettingsPage() {
  return (
    <BackOfficeShell
      title="Settings"
      description="Manage taxes, receipt rules, and approval controls with persisted manager-only updates."
    >
      <SettingsSection />
    </BackOfficeShell>
  );
}
