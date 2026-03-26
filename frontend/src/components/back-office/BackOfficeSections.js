import { useEffect, useState } from "react";
import FilterBar from "../reports/FilterBar";
import ReportCard from "../reports/ReportCard";
import ReportSection from "../reports/ReportSection";
import { cancelOrder, fetchBackOfficeData } from "../../lib/api";
import { getStoredEmployee } from "../../lib/session";

function SimpleTable({ headers, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            {headers.map((header) => (
              <th key={header} className="py-2 pr-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function ErrorState({ message }) {
  return <p className="text-sm text-red-600">{message}</p>;
}

function EmptyState({ message }) {
  return <p className="text-sm text-gray-600">{message}</p>;
}

function SummaryCards({ cards, isLoading, error, columns = "xl:grid-cols-4" }) {
  if (error) {
    return <ErrorState message={error} />;
  }

  const displayCards =
    isLoading || !cards?.length ? [{ title: "Loading", value: "..." }] : cards;

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${columns}`}>
      {displayCards.map((card) => (
        <ReportCard key={card.title} title={card.title} value={card.value} />
      ))}
    </div>
  );
}

function useBackOfficeData(range = "7days", refreshToken = 0) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const payload = await fetchBackOfficeData(range);
        if (!isMounted) {
          return;
        }

        setData(payload);
        setError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "Failed to load back office data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [range, refreshToken]);

  return { data, isLoading, error };
}

export function InventorySection() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const { data, isLoading, error } = useBackOfficeData(selectedRange);
  const inventory = data?.inventory;

  return (
    <>
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Inventory Snapshot">
        <SummaryCards cards={inventory?.summaryCards} isLoading={isLoading} error={error} columns="xl:grid-cols-5" />
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Reorder Watchlist">
          {error ? (
            <ErrorState message={error} />
          ) : inventory?.reorderRows?.length ? (
            <SimpleTable
              headers={["Inventory Item", "Current On Hand", "Suggested Order", "Menu Impact", "Priority"]}
              rows={inventory.reorderRows.slice(0, 8)}
              renderRow={(item) => (
                <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                  <td className="py-3 pr-4">{item.currentOnHand}</td>
                  <td className="py-3 pr-4">{item.suggestedOrder}</td>
                  <td className="py-3 pr-4">{item.linkedMenuItem}</td>
                  <td className="py-3 pr-4">{item.priority}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState message={isLoading ? "Loading inventory watchlist..." : "No reorder alerts are active."} />
          )}
        </ReportSection>

        <ReportSection title="Usage Snapshot">
          <SummaryCards cards={inventory?.usageSummary} isLoading={isLoading} error={error} columns="xl:grid-cols-2" />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Stock Watchlist">
          {error ? (
            <ErrorState message={error} />
          ) : inventory?.stockRows?.length ? (
            <SimpleTable
              headers={["Inventory Item", "Linked Menu Item", "Category", "Available", "Status"]}
              rows={inventory.stockRows.slice(0, 10)}
              renderRow={(item) => (
                <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                  <td className="py-3 pr-4">{item.linkedMenuItem}</td>
                  <td className="py-3 pr-4">{item.category}</td>
                  <td className="py-3 pr-4">{item.amountAvailable}</td>
                  <td className="py-3 pr-4">{item.status}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState message={isLoading ? "Loading stock rows..." : "No inventory rows are available."} />
          )}
        </ReportSection>

        <ReportSection title="Menu Coverage">
          {error ? (
            <ErrorState message={error} />
          ) : inventory?.menuCoverageRows?.length ? (
            <SimpleTable
              headers={["Menu Item ID", "Menu Item", "Category", "Base Price", "Inventory Status"]}
              rows={inventory.menuCoverageRows.slice(0, 10)}
              renderRow={(item) => (
                <tr key={`${item.menuItemId}-${item.inventoryItemName}`} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.menuItemId ?? "—"}</td>
                  <td className="py-3 pr-4">{item.linkedMenuItem}</td>
                  <td className="py-3 pr-4">{item.category}</td>
                  <td className="py-3 pr-4">${item.basePrice.toFixed(2)}</td>
                  <td className="py-3 pr-4">{item.status}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState message={isLoading ? "Loading menu coverage..." : "No linked menu coverage is available."} />
          )}
        </ReportSection>
      </div>

      <ReportSection title="High Usage Items">
        {error ? (
          <ErrorState message={error} />
        ) : inventory?.usageRows?.length ? (
          <SimpleTable
            headers={["Inventory Item", "Units Used", "Revenue", "Orders Impacted", "Risk"]}
            rows={inventory.usageRows.slice(0, 10)}
            renderRow={(item) => (
              <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                <td className="py-3 pr-4">{item.unitsUsed}</td>
                <td className="py-3 pr-4">${item.revenue.toFixed(2)}</td>
                <td className="py-3 pr-4">{item.orderCount}</td>
                <td className="py-3 pr-4">{item.depletionRisk}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading usage data..." : "No usage data is available."} />
        )}
      </ReportSection>
    </>
  );
}

export function InventoryCountsSection() {
  const { data, isLoading, error } = useBackOfficeData("7days");
  const inventory = data?.inventory;

  return (
    <>
      <ReportSection title="Count Session Summary">
        <SummaryCards cards={inventory?.countSummary} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Tracked Inventory Counts">
        {error ? (
          <ErrorState message={error} />
        ) : inventory?.stockRows?.length ? (
          <SimpleTable
            headers={["Inventory Item", "Current Count", "Linked Menu Item", "Status"]}
            rows={inventory.stockRows}
            renderRow={(item) => (
              <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                <td className="py-3 pr-4">{item.amountAvailable}</td>
                <td className="py-3 pr-4">{item.linkedMenuItem}</td>
                <td className="py-3 pr-4">{item.status}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading inventory counts..." : "No inventory counts are available."} />
        )}
      </ReportSection>
    </>
  );
}

export function PurchasingSection() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const { data, isLoading, error } = useBackOfficeData(selectedRange);
  const purchasing = data?.purchasing;

  return (
    <>
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Purchasing Summary">
        <SummaryCards cards={purchasing?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Recommended Reorders">
        {error ? (
          <ErrorState message={error} />
        ) : purchasing?.reorderRows?.length ? (
          <SimpleTable
            headers={["Inventory Item", "Current On Hand", "Suggested Order", "Estimated Cost", "Priority"]}
            rows={purchasing.reorderRows}
            renderRow={(item) => (
              <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                <td className="py-3 pr-4">{item.currentOnHand}</td>
                <td className="py-3 pr-4">{item.suggestedOrder}</td>
                <td className="py-3 pr-4">${item.estimatedCost.toFixed(2)}</td>
                <td className="py-3 pr-4">{item.priority}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading purchasing queue..." : "No purchasing recommendations right now."} />
        )}
      </ReportSection>
    </>
  );
}

export function LaborSection() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const { data, isLoading, error } = useBackOfficeData(selectedRange);
  const labor = data?.labor;

  return (
    <>
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Labor Snapshot">
        <SummaryCards cards={labor?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Team Scheduling and Attendance">
        {error ? (
          <ErrorState message={error} />
        ) : labor?.employees?.length ? (
          <SimpleTable
            headers={["Employee", "Role", "Shifts Scheduled", "Shifts Clocked", "Clocked In Now", "Tips Declared"]}
            rows={labor.employees}
            renderRow={(item) => (
              <tr key={item.userId} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.name}</td>
                <td className="py-3 pr-4">{item.role}</td>
                <td className="py-3 pr-4">{item.shiftsScheduled}</td>
                <td className="py-3 pr-4">{item.shiftsClocked}</td>
                <td className="py-3 pr-4">{item.currentlyClockedIn ? "Yes" : "No"}</td>
                <td className="py-3 pr-4">${item.tipsDeclared.toFixed(2)}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading labor data..." : "No labor data is available."} />
        )}
      </ReportSection>
    </>
  );
}

export function MenuManagementSection() {
  const { data, isLoading, error } = useBackOfficeData("30days");
  const menu = data?.menu;

  return (
    <>
      <ReportSection title="Menu Snapshot">
        <SummaryCards cards={menu?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Menu Items">
          {error ? (
            <ErrorState message={error} />
          ) : menu?.items?.length ? (
            <SimpleTable
              headers={["ID", "Name", "Category", "Base Price", "Status"]}
              rows={menu.items.slice(0, 16)}
              renderRow={(item) => (
                <tr key={item.menuItemId} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.menuItemId}</td>
                  <td className="py-3 pr-4">{item.name}</td>
                  <td className="py-3 pr-4">{item.category}</td>
                  <td className="py-3 pr-4">${item.basePrice.toFixed(2)}</td>
                  <td className="py-3 pr-4">{item.status}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState message={isLoading ? "Loading menu items..." : "No menu items are available."} />
          )}
        </ReportSection>

        <ReportSection title="Modifiers">
          {error ? (
            <ErrorState message={error} />
          ) : menu?.modifiers?.length ? (
            <SimpleTable
              headers={["ID", "Modifier", "Price", "Status"]}
              rows={menu.modifiers}
              renderRow={(item) => (
                <tr key={item.modifierId} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.modifierId}</td>
                  <td className="py-3 pr-4">{item.name}</td>
                  <td className="py-3 pr-4">${item.price.toFixed(2)}</td>
                  <td className="py-3 pr-4">{item.status}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState message={isLoading ? "Loading modifiers..." : "No modifiers are available."} />
          )}
        </ReportSection>
      </div>
    </>
  );
}

export function OrderHistorySection() {
  const [selectedRange, setSelectedRange] = useState("7days");
  const [refreshToken, setRefreshToken] = useState(0);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const { data, isLoading, error } = useBackOfficeData(selectedRange, refreshToken);
  const orders = data?.orders;

  async function handleManagerCancel(orderId) {
    const employee = getStoredEmployee();
    if (!employee?.userId || employee.role !== "manager") {
      setCancelError("Only a logged-in manager can cancel an active order.");
      return;
    }

    setCancelingOrderId(orderId);
    setCancelError("");
    setCancelMessage("");

    try {
      await cancelOrder({
        orderId,
        voidedBy: employee.userId,
        voidReason: "Manager canceled active order from back office",
      });

      setCancelMessage(`Order #${orderId} was canceled successfully.`);
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setCancelError(actionError.message || "Failed to cancel the order.");
    } finally {
      setCancelingOrderId(null);
    }
  }

  return (
    <>
      <FilterBar selectedRange={selectedRange} onChange={setSelectedRange} />

      <ReportSection title="Order Review Snapshot">
        <SummaryCards cards={orders?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Recent Orders">
        {cancelMessage ? <p className="mb-4 text-sm text-green-700">{cancelMessage}</p> : null}
        {cancelError ? <p className="mb-4 text-sm text-red-600">{cancelError}</p> : null}
        {error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {orders?.activeOrders?.length ? (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Active Tickets
                </h3>
                <div className="space-y-3">
                  {orders.activeOrders.map((item) => (
                    <div
                      key={`active-${item.orderId}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="font-semibold text-gray-900">
                            {item.receiptNumber} · Table {item.tableNumber}
                          </p>
                          <p>
                            Server: {item.employeeName} · Status: {item.status} · Total: $
                            {item.total.toFixed(2)}
                          </p>
                          <p>Created: {item.createdAt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleManagerCancel(item.orderId)}
                          disabled={cancelingOrderId === item.orderId}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {cancelingOrderId === item.orderId ? "Canceling..." : "Manager Cancel"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {orders?.recentOrders?.length ? (
              <SimpleTable
                headers={["Order", "Receipt", "Table", "Employee", "Total", "Status", "Created"]}
                rows={orders.recentOrders}
                renderRow={(item) => (
                  <tr key={item.orderId} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-gray-800">{item.orderId}</td>
                    <td className="py-3 pr-4">{item.receiptNumber}</td>
                    <td className="py-3 pr-4">{item.tableNumber}</td>
                    <td className="py-3 pr-4">{item.employeeName}</td>
                    <td className="py-3 pr-4">${item.total.toFixed(2)}</td>
                    <td className="py-3 pr-4">{item.status}</td>
                    <td className="py-3 pr-4">{item.createdAt}</td>
                  </tr>
                )}
              />
            ) : (
              <EmptyState message={isLoading ? "Loading orders..." : "No orders were found for this range."} />
            )}
          </>
        )}
      </ReportSection>
    </>
  );
}

export function CustomerLoyaltySection() {
  const { data, isLoading, error } = useBackOfficeData("30days");
  const customers = data?.customers;

  return (
    <>
      <ReportSection title="Customer Snapshot">
        <SummaryCards cards={customers?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Customer Records">
        {error ? (
          <ErrorState message={error} />
        ) : customers?.customers?.length ? (
          <SimpleTable
            headers={["Customer ID", "Phone Number", "Points Balance"]}
            rows={customers.customers}
            renderRow={(item) => (
              <tr key={item.customerId} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.customerId}</td>
                <td className="py-3 pr-4">{item.phoneNumber}</td>
                <td className="py-3 pr-4">{item.pointsBalance}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading customer records..." : "No customer records are available."} />
        )}
      </ReportSection>
    </>
  );
}

export function SettingsSection() {
  const { data, isLoading, error } = useBackOfficeData("7days");
  const settings = data?.settings;

  return (
    <>
      <ReportSection title="System Snapshot">
        <SummaryCards cards={settings?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Current System Notes">
        {error ? (
          <ErrorState message={error} />
        ) : settings?.notes?.length ? (
          <div className="space-y-3 text-sm text-gray-700">
            {settings.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : (
          <EmptyState message={isLoading ? "Loading settings..." : "No settings notes are available."} />
        )}
      </ReportSection>
    </>
  );
}
