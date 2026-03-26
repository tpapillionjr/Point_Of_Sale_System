import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { OrderHistorySection } from "../../components/back-office/BackOfficeSections";

export default function OrderHistoryPage() {
  return (
    <BackOfficeShell
      title="Order History"
      description="Review recent orders, statuses, and audit-sensitive activity."
    >
      <OrderHistorySection />
    </BackOfficeShell>
  );
}
