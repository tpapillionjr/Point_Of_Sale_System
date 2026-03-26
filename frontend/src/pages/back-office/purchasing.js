import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { PurchasingSection } from "../../components/back-office/BackOfficeSections";

export default function PurchasingPage() {
  return (
    <BackOfficeShell
      title="Purchasing"
      description="Prioritize reorder decisions, projected cost, and menu-impacting shortages."
    >
      <PurchasingSection />
    </BackOfficeShell>
  );
}
