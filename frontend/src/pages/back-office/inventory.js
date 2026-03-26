import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { InventorySection } from "../../components/back-office/BackOfficeSections";

export default function InventoryPage() {
  return (
    <BackOfficeShell
      title="Inventory Dashboard"
      description="Monitor stock health, menu readiness, and ingredient usage from one manager view."
    >
      <InventorySection />
    </BackOfficeShell>
  );
}
