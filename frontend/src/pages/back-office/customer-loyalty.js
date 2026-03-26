import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import { CustomerLoyaltySection } from "../../components/back-office/BackOfficeSections";

export default function CustomerLoyaltyPage() {
  return (
    <BackOfficeShell
      title="Customer Loyalty"
      description="Review stored customer records and loyalty-point balances."
    >
      <CustomerLoyaltySection />
    </BackOfficeShell>
  );
}
