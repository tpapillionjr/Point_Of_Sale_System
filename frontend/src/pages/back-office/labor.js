import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";

export default function LaborPage() {
  return (
    <BackOfficeShell
      title="Labor"
      description="Manager-facing labor controls for shifts, attendance, and staff roles."
    >
      <ReportSection title="Planned Scope">
        <div className="space-y-3 text-gray-700">
          <p>Review `Users` by role and active status.</p>
          <p>Compare scheduled and actual shift data once `Employee_Shift` is wired in.</p>
          <p>Track late clock-ins, missed clock-outs, and overtime alerts.</p>
        </div>
      </ReportSection>
    </BackOfficeShell>
  );
}
