import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { SettingsSection } from "../../components/back-office/BackOfficeSections";

export default function SettingsPage() {
  return (
    <BackOfficeShell
      title="Settings"
      description="Review the current persisted system state and configuration gaps."
    >
      <SettingsSection />
    </BackOfficeShell>
  );
}
