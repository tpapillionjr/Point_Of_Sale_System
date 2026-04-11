import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { MenuManagementSection } from "../../components/back-office/BackOfficeSections";

export default function MenuManagementPage() {
  return (
    <BackOfficeShell
      title="Menu Management"
      description="Review live menu items, pricing, photos, descriptions, allergens, and modifier availability."
    >
      <MenuManagementSection />
    </BackOfficeShell>
  );
}
