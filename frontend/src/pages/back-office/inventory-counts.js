import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { InventoryCountsSection } from "../../components/back-office/BackOfficeSections";

export default function InventoryCountsPage() {
  return (
    <BackOfficeShell
      title="Inventory Counts"
      description="Review tracked inventory levels, activity, and count-related alerts."
    >
      <InventoryCountsSection />
    </BackOfficeShell>
  );
}
