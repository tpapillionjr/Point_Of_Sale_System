import BackOfficeShell from "../../components/back-office/BackOfficeShell";
import ReportSection from "../../components/reports/ReportSection";
import { ActionButton, Field, Input, Select, Textarea } from "../../components/back-office/BackOfficeForm";

export default function MenuManagementPage() {
  return (
    <BackOfficeShell
      title="Menu Management"
      description="Admin workspace for menu items, modifiers, pricing, and 86ing items."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Item Update">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Menu Item">
              <Input placeholder="Breakfast Burrito" />
            </Field>
            <Field label="Category">
              <Select defaultValue="entrees">
                <option value="entrees">Entrees</option>
                <option value="appetizers">Appetizers</option>
                <option value="sides">Sides</option>
                <option value="drinks">Drinks</option>
              </Select>
            </Field>
            <Field label="Price">
              <Input type="number" step="0.01" placeholder="14.99" />
            </Field>
            <Field label="Availability">
              <Select defaultValue="available">
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="eighty-six">86 Item</option>
              </Select>
            </Field>
            <Field label="Kitchen Station">
              <Select defaultValue="grill">
                <option value="grill">Grill</option>
                <option value="saute">Saute</option>
                <option value="cold-line">Cold Line</option>
                <option value="bar">Bar</option>
              </Select>
            </Field>
            <Field label="Modifier Group">
              <Input placeholder="Protein Add-ons" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Description / Notes">
              <Textarea placeholder="Note recipe, allergen, or pricing changes for approval." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Publish Menu Update</ActionButton>
          </div>
        </ReportSection>

        <ReportSection title="Modifier Adjustment">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Modifier Name">
              <Input placeholder="Add Avocado" />
            </Field>
            <Field label="Attached Items">
              <Input placeholder="Avocado Toast, Breakfast Burrito" />
            </Field>
            <Field label="Price Change">
              <Input type="number" step="0.01" placeholder="1.50" />
            </Field>
            <Field label="Reason">
              <Textarea placeholder="Vendor cost increase or promo pricing note." />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <ActionButton>Save Modifier Change</ActionButton>
          </div>
        </ReportSection>
      </div>
    </BackOfficeShell>
  );
}
