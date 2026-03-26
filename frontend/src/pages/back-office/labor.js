import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { LaborSection } from "../../components/back-office/BackOfficeSections";

export default function LaborPage() {
  return (
    <BackOfficeShell
      title="Labor"
      description="Manager-facing labor controls for shifts, attendance, and active staffing."
    >
      <LaborSection />
    </BackOfficeShell>
  );
}
