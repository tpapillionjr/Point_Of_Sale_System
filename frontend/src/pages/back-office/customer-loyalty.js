import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function CustomerLoyaltyPage() {
  return (
    <BackOfficeShell
      title="Customer Loyalty"
      description="Adjust guest profile details, loyalty balances, and service recovery notes."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Customer Lookup">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Customer Name">
              <Input placeholder="Taylor Smith" />
            </Field>
            <Field label="Phone or Email">
              <Input placeholder="taylor@example.com" />
            </Field>
            <Field label="Loyalty Tier">
              <Select defaultValue="silver">
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip">VIP</option>
              </Select>
            </Field>
            <Field label="Account Status">
              <Select defaultValue="active">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Customer Note">
              <Textarea placeholder="Update preferences, service recovery notes, or contact changes." />
            </Field>
          </div>
        </ReportSection>

        <ReportSection title="Loyalty Adjustment">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Current Points">
              <Input type="number" placeholder="420" />
            </Field>
            <Field label="Adjustment Type">
              <Select defaultValue="add">
                <option value="add">Add points</option>
                <option value="remove">Remove points</option>
                <option value="reward">Issue reward</option>
                <option value="expire">Expire balance</option>
              </Select>
            </Field>
            <Field label="Adjustment Amount">
              <Input type="number" placeholder="50" />
            </Field>
            <Field label="Reward / Offer">
              <Input placeholder="$10 comp or free appetizer" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Adjustment Reason">
              <Textarea placeholder="Document guest recovery, birthday reward, or manager-approved exception." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Save Customer Update</ActionButton>
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
