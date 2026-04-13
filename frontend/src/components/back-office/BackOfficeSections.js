/* eslint-disable @next/next/no-img-element */
import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import ReportCard from "../reports/ReportCard";
import ReportSection from "../reports/ReportSection";
import {
  adjustLoyaltyPoints,
  cancelOrder,
  fetchCustomerOrdersBackOffice,
  confirmOnlineOrder,
  createLoyaltyReward,
  createLaborShift,
  createMenuItem,
  fetchBackOfficeData,
  fetchBackOfficeSettings,
  fetchItems,
  fetchLoyaltyRewards,
  fetchUsers,
  markOnlineOrderPaid,
  markOnlineOrderPickedUp,
  deleteOnlineOrder,
  receivePurchasingStock,
  toggleLoyaltyReward,
  toggleMenuItemActive,
  updateBackOfficeSettings,
  updateLaborShift,
  updateInventoryItemAmount,
  updateLoyaltyReward,
  updateMenuItem,
} from "../../lib/api";
import { MENU_CATEGORIES, normalizeMenuCategory } from "../../lib/menuCategories";
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

function formatSettingsTimestamp(value) {
  if (!value) {
    return "Using default value";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLaborDateTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function createDefaultDateRange() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  };
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 2v3M17 2v3M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2 8h3v3H7Zm5 0h3v3h-3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BackOfficeFilterBar({ filters, onChange, onApply }) {
  const iconClass = "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400";

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Back Office Filters</p>
          <p className="mt-2 text-sm text-gray-600">Choose the date range for this management view.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Start Date</span>
            <div className="relative">
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className={iconClass}><CalendarIcon /></span>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">End Date</span>
            <div className="relative">
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className={iconClass}><CalendarIcon /></span>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
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

function InventoryTypeTabs({ selectedType, onChange }) {
  const tabs = [
    { id: "menu", label: "Menu Items" },
    { id: "utensils", label: "Utensils" },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 font-medium transition ${
            selectedType === tab.id
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function buildInventorySummaries(stockRows, usageRows, lastActivityLabel) {
  const lowStockCount = stockRows.filter((item) => item.status === "Low" || item.status === "Critical").length;
  const unavailableCount = stockRows.filter((item) => item.status === "Unavailable").length;
  const totalOnHandUnits = stockRows.reduce((sum, item) => sum + Number(item.amountAvailable || 0), 0);
  const linkedCount = stockRows.filter((item) => item.linkedMenuItem && item.linkedMenuItem !== "Unlinked").length;
  const totalUnitsUsed = usageRows.reduce((sum, item) => sum + Number(item.unitsUsed || 0), 0);
  const totalRevenue = usageRows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const totalOrdersImpacted = usageRows.reduce((sum, item) => sum + Number(item.orderCount || 0), 0);
  const topUsageItem =
    [...usageRows].sort((a, b) => Number(b.unitsUsed || 0) - Number(a.unitsUsed || 0))[0]?.inventoryItemName ??
    "No data";

  return {
    summaryCards: [
      { title: "Inventory SKUs", value: String(stockRows.length) },
      { title: "On Hand Units", value: String(totalOnHandUnits) },
      { title: "Low Stock Alerts", value: String(lowStockCount) },
      { title: "Unavailable Items", value: String(unavailableCount) },
      { title: "Links Active", value: `${linkedCount}/${stockRows.length || 0}` },
    ],
    usageSummary: [
      { title: "Tracked Items", value: String(usageRows.length) },
      { title: "Units Used", value: String(totalUnitsUsed) },
      { title: "Revenue Tied to Inventory", value: `$${totalRevenue.toFixed(2)}` },
      { title: "Orders Impacted", value: String(totalOrdersImpacted) },
      { title: "Top Usage Item", value: topUsageItem },
    ],
    countSummary: [
      { title: "Items Tracked", value: String(stockRows.length) },
      { title: "Variance Flags", value: String(lowStockCount + unavailableCount) },
      { title: "Pending Recounts", value: String(unavailableCount) },
      { title: "Last Inventory Activity", value: lastActivityLabel ?? "—" },
    ],
  };
}

const EMPTY_INVENTORY_FORM = {
  inventoryItemName: "",
  amountAvailable: "",
  menuItemId: "",
  reorderThreshold: "10",
  availabilityStatus: true,
};

function useBackOfficeData(range = createDefaultDateRange(), refreshToken = 0) {
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
  const [draftFilters, setDraftFilters] = useState(createDefaultDateRange);
  const [selectedRange, setSelectedRange] = useState(createDefaultDateRange);
  const [selectedType, setSelectedType] = useState("menu");
  const [selectedInventoryFilter, setSelectedInventoryFilter] = useState("All");
  const [refreshToken, setRefreshToken] = useState(0);
  const [menuItemOptions, setMenuItemOptions] = useState([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryForm, setInventoryForm] = useState(EMPTY_INVENTORY_FORM);
  const [inventoryFormError, setInventoryFormError] = useState("");
  const [inventoryActionMessage, setInventoryActionMessage] = useState("");
  const [savingInventory, setSavingInventory] = useState(false);
  const [deletingInventoryItem, setDeletingInventoryItem] = useState("");
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [menuItemSearchTerm, setMenuItemSearchTerm] = useState("");
  const [countDrafts, setCountDrafts] = useState({});
  const [savingCountItem, setSavingCountItem] = useState("");
  const { data, isLoading, error } = useBackOfficeData(selectedRange, refreshToken);
  const inventory = data?.inventory;
  const isUtensils = selectedType === "utensils";

  useEffect(() => {
    setSelectedInventoryFilter("All");
  }, [selectedType]);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuItems() {
      try {
        const rows = await fetchItems();
        if (isMounted) {
          setMenuItemOptions(rows);
        }
      } catch {
        if (isMounted) {
          setMenuItemOptions([]);
        }
      }
    }

    loadMenuItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const typeStockRows = (inventory?.stockRows ?? []).filter((item) =>
    isUtensils ? item.category === "Utensils" : item.category !== "Utensils"
  );
  const inventoryFilterOptions = [...new Set(typeStockRows.map((item) => item.category || "Uncategorized"))].sort();
  const stockRows = typeStockRows.filter((item) =>
    (selectedInventoryFilter === "All" ? true : (item.category || "Uncategorized") === selectedInventoryFilter) &&
    (inventorySearchTerm.trim()
      ? [
          item.inventoryItemName,
          item.linkedMenuItem,
          item.category,
          item.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(inventorySearchTerm.trim().toLowerCase()))
      : true)
  );
  const stockRowNames = new Set(stockRows.map((item) => item.inventoryItemName));
  const reorderRows = (inventory?.reorderRows ?? []).filter((item) => stockRowNames.has(item.inventoryItemName));
  const usageRows = (inventory?.usageRows ?? []).filter((item) =>
    stockRowNames.has(item.inventoryItemName)
  );
  const menuCoverageRows = (inventory?.menuCoverageRows ?? []).filter((item) =>
    isUtensils
      ? item.category === "Utensils" && (selectedInventoryFilter === "All" || item.category === selectedInventoryFilter)
      : item.category !== "Utensils" && (selectedInventoryFilter === "All" || item.category === selectedInventoryFilter)
  );
  const filteredSummaries = buildInventorySummaries(
    stockRows,
    usageRows,
    inventory?.countSummary?.find((card) => card.title === "Last Inventory Activity")?.value
  );
  const filteredMenuItemOptions = menuItemOptions.filter((item) =>
    menuItemSearchTerm.trim()
      ? [item.name, item.category, item.menuItemId].some((value) =>
          String(value ?? "").toLowerCase().includes(menuItemSearchTerm.trim().toLowerCase())
        )
      : true
  );

  function openInventoryForm() {
    setInventoryForm(EMPTY_INVENTORY_FORM);
    setInventoryFormError("");
    setInventoryActionMessage("");
    setShowInventoryForm(true);
  }

  function closeInventoryForm() {
    setInventoryForm(EMPTY_INVENTORY_FORM);
    setInventoryFormError("");
    setShowInventoryForm(false);
  }

  async function handleCreateInventoryItem() {
    if (!inventoryForm.inventoryItemName.trim()) {
      setInventoryFormError("Inventory item name is required.");
      return;
    }

    const amountAvailable = Number(inventoryForm.amountAvailable);
    if (!Number.isInteger(amountAvailable) || amountAvailable < 0) {
      setInventoryFormError("Amount available must be a non-negative whole number.");
      return;
    }

    if (!isUtensils && !inventoryForm.menuItemId) {
      setInventoryFormError("Choose the menu item this inventory supports.");
      return;
    }

    const reorderThreshold = Number(inventoryForm.reorderThreshold);
    if (isUtensils && (!Number.isInteger(reorderThreshold) || reorderThreshold < 0)) {
      setInventoryFormError("Reorder threshold must be a non-negative whole number.");
      return;
    }

    setSavingInventory(true);
    setInventoryFormError("");
    try {
      await createInventoryItem({
        type: selectedType,
        inventoryItemName: inventoryForm.inventoryItemName.trim(),
        amountAvailable,
        menuItemId: isUtensils ? undefined : Number(inventoryForm.menuItemId),
        reorderThreshold: isUtensils ? reorderThreshold : undefined,
        availabilityStatus: inventoryForm.availabilityStatus,
      });

      setInventoryActionMessage(`"${inventoryForm.inventoryItemName.trim()}" added.`);
      closeInventoryForm();
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setInventoryFormError(actionError.message || "Failed to add inventory item.");
    } finally {
      setSavingInventory(false);
    }
  }

  async function handleDeleteInventoryItem(item) {
    if (!window.confirm(`Delete "${item.inventoryItemName}" from inventory?`)) {
      return;
    }

    setDeletingInventoryItem(item.inventoryItemName);
    setInventoryActionMessage("");
    try {
      await deleteInventoryItem(selectedType, item.inventoryItemName);
      setInventoryActionMessage(`"${item.inventoryItemName}" deleted.`);
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setInventoryActionMessage(`Error: ${actionError.message}`);
    } finally {
      setDeletingInventoryItem("");
    }
  }

  async function handleUpdateInventoryCount(item) {
    const draftValue = countDrafts[item.inventoryItemName] ?? String(item.amountAvailable);
    const amountAvailable = Number(draftValue);
    if (!Number.isInteger(amountAvailable) || amountAvailable < 0) {
      setInventoryActionMessage("Error: Amount available must be a non-negative whole number.");
      return;
    }

    setSavingCountItem(item.inventoryItemName);
    setInventoryActionMessage("");
    try {
      await updateInventoryItemAmount(selectedType, item.inventoryItemName, amountAvailable);
      setInventoryActionMessage(`"${item.inventoryItemName}" count updated.`);
      setCountDrafts((current) => {
        const next = { ...current };
        delete next[item.inventoryItemName];
        return next;
      });
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setInventoryActionMessage(`Error: ${actionError.message}`);
    } finally {
      setSavingCountItem("");
    }
  }

  return (
    <>
      <BackOfficeFilterBar filters={draftFilters} onChange={setDraftFilters} onApply={() => setSelectedRange(draftFilters)} />
      <InventoryTypeTabs selectedType={selectedType} onChange={setSelectedType} />

      {inventoryActionMessage ? (
        <p
          className={`mb-4 rounded px-4 py-2 text-sm font-medium ${
            inventoryActionMessage.startsWith("Error:")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {inventoryActionMessage}
        </p>
      ) : null}

      <ReportSection
        title="Inventory Snapshot"
        action={
          <button
            type="button"
            onClick={openInventoryForm}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add {isUtensils ? "Utensil" : "Inventory Item"}
          </button>
        }
      >
        {typeStockRows.length ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedInventoryFilter("All")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                selectedInventoryFilter === "All"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({typeStockRows.length})
            </button>
            {inventoryFilterOptions.map((category) => {
              const count = typeStockRows.filter((item) => (item.category || "Uncategorized") === category).length;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedInventoryFilter(category)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                    selectedInventoryFilter === category
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-gray-700">Search Stock Items</label>
          <input
            type="search"
            value={inventorySearchTerm}
            onChange={(event) => setInventorySearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by stock item, linked menu item, category, or status"
          />
        </div>
        <SummaryCards
          cards={filteredSummaries.summaryCards}
          isLoading={isLoading}
          error={error}
          columns="xl:grid-cols-5"
        />
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Reorder Watchlist">
          {error ? (
            <ErrorState message={error} />
          ) : reorderRows.length ? (
            <SimpleTable
              headers={["Inventory Item", "Current On Hand", "Suggested Order", "Menu Impact", "Priority"]}
              rows={reorderRows.slice(0, 8)}
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
            <EmptyState
              message={
                isLoading
                  ? "Loading inventory watchlist..."
                  : `No reorder alerts are active for ${isUtensils ? "utensils" : "menu inventory"}.`
              }
            />
          )}
        </ReportSection>

        <ReportSection title="Usage Snapshot">
          <SummaryCards
            cards={filteredSummaries.usageSummary}
            isLoading={isLoading}
            error={error}
            columns="xl:grid-cols-3"
          />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Stock Watchlist">
          {error ? (
            <ErrorState message={error} />
          ) : stockRows.length ? (
            <SimpleTable
              headers={["Inventory Item", "Linked Menu Item", "Category", "Available", "Status", "Actions"]}
              rows={stockRows}
              renderRow={(item) => (
                <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                  <td className="py-3 pr-4">{item.linkedMenuItem}</td>
                  <td className="py-3 pr-4">{item.category}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={countDrafts[item.inventoryItemName] ?? String(item.amountAvailable)}
                      onChange={(event) =>
                        setCountDrafts((current) => ({
                          ...current,
                          [item.inventoryItemName]: event.target.value,
                        }))
                      }
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 pr-4">{item.status}</td>
                  <td className="flex gap-2 py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleUpdateInventoryCount(item)}
                      disabled={savingCountItem === item.inventoryItemName}
                      className="rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {savingCountItem === item.inventoryItemName ? "Saving..." : "Save Count"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteInventoryItem(item)}
                      disabled={deletingInventoryItem === item.inventoryItemName}
                      className="rounded px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingInventoryItem === item.inventoryItemName ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState
              message={
                isLoading
                  ? "Loading stock rows..."
                  : `No ${isUtensils ? "utensil" : "menu"} inventory rows are available.`
              }
            />
          )}
        </ReportSection>

        <ReportSection title={isUtensils ? "Utensil Coverage" : "Menu Coverage"}>
          {error ? (
            <ErrorState message={error} />
          ) : menuCoverageRows.length ? (
            <SimpleTable
              headers={["Menu Item ID", "Menu Item", "Category", "Base Price", "Inventory Status"]}
              rows={menuCoverageRows.slice(0, 10)}
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
            <EmptyState
              message={
                isLoading
                  ? "Loading coverage..."
                  : `No linked ${isUtensils ? "utensil" : "menu"} coverage is available.`
              }
            />
          )}
        </ReportSection>
      </div>

      <ReportSection title={isUtensils ? "Utensil Usage" : "High Usage Items"}>
        {error ? (
          <ErrorState message={error} />
        ) : usageRows.length ? (
          <SimpleTable
            headers={["Inventory Item", "Units Used", "Revenue", "Orders Impacted", "Risk"]}
            rows={usageRows.slice(0, 10)}
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
          <EmptyState
            message={
              isLoading
                ? "Loading usage data..."
                : `No ${isUtensils ? "utensil" : "menu inventory"} usage data is available.`
            }
          />
        )}
      </ReportSection>

      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-lg font-bold text-gray-900">
              Add {isUtensils ? "Utensil" : "Inventory Item"}
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Name *</label>
                <input
                  type="text"
                  value={inventoryForm.inventoryItemName}
                  onChange={(event) => setInventoryForm({ ...inventoryForm, inventoryItemName: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isUtensils ? "e.g. To-Go Cup Lids" : "e.g. Burger Buns"}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Amount Available *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={inventoryForm.amountAvailable}
                  onChange={(event) => setInventoryForm({ ...inventoryForm, amountAvailable: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {isUtensils ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryForm.reorderThreshold}
                    onChange={(event) => setInventoryForm({ ...inventoryForm, reorderThreshold: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Search Menu Items</label>
                  <input
                    type="search"
                    value={menuItemSearchTerm}
                    onChange={(event) => setMenuItemSearchTerm(event.target.value)}
                    className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type to narrow the menu item list"
                  />
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Linked Menu Item *</label>
                  <select
                    value={inventoryForm.menuItemId}
                    onChange={(event) => setInventoryForm({ ...inventoryForm, menuItemId: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select menu item</option>
                    {filteredMenuItemOptions.map((item) => (
                      <option key={item.menuItemId} value={item.menuItemId}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={inventoryForm.availabilityStatus}
                  onChange={(event) => setInventoryForm({ ...inventoryForm, availabilityStatus: event.target.checked })}
                />
                Available for ordering
              </label>
            </div>

            {inventoryFormError ? <p className="mt-3 text-sm text-red-600">{inventoryFormError}</p> : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCreateInventoryItem}
                disabled={savingInventory}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingInventory ? "Saving..." : "Add Item"}
              </button>
              <button
                type="button"
                onClick={closeInventoryForm}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function InventoryCountsSection() {
  const [selectedType, setSelectedType] = useState("menu");
  const [selectedCountFilter, setSelectedCountFilter] = useState("All");
  const [countSearchTerm, setCountSearchTerm] = useState("");
  const { data, isLoading, error } = useBackOfficeData("7days");
  const inventory = data?.inventory;
  const typeStockRows = (inventory?.stockRows ?? []).filter((item) =>
    selectedType === "utensils" ? item.category === "Utensils" : item.category !== "Utensils"
  );
  const countFilterOptions = [...new Set(typeStockRows.map((item) => item.category || "Uncategorized"))].sort();
  const stockRows = typeStockRows.filter((item) =>
    (selectedCountFilter === "All" ? true : (item.category || "Uncategorized") === selectedCountFilter) &&
    (countSearchTerm.trim()
      ? [
          item.inventoryItemName,
          item.linkedMenuItem,
          item.category,
          item.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(countSearchTerm.trim().toLowerCase()))
      : true)
  );
  const usageRows = (inventory?.usageRows ?? []).filter((item) =>
    stockRows.some((stockItem) => stockItem.inventoryItemName === item.inventoryItemName)
  );
  const filteredSummaries = buildInventorySummaries(
    stockRows,
    usageRows,
    inventory?.countSummary?.find((card) => card.title === "Last Inventory Activity")?.value
  );

  return (
    <>
      <InventoryTypeTabs
        selectedType={selectedType}
        onChange={(nextType) => {
          setSelectedType(nextType);
          setSelectedCountFilter("All");
          setCountSearchTerm("");
        }}
      />

      <ReportSection title="Count Session Summary">
        <SummaryCards cards={filteredSummaries.countSummary} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title={selectedType === "utensils" ? "Tracked Utensil Counts" : "Tracked Inventory Counts"}>
        {typeStockRows.length ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCountFilter("All")}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                selectedCountFilter === "All"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({typeStockRows.length})
            </button>
            {countFilterOptions.map((category) => {
              const count = typeStockRows.filter((item) => (item.category || "Uncategorized") === category).length;
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCountFilter(category)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                    selectedCountFilter === category
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-gray-700">Search Counts</label>
          <input
            type="search"
            value={countSearchTerm}
            onChange={(event) => setCountSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by stock item, linked menu item, category, or status"
          />
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : stockRows.length ? (
          <SimpleTable
            headers={["Inventory Item", "Current Count", "Linked Menu Item", "Status"]}
            rows={stockRows}
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
          <EmptyState
            message={
              isLoading
                ? "Loading inventory counts..."
                : `No ${selectedType === "utensils" ? "utensil" : "menu"} counts are available.`
            }
          />
        )}
      </ReportSection>
    </>
  );
}

export function PurchasingSection() {
  const [draftFilters, setDraftFilters] = useState(createDefaultDateRange);
  const [selectedRange, setSelectedRange] = useState(createDefaultDateRange);
  const [refreshToken, setRefreshToken] = useState(0);
  const [orderedItems, setOrderedItems] = useState({});
  const [purchasingMessage, setPurchasingMessage] = useState("");
  const [purchasingError, setPurchasingError] = useState("");
  const [receivingItem, setReceivingItem] = useState(null);
  const { data, isLoading, error } = useBackOfficeData(selectedRange, refreshToken);
  const purchasing = data?.purchasing;

  async function handleReceive(item) {
    setPurchasingMessage("");
    setPurchasingError("");
    setReceivingItem(item.inventoryItemName);

    try {
      await receivePurchasingStock({
        type: item.category === "Utensils" ? "utensils" : "menu",
        inventoryItemName: item.inventoryItemName,
        quantityReceived: item.suggestedOrder,
      });
      setOrderedItems((current) => ({ ...current, [item.inventoryItemName]: false }));
      setPurchasingMessage(`${item.suggestedOrder} units received for ${item.inventoryItemName}.`);
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setPurchasingError(actionError.message || "Failed to receive stock.");
    } finally {
      setReceivingItem(null);
    }
  }

  return (
    <>
      <BackOfficeFilterBar filters={draftFilters} onChange={setDraftFilters} onApply={() => setSelectedRange(draftFilters)} />

      <ReportSection title="Purchasing Summary">
        <SummaryCards cards={purchasing?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Recommended Reorders">
        {purchasingMessage ? <p className="mb-4 text-sm text-green-700">{purchasingMessage}</p> : null}
        {purchasingError ? <p className="mb-4 text-sm text-red-600">{purchasingError}</p> : null}
        {error ? (
          <ErrorState message={error} />
        ) : purchasing?.reorderRows?.length ? (
          <SimpleTable
            headers={["Inventory Item", "Current On Hand", "Suggested Order", "Estimated Cost", "Priority", "Actions"]}
            rows={purchasing.reorderRows}
            renderRow={(item) => (
              <tr key={item.inventoryItemName} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.inventoryItemName}</td>
                <td className="py-3 pr-4">{item.currentOnHand}</td>
                <td className="py-3 pr-4">{item.suggestedOrder}</td>
                <td className="py-3 pr-4">${item.estimatedCost.toFixed(2)}</td>
                <td className="py-3 pr-4">{item.priority}</td>
                <td className="flex flex-wrap gap-2 py-3 pr-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderedItems((current) => ({ ...current, [item.inventoryItemName]: true }));
                      setPurchasingMessage(`${item.inventoryItemName} marked as ordered.`);
                      setPurchasingError("");
                    }}
                    className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    {orderedItems[item.inventoryItemName] ? "Ordered" : "Mark Ordered"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReceive(item)}
                    disabled={receivingItem === item.inventoryItemName}
                    className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                  >
                    {receivingItem === item.inventoryItemName ? "Receiving..." : "Receive Stock"}
                  </button>
                </td>
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
  const [draftFilters, setDraftFilters] = useState(createDefaultDateRange);
  const [selectedRange, setSelectedRange] = useState(createDefaultDateRange);
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, isLoading, error } = useBackOfficeData(selectedRange, refreshToken);
  const labor = data?.labor;
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [shiftForm, setShiftForm] = useState({
    userId: "",
    scheduledStart: "",
    scheduledEnd: "",
  });
  const [laborMessage, setLaborMessage] = useState("");
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [updatingShiftId, setUpdatingShiftId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const rows = await fetchUsers();
        if (!isMounted) {
          return;
        }

        setUsers(rows.filter((user) => user.is_active !== false));
        setUsersError("");
      } catch (loadError) {
        if (isMounted) {
          setUsersError(loadError.message || "Failed to load employees.");
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateShift() {
    if (!shiftForm.userId || !shiftForm.scheduledStart || !shiftForm.scheduledEnd) {
      setLaborMessage("Error: Employee, start, and end are required.");
      return;
    }

    try {
      setIsCreatingShift(true);
      setLaborMessage("");
      await createLaborShift(shiftForm);
      setShiftForm({ userId: "", scheduledStart: "", scheduledEnd: "" });
      setRefreshToken((current) => current + 1);
      setLaborMessage("Shift scheduled.");
    } catch (createError) {
      setLaborMessage(`Error: ${createError.message || "Failed to schedule shift."}`);
    } finally {
      setIsCreatingShift(false);
    }
  }

  async function handleUpdateShift(shiftId, payload, successMessage) {
    try {
      setUpdatingShiftId(shiftId);
      setLaborMessage("");
      await updateLaborShift(shiftId, payload);
      setRefreshToken((current) => current + 1);
      setLaborMessage(successMessage);
    } catch (updateError) {
      setLaborMessage(`Error: ${updateError.message || "Failed to update shift."}`);
    } finally {
      setUpdatingShiftId(null);
    }
  }

  return (
    <>
      <BackOfficeFilterBar filters={draftFilters} onChange={setDraftFilters} onApply={() => setSelectedRange(draftFilters)} />

      <ReportSection title="Labor Snapshot">
        <SummaryCards cards={labor?.summaryCards} isLoading={isLoading} error={error} columns="xl:grid-cols-5" />
      </ReportSection>

      <ReportSection title="Labor Write Actions">
        {laborMessage ? (
          <p
            className={`mb-4 rounded px-4 py-2 text-sm font-medium ${
              laborMessage.startsWith("Error:")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {laborMessage}
          </p>
        ) : null}

        {usersError ? <ErrorState message={usersError} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.4fr)]">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Schedule Shift</h3>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Employee</span>
              <select
                value={shiftForm.userId}
                onChange={(event) => setShiftForm((current) => ({ ...current, userId: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose employee</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Scheduled Start</span>
              <input
                type="datetime-local"
                value={shiftForm.scheduledStart}
                onChange={(event) => setShiftForm((current) => ({ ...current, scheduledStart: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Scheduled End</span>
              <input
                type="datetime-local"
                value={shiftForm.scheduledEnd}
                onChange={(event) => setShiftForm((current) => ({ ...current, scheduledEnd: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateShift}
                disabled={isCreatingShift}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingShift ? "Scheduling..." : "Schedule Shift"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Shift Attendance</h3>
            {error ? (
              <ErrorState message={error} />
            ) : labor?.shifts?.length ? (
              <SimpleTable
                headers={["Employee", "Scheduled", "Clock In", "Clock Out", "Actions"]}
                rows={labor.shifts}
                renderRow={(shift) => (
                  <tr key={shift.shiftId} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-gray-800">{shift.name}</td>
                    <td className="py-3 pr-4 text-sm">
                      {formatLaborDateTime(shift.scheduledStart)} to {formatLaborDateTime(shift.scheduledEnd)}
                    </td>
                    <td className="py-3 pr-4">{formatLaborDateTime(shift.clockIn)}</td>
                    <td className="py-3 pr-4">{formatLaborDateTime(shift.clockOut)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateShift(shift.shiftId, { clockIn: new Date().toISOString() }, "Shift clocked in.")
                          }
                          disabled={updatingShiftId === shift.shiftId || Boolean(shift.clockIn)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          Clock In
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateShift(shift.shiftId, { clockOut: new Date().toISOString() }, "Shift clocked out.")
                          }
                          disabled={updatingShiftId === shift.shiftId || !shift.clockIn || Boolean(shift.clockOut)}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                        >
                          Clock Out
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : (
              <EmptyState message={isLoading ? "Loading shifts..." : "No shifts are scheduled for this range."} />
            )}
          </div>
        </div>
      </ReportSection>

      <ReportSection title="Team Scheduling and Attendance">
        {error ? (
          <ErrorState message={error} />
        ) : labor?.employees?.length ? (
          <SimpleTable
            headers={[
              "Employee",
              "Role",
              "Shifts Scheduled",
              "Shifts Clocked",
              "Hours This Week",
              "Clocked In Now",
              "Tips Declared",
            ]}
            rows={labor.employees}
            renderRow={(item) => (
              <tr key={item.userId} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.name}</td>
                <td className="py-3 pr-4">{item.role}</td>
                <td className="py-3 pr-4">{item.shiftsScheduled}</td>
                <td className="py-3 pr-4">{item.shiftsClocked}</td>
                <td className="py-3 pr-4">{item.hoursWorkedThisWeek ?? 0}</td>
                <td className="py-3 pr-4">{item.currentlyClockedIn ? "Yes" : "No"}</td>
                <td className="py-3 pr-4">${item.tipsDeclared.toFixed(2)}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading labor data..." : "No labor data is available."} />
        )}
      </ReportSection>

      <ReportSection title="Hours Worked This Week">
        {error ? (
          <ErrorState message={error} />
        ) : labor?.weeklyHours?.length ? (
          <SimpleTable
            headers={["Employee", "Role", "Hours This Week"]}
            rows={labor.weeklyHours}
            renderRow={(item) => (
              <tr key={item.userId} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{item.name}</td>
                <td className="py-3 pr-4">{item.role}</td>
                <td className="py-3 pr-4">{item.hoursWorkedThisWeek}</td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading weekly hours..." : "No employee hours are logged for this week."} />
        )}
      </ReportSection>
    </>
  );
}

const EMPTY_FORM = {
  name: "",
  category: "",
  basePrice: "",
  description: "",
  photoUrl: "",
  photoFile: null,
  photoPreviewUrl: "",
  photoFileName: "",
  commonAllergens: "",
};

export function MenuManagementSection() {
  const { data, isLoading, error } = useBackOfficeData("30days");
  const menu = data?.menu;

  const [items, setItems] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const categoryOptions = MENU_CATEGORIES;
  const filteredItems =
    selectedCategoryFilter === "All"
      ? items ?? []
      : (items ?? []).filter((item) => item.category === selectedCategoryFilter);

  useEffect(() => {
    async function load() {
      setItemsLoading(true);
      try {
        const rows = await fetchItems();
        setItems(rows.map((item) => ({ ...item, category: normalizeMenuCategory(item.category) })));
        setItemsError(null);
      } catch (err) {
        setItemsError(err.message);
      } finally {
        setItemsLoading(false);
      }
    }
    load();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditTarget(item);
    setForm({
      name: item.name,
      category: normalizeMenuCategory(item.category),
      basePrice: String(item.basePrice),
      description: item.description ?? "",
      photoUrl: item.photoUrl ?? "",
      photoFile: null,
      photoPreviewUrl: item.photoUrl ?? "",
      photoFileName: "",
      commonAllergens: item.commonAllergens ?? "",
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({
        ...current,
        photoFile: null,
        photoPreviewUrl: current.photoUrl,
        photoFileName: "",
      }));
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Photo must be a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Photo must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      photoFile: file,
      photoPreviewUrl: URL.createObjectURL(file),
      photoFileName: file.name,
    }));
    setFormError(null);
  }

  function handleRemovePhoto() {
    setForm((current) => ({
      ...current,
      photoUrl: "",
      photoFile: null,
      photoPreviewUrl: "",
      photoFileName: "",
    }));
    setFormError(null);
  }

  async function uploadPhotoIfNeeded() {
    if (!form.photoFile) {
      return form.photoUrl.trim();
    }

    const blob = await upload(`menu-items/${form.photoFile.name}`, form.photoFile, {
      access: "public",
      handleUploadUrl: "/api/menu-photo/upload",
    });

    return blob.url;
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.category.trim()) { setFormError("Category is required."); return; }
    const price = Number(form.basePrice);
    if (isNaN(price) || price < 0) { setFormError("Base price must be a valid non-negative number."); return; }

    setSaving(true);
    setFormError(null);
    try {
      const photoUrl = await uploadPhotoIfNeeded();
      const payload = {
        name: form.name.trim(),
        category: normalizeMenuCategory(form.category),
        basePrice: price,
        description: form.description.trim(),
        photoUrl,
        commonAllergens: form.commonAllergens.trim(),
      };
      if (editTarget) {
        const updated = await updateMenuItem(editTarget.menuItemId, payload);
        setItems((prev) => prev.map((it) => it.menuItemId === editTarget.menuItemId ? { ...it, ...updated, basePrice: Number(updated.basePrice) } : it));
        setActionMessage(`"${payload.name}" updated.`);
      } else {
        const created = await createMenuItem(payload);
        setItems((prev) => [...prev, { ...created, basePrice: Number(created.basePrice) }]);
        setActionMessage(`"${payload.name}" added.`);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item) {
    const next = !item.isActive;
    try {
      await toggleMenuItemActive(item.menuItemId, next);
      setItems((prev) => prev.map((it) => it.menuItemId === item.menuItemId ? { ...it, isActive: next } : it));
      setActionMessage(`"${item.name}" ${next ? "activated" : "deactivated"}.`);
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  }

  return (
    <>
      <ReportSection title="Menu Snapshot">
        <SummaryCards cards={menu?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      {actionMessage && (
        <p className="mb-4 rounded bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{actionMessage}</p>
      )}

      <ReportSection
        title="Menu Items"
        action={
          <button
            onClick={openAdd}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Item
          </button>
        }
      >
        {itemsError ? (
          <ErrorState message={itemsError} />
        ) : itemsLoading ? (
          <EmptyState message="Loading menu items..." />
        ) : items?.length ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter("All")}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                  selectedCategoryFilter === "All"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All ({items.length})
              </button>
              {categoryOptions.map((category) => {
                const count = items.filter((item) => item.category === category).length;
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setSelectedCategoryFilter(category)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                      selectedCategoryFilter === category
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>

            {filteredItems.length ? (
              <SimpleTable
                headers={["ID", "Photo", "Name", "Category", "Base Price", "Status", "Actions"]}
                rows={filteredItems}
                renderRow={(item) => (
                  <tr key={item.menuItemId} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-gray-800">{item.menuItemId}</td>
                    <td className="py-3 pr-4">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400">
                          No photo
                        </span>
                      )}
                    </td>
                    <td className="max-w-sm py-3 pr-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description ? <p className="mt-1 text-xs text-gray-500">{item.description}</p> : null}
                      {item.commonAllergens ? (
                        <p className="mt-1 text-xs font-semibold text-amber-700">Allergens: {item.commonAllergens}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">{normalizeMenuCategory(item.category)}</td>
                    <td className="py-3 pr-4">${Number(item.basePrice).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-2 flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(item)}
                        className={`rounded px-2 py-1 text-xs font-semibold ${item.isActive ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                )}
              />
            ) : (
              <EmptyState message={`No ${selectedCategoryFilter} items yet.`} />
            )}
          </>
        ) : (
          <EmptyState message="No menu items yet." />
        )}
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-lg font-bold text-gray-900">{editTarget ? "Edit Menu Item" : "Add Menu Item"}</h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grilled Salmon"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select category —</option>
                  {MENU_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Base Price *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.photoFileName ? (
                  <p className="mt-2 text-xs font-medium text-gray-500">Selected: {form.photoFileName}</p>
                ) : form.photoUrl ? (
                  <p className="mt-2 text-xs font-medium text-gray-500">Current photo saved.</p>
                ) : null}
                {(form.photoPreviewUrl || form.photoUrl || form.photoFile) ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Remove Photo
                  </button>
                ) : null}
                {form.photoPreviewUrl ? (
                  <img
                    src={form.photoPreviewUrl}
                    alt="Menu item preview"
                    className="mt-3 h-32 w-full rounded-lg object-cover"
                  />
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A short description customers can read on the menu."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Common Allergens</label>
                <input
                  type="text"
                  value={form.commonAllergens}
                  onChange={(e) => setForm({ ...form, commonAllergens: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Milk, Eggs, Wheat, Soy"
                />
              </div>
            </div>

            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Item"}
              </button>
              <button
                onClick={closeForm}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OrderHistorySection() {
  const [draftFilters, setDraftFilters] = useState(createDefaultDateRange);
  const [selectedRange, setSelectedRange] = useState(createDefaultDateRange);
  const [refreshToken, setRefreshToken] = useState(0);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [onlineActionId, setOnlineActionId] = useState(null);
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

  async function handleOnlineAction(orderId, action) {
    setOnlineActionId(`${action}-${orderId}`);
    setCancelError("");
    setCancelMessage("");

    try {
      if (action === "confirm") {
        await confirmOnlineOrder(orderId);
        setCancelMessage(`Online order #${orderId} was confirmed.`);
      } else if (action === "pay") {
        await markOnlineOrderPaid(orderId);
        setCancelMessage(`Online order #${orderId} was marked paid.`);
      } else if (action === "pickup") {
        await markOnlineOrderPickedUp(orderId);
        setCancelMessage(`Online order #${orderId} was marked picked up.`);
      }

      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setCancelError(actionError.message || "Failed to update online order.");
    } finally {
      setOnlineActionId(null);
    }
  }

  async function handleDeleteOnlineOrder(orderId) {
    const employee = getStoredEmployee();
    if (!employee?.userId || employee.role !== "manager") {
      setCancelError("Only a logged-in manager can cancel online orders.");
      return;
    }

    setOnlineActionId(`delete-${orderId}`);
    setCancelError("");
    setCancelMessage("");

    try {
      await deleteOnlineOrder(orderId);
      setCancelMessage(`Online order #${orderId} was canceled.`);
      setRefreshToken((value) => value + 1);
    } catch (actionError) {
      setCancelError(actionError.message || "Failed to cancel online order.");
    } finally {
      setOnlineActionId(null);
    }
  }

  return (
    <>
      <BackOfficeFilterBar filters={draftFilters} onChange={setDraftFilters} onApply={() => setSelectedRange(draftFilters)} />

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
                      key={`active-${item.channel}-${item.orderId}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="font-semibold text-gray-900">
                            {item.receiptNumber} · {item.channel === "Online" ? "Online Order" : `Table ${item.tableNumber}`}
                          </p>
                          <p>
                            {item.channel === "Online" ? "Customer" : "Server"}: {item.employeeName} · Status: {item.status} · Total: $
                            {item.total.toFixed(2)}
                          </p>
                          <p>Created: {item.createdAt}</p>
                        </div>
                        {item.channel === "Online" ? (
                          <div className="flex flex-wrap gap-2">
                            {item.customerStatus === "placed" ? (
                              <button
                                type="button"
                                onClick={() => handleOnlineAction(item.orderId, "confirm")}
                                disabled={onlineActionId === `confirm-${item.orderId}`}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                              >
                                Confirm
                              </button>
                            ) : null}
                            {item.paymentStatus !== "paid" ? (
                              <button
                                type="button"
                                onClick={() => handleOnlineAction(item.orderId, "pay")}
                                disabled={onlineActionId === `pay-${item.orderId}`}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                              >
                                Mark Paid
                              </button>
                            ) : null}
                            {item.customerStatus === "ready" && item.paymentStatus === "paid" ? (
                              <button
                                type="button"
                                onClick={() => handleOnlineAction(item.orderId, "pickup")}
                                disabled={onlineActionId === `pickup-${item.orderId}`}
                                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300"
                              >
                                Picked Up
                              </button>
                            ) : null}
                            {getStoredEmployee()?.role === "manager" ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteOnlineOrder(item.orderId)}
                                disabled={onlineActionId === `delete-${item.orderId}`}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                              >
                                {onlineActionId === `delete-${item.orderId}` ? "Canceling..." : "Cancel"}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleManagerCancel(item.orderId)}
                            disabled={cancelingOrderId === item.orderId}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                          >
                            {cancelingOrderId === item.orderId ? "Canceling..." : "Manager Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {orders?.recentOrders?.length ? (
              <SimpleTable
                headers={["Channel", "Order", "Receipt", "Table", "Employee", "Total", "Status", "Created"]}
                rows={orders.recentOrders}
                renderRow={(item) => (
                  <tr key={`${item.channel}-${item.orderId}`} className="border-b last:border-b-0">
                    <td className="py-3 pr-4">{item.channel}</td>
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

const EMPTY_REWARD_FORM = { name: "", pointsCost: "", menuItemId: "" };

function CustomerDetailPanel({ customer, onPointsAdjusted }) {
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [pointsDelta, setPointsDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjustError, setAdjustError] = useState(null);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    setOrdersLoading(true);
    fetchCustomerOrdersBackOffice(customer.customerId)
      .then((data) => setOrders(data.orders))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [customer.customerId]);

  async function handleAdjust(e) {
    e.preventDefault();
    const delta = Number(pointsDelta);
    if (!Number.isInteger(delta) || delta === 0) { setAdjustError("Enter a non-zero whole number."); return; }
    setAdjusting(true);
    setAdjustError(null);
    try {
      const result = await adjustLoyaltyPoints(customer.customerId, { pointsDelta: delta, reason });
      setPointsDelta("");
      setReason("");
      onPointsAdjusted(result.newBalance);
    } catch (err) {
      setAdjustError(err.message || "Failed to adjust points.");
    } finally {
      setAdjusting(false);
    }
  }

  const STATUS_COLOR = {
    placed: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    ready: "bg-purple-100 text-purple-700",
    picked_up: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-600",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Order History */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Order History</p>
        {ordersLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : orders?.length ? (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {orders.map((order) => (
              <div key={order.orderId} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500">Order #{order.orderId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                {order.items.map((item, i) => (
                  <p key={i} className="text-xs text-gray-600">{item.quantity}× {item.name}</p>
                ))}
                <p className="mt-1 text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No orders yet.</p>
        )}
      </div>

      {/* Adjust Points */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Adjust Points · Current: <span className="text-blue-600">{customer.pointsBalance} pts</span>
        </p>
        {adjustError && <p className="mb-2 text-sm text-red-600">{adjustError}</p>}
        <form onSubmit={handleAdjust} className="flex flex-col gap-2">
          <input
            type="number"
            step="1"
            value={pointsDelta}
            onChange={(e) => setPointsDelta(e.target.value)}
            placeholder="+50 or -25"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (service recovery, correction...)"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={adjusting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300"
          >
            {adjusting ? "Saving..." : "Adjust Points"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function CustomerLoyaltySection() {
  const [refreshToken, setRefreshToken] = useState(0);
  const { data, isLoading, error } = useBackOfficeData("30days", refreshToken);
  const customers = data?.customers;

  const [rewards, setRewards] = useState(null);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_REWARD_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = (customers?.customers ?? []).filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q)
    );
  });

  useEffect(() => {
    async function load() {
      setRewardsLoading(true);
      try {
        const [rows, items] = await Promise.all([fetchLoyaltyRewards(), fetchItems()]);
        setRewards(rows);
        setMenuItems(items);
        setRewardsError(null);
      } catch (err) {
        setRewardsError(err.message);
      } finally {
        setRewardsLoading(false);
      }
    }
    load();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_REWARD_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(reward) {
    setEditTarget(reward);
    setForm({
      name: reward.name,
      pointsCost: String(reward.points_cost),
      menuItemId: reward.menu_item_id ? String(reward.menu_item_id) : "",
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_REWARD_FORM);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    const pointsCost = Number(form.pointsCost);
    if (!Number.isInteger(pointsCost) || pointsCost < 1) { setFormError("Points cost must be a positive whole number."); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        pointsCost,
        menuItemId: form.menuItemId ? Number(form.menuItemId) : null,
      };

      if (editTarget) {
        await updateLoyaltyReward(editTarget.reward_id, payload);
        setRewards((prev) => prev.map((r) =>
          r.reward_id === editTarget.reward_id
            ? { ...r, name: payload.name, points_cost: payload.pointsCost, menu_item_id: payload.menuItemId,
                menu_item_name: menuItems.find((m) => m.menuItemId === payload.menuItemId)?.name ?? null }
            : r
        ));
        setActionMessage(`"${payload.name}" updated.`);
      } else {
        const created = await createLoyaltyReward(payload);
        setRewards((prev) => [...prev, {
          reward_id: created.rewardId,
          name: payload.name,
          points_cost: payload.pointsCost,
          menu_item_id: payload.menuItemId,
          menu_item_name: menuItems.find((m) => m.menuItemId === payload.menuItemId)?.name ?? null,
          is_active: true,
        }]);
        setActionMessage(`"${payload.name}" added.`);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(reward) {
    try {
      await toggleLoyaltyReward(reward.reward_id);
      setRewards((prev) => prev.map((r) =>
        r.reward_id === reward.reward_id ? { ...r, is_active: !r.is_active } : r
      ));
      setActionMessage(`"${reward.name}" ${reward.is_active ? "deactivated" : "activated"}.`);
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  }


  return (
    <>
      <ReportSection title="Customer Snapshot">
        <SummaryCards cards={customers?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Customer Records">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm md:w-80"
          />
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : filteredCustomers.length ? (
          <SimpleTable
            headers={["Name", "Email", "Phone", "Points", ""]}
            rows={filteredCustomers}
            renderRow={(item) => (
              <>
                <tr
                  key={item.customerId}
                  className="cursor-pointer border-b last:border-b-0 hover:bg-gray-50"
                  onClick={() => setSelectedCustomer(selectedCustomer?.customerId === item.customerId ? null : item)}
                >
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.firstName} {item.lastName}</td>
                  <td className="py-3 pr-4 text-gray-600">{item.email}</td>
                  <td className="py-3 pr-4 text-gray-600">{item.phoneNumber}</td>
                  <td className="py-3 pr-4 font-semibold text-blue-600">{item.pointsBalance} pts</td>
                  <td className="py-3 pr-2 text-xs text-gray-400">{selectedCustomer?.customerId === item.customerId ? "▲" : "▼"}</td>
                </tr>
                {selectedCustomer?.customerId === item.customerId && (
                  <tr key={`${item.customerId}-detail`}>
                    <td colSpan={5} className="bg-gray-50 px-4 pb-4 pt-2">
                      <CustomerDetailPanel
                        customer={item}
                        onPointsAdjusted={(newBalance) => {
                          setRefreshToken((v) => v + 1);
                          setActionMessage(`${item.firstName}'s balance updated to ${newBalance} pts.`);
                        }}
                      />
                    </td>
                  </tr>
                )}
              </>
            )}
          />
        ) : (
          <EmptyState message={isLoading ? "Loading customer records..." : "No customers found."} />
        )}
      </ReportSection>

      {actionMessage && (
        <p className="mb-4 rounded bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{actionMessage}</p>
      )}

      <ReportSection
        title="Loyalty Rewards Catalog"
        action={
          <button
            onClick={openAdd}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Reward
          </button>
        }
      >
        {rewardsError ? (
          <ErrorState message={rewardsError} />
        ) : rewardsLoading ? (
          <EmptyState message="Loading rewards..." />
        ) : rewards?.length ? (
          <SimpleTable
            headers={["ID", "Reward Name", "Points Cost", "Linked Item", "Status", "Actions"]}
            rows={rewards}
            renderRow={(reward) => (
              <tr key={reward.reward_id} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-gray-800">{reward.reward_id}</td>
                <td className="py-3 pr-4">{reward.name}</td>
                <td className="py-3 pr-4">{reward.points_cost} pts</td>
                <td className="py-3 pr-4 text-gray-500">{reward.menu_item_name ?? "—"}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${reward.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {reward.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="flex gap-2 py-3 pr-2">
                  <button
                    onClick={() => openEdit(reward)}
                    className="rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(reward)}
                    className={`rounded px-2 py-1 text-xs font-semibold ${reward.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                  >
                    {reward.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message="No rewards yet. Add one to get started." />
        )}
      </ReportSection>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-lg font-bold text-gray-900">{editTarget ? "Edit Reward" : "Add Reward"}</h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Reward Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Free Fries"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Points Cost *</label>
                <input
                  type="number"
                  min="1"
                  value={form.pointsCost}
                  onChange={(e) => setForm({ ...form, pointsCost: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Linked Menu Item (optional)</label>
                <select
                  value={form.menuItemId}
                  onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— None —</option>
                  {menuItems.map((item) => (
                    <option key={item.menuItemId} value={item.menuItemId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  onClick={closeForm}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Reward"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SettingsSection() {
  const { data, isLoading, error } = useBackOfficeData("7days");
  const settingsSummary = data?.settings;
  const [settingsData, setSettingsData] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [form, setForm] = useState({
    taxRate: "0.0825",
    receiptPrefix: "POS",
    requireManagerApprovalForVoids: true,
    requireManagerApprovalForRefunds: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setSettingsLoading(true);
        const payload = await fetchBackOfficeSettings();
        if (!isMounted) {
          return;
        }

        setSettingsData(payload);
        setForm({
          taxRate: String(payload.settings?.taxRate ?? 0),
          receiptPrefix: payload.settings?.receiptPrefix ?? "",
          requireManagerApprovalForVoids: Boolean(payload.settings?.requireManagerApprovalForVoids),
          requireManagerApprovalForRefunds: Boolean(payload.settings?.requireManagerApprovalForRefunds),
        });
        setSettingsError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setSettingsError(loadError.message || "Failed to load settings.");
      } finally {
        if (isMounted) {
          setSettingsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveSettings() {
    const taxRate = Number(form.taxRate);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
      setSaveMessage("Error: Tax rate must be a decimal between 0 and 1.");
      return;
    }

    if (!form.receiptPrefix.trim() || form.receiptPrefix.trim().length > 12) {
      setSaveMessage("Error: Receipt prefix is required and must be 12 characters or fewer.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage("");
      const payload = await updateBackOfficeSettings({
        taxRate,
        receiptPrefix: form.receiptPrefix.trim(),
        requireManagerApprovalForVoids: form.requireManagerApprovalForVoids,
        requireManagerApprovalForRefunds: form.requireManagerApprovalForRefunds,
      });

      setSettingsData(payload);
      setForm({
        taxRate: String(payload.settings?.taxRate ?? 0),
        receiptPrefix: payload.settings?.receiptPrefix ?? "",
        requireManagerApprovalForVoids: Boolean(payload.settings?.requireManagerApprovalForVoids),
        requireManagerApprovalForRefunds: Boolean(payload.settings?.requireManagerApprovalForRefunds),
      });
      setSaveMessage("Settings saved.");
      setSettingsError("");
    } catch (saveError) {
      setSaveMessage(`Error: ${saveError.message || "Failed to save settings."}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <ReportSection title="System Snapshot">
        <SummaryCards cards={settingsSummary?.summaryCards} isLoading={isLoading} error={error} />
      </ReportSection>

      <ReportSection title="Manager Controls">
        {saveMessage ? (
          <p
            className={`mb-4 rounded px-4 py-2 text-sm font-medium ${
              saveMessage.startsWith("Error:")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {saveMessage}
          </p>
        ) : null}

        {settingsError ? (
          <ErrorState message={settingsError} />
        ) : settingsLoading ? (
          <EmptyState message="Loading settings..." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Tax Rate</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.0001"
                    value={form.taxRate}
                    onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">Use decimal form, like `0.0825` for 8.25%.</p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Receipt Prefix</span>
                  <input
                    type="text"
                    maxLength="12"
                    value={form.receiptPrefix}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, receiptPrefix: event.target.value.toUpperCase() }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">Shown on receipt references and manager order views.</p>
                </label>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    key: "requireManagerApprovalForVoids",
                    label: "Require manager approval for voids",
                    description: "Keeps sent-item removals and order voids behind manager authorization.",
                  },
                  {
                    key: "requireManagerApprovalForRefunds",
                    label: "Require manager approval for refunds",
                    description: "Keeps refund decisions behind manager authorization.",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={form[item.key]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [item.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                      <span className="block text-sm text-gray-600">{item.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Persistence</h3>
                <p className="mt-2 text-sm text-gray-700">
                  {settingsData?.persistedCount ?? 0} setting values are currently stored in `Back_Office_Settings`.
                </p>
              </div>

              <div className="space-y-3">
                {(settingsData?.fields ?? []).map((field) => {
                  const metadata = settingsData?.metadata?.[field.key];
                  return (
                    <div key={field.key} className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                      <p className="mt-2 text-xs text-gray-600">
                        Last updated: {formatSettingsTimestamp(metadata?.updatedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {settingsSummary?.notes?.length ? (
                <div className="space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  {settingsSummary.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </ReportSection>
    </>
  );
}
