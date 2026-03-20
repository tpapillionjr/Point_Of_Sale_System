import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";

export default function MenuManagementPage() {
  return (
    <BackOfficeShell
      title="Menu Management"
      description="Admin workspace for menu items, modifiers, pricing, and 86ing items."
    >
      <ReportSection title="Planned Scope">
        <div className="space-y-3 text-gray-700">
          <p>Manage `Menu_Item`, `Modifier`, and `Menu_Item_Modifier` records.</p>
          <p>Toggle menu availability without deleting menu rows.</p>
          <p>Stage price changes and modifier combinations for manager approval.</p>
        </div>
      </ReportSection>
    </BackOfficeShell>
  );
}
