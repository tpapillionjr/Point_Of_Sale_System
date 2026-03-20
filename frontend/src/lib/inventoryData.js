export const inventoryItems = [
  {
    inventoryItemName: "Eggs",
    amountAvailable: 72,
    menuItemId: 101,
    linkedMenuItem: "Classic Breakfast",
    category: "Breakfast",
    basePrice: 12.99,
    availabilityStatus: true,
    unit: "ct",
    parLevel: 120,
    reorderPoint: 80,
    supplier: "Farm Fresh Co.",
    leadTimeDays: 2,
    lastCountedAt: "2026-03-18 8:10 AM",
    countVariance: -6,
  },
  {
    inventoryItemName: "Applewood Bacon",
    amountAvailable: 18,
    menuItemId: 102,
    linkedMenuItem: "Bacon Plate",
    category: "Breakfast",
    basePrice: 14.5,
    availabilityStatus: true,
    unit: "lb",
    parLevel: 40,
    reorderPoint: 20,
    supplier: "Hill Country Meats",
    leadTimeDays: 3,
    lastCountedAt: "2026-03-18 8:24 AM",
    countVariance: -3,
  },
  {
    inventoryItemName: "Waffle Batter",
    amountAvailable: 14,
    menuItemId: 103,
    linkedMenuItem: "Golden Waffle",
    category: "Breakfast",
    basePrice: 9.75,
    availabilityStatus: true,
    unit: "qt",
    parLevel: 30,
    reorderPoint: 16,
    supplier: "Sunrise Mills",
    leadTimeDays: 2,
    lastCountedAt: "2026-03-18 8:31 AM",
    countVariance: 1,
  },
  {
    inventoryItemName: "Coffee Beans",
    amountAvailable: 9,
    menuItemId: 104,
    linkedMenuItem: "House Coffee",
    category: "Drinks",
    basePrice: 3.5,
    availabilityStatus: true,
    unit: "lb",
    parLevel: 18,
    reorderPoint: 10,
    supplier: "River Roast",
    leadTimeDays: 4,
    lastCountedAt: "2026-03-18 9:02 AM",
    countVariance: -1,
  },
  {
    inventoryItemName: "Hashbrown Potatoes",
    amountAvailable: 26,
    menuItemId: 105,
    linkedMenuItem: "Hashbrowns",
    category: "Sides",
    basePrice: 4.25,
    availabilityStatus: true,
    unit: "lb",
    parLevel: 50,
    reorderPoint: 24,
    supplier: "Produce Hub",
    leadTimeDays: 2,
    lastCountedAt: "2026-03-18 8:48 AM",
    countVariance: 4,
  },
  {
    inventoryItemName: "Texas Toast",
    amountAvailable: 6,
    menuItemId: 106,
    linkedMenuItem: "Texas Toast Combo",
    category: "Sides",
    basePrice: 5.95,
    availabilityStatus: false,
    unit: "loaf",
    parLevel: 14,
    reorderPoint: 8,
    supplier: "Baker Street Foods",
    leadTimeDays: 1,
    lastCountedAt: "2026-03-18 7:55 AM",
    countVariance: -2,
  },
  {
    inventoryItemName: "Maple Syrup",
    amountAvailable: 5,
    menuItemId: 107,
    linkedMenuItem: "Pancake Stack",
    category: "Breakfast",
    basePrice: 10.25,
    availabilityStatus: true,
    unit: "gal",
    parLevel: 12,
    reorderPoint: 6,
    supplier: "North Woods Pantry",
    leadTimeDays: 5,
    lastCountedAt: "2026-03-18 9:12 AM",
    countVariance: -1,
  },
  {
    inventoryItemName: "Butter",
    amountAvailable: 22,
    menuItemId: 108,
    linkedMenuItem: "Breakfast Sides",
    category: "Prep",
    basePrice: 2.75,
    availabilityStatus: true,
    unit: "lb",
    parLevel: 30,
    reorderPoint: 15,
    supplier: "Dairy Lane",
    leadTimeDays: 3,
    lastCountedAt: "2026-03-18 8:40 AM",
    countVariance: 2,
  },
];

export const rangeUsage = {
  today: [
    { inventoryItemName: "Eggs", used: 32, waste: 2, salesImpact: 18, depletionRisk: "Stable" },
    { inventoryItemName: "Applewood Bacon", used: 9, waste: 1, salesImpact: 14, depletionRisk: "Critical" },
    { inventoryItemName: "Waffle Batter", used: 7, waste: 0, salesImpact: 11, depletionRisk: "Low" },
    { inventoryItemName: "Coffee Beans", used: 3, waste: 0, salesImpact: 26, depletionRisk: "Low" },
    { inventoryItemName: "Hashbrown Potatoes", used: 8, waste: 1, salesImpact: 17, depletionRisk: "Stable" },
    { inventoryItemName: "Texas Toast", used: 4, waste: 0, salesImpact: 8, depletionRisk: "Critical" },
    { inventoryItemName: "Maple Syrup", used: 2, waste: 0, salesImpact: 10, depletionRisk: "Critical" },
  ],
  "7days": [
    { inventoryItemName: "Eggs", used: 186, waste: 9, salesImpact: 104, depletionRisk: "Stable" },
    { inventoryItemName: "Applewood Bacon", used: 61, waste: 6, salesImpact: 82, depletionRisk: "Critical" },
    { inventoryItemName: "Waffle Batter", used: 44, waste: 3, salesImpact: 59, depletionRisk: "Low" },
    { inventoryItemName: "Coffee Beans", used: 21, waste: 1, salesImpact: 188, depletionRisk: "Low" },
    { inventoryItemName: "Hashbrown Potatoes", used: 56, waste: 4, salesImpact: 92, depletionRisk: "Stable" },
    { inventoryItemName: "Texas Toast", used: 19, waste: 1, salesImpact: 37, depletionRisk: "Critical" },
    { inventoryItemName: "Maple Syrup", used: 11, waste: 1, salesImpact: 45, depletionRisk: "Critical" },
  ],
  "30days": [
    { inventoryItemName: "Eggs", used: 714, waste: 24, salesImpact: 396, depletionRisk: "Stable" },
    { inventoryItemName: "Applewood Bacon", used: 248, waste: 18, salesImpact: 331, depletionRisk: "Critical" },
    { inventoryItemName: "Waffle Batter", used: 177, waste: 11, salesImpact: 245, depletionRisk: "Low" },
    { inventoryItemName: "Coffee Beans", used: 84, waste: 5, salesImpact: 812, depletionRisk: "Low" },
    { inventoryItemName: "Hashbrown Potatoes", used: 228, waste: 13, salesImpact: 371, depletionRisk: "Stable" },
    { inventoryItemName: "Texas Toast", used: 72, waste: 5, salesImpact: 142, depletionRisk: "Critical" },
    { inventoryItemName: "Maple Syrup", used: 46, waste: 3, salesImpact: 191, depletionRisk: "Critical" },
  ],
};

export function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

export function getStockStatus(item) {
  if (!item.availabilityStatus || item.amountAvailable === 0) {
    return "Unavailable";
  }

  if (item.amountAvailable <= item.reorderPoint) {
    return item.amountAvailable <= Math.ceil(item.reorderPoint * 0.5) ? "Critical" : "Low";
  }

  return "Healthy";
}

export function getInventoryView(selectedRange = "7days") {
  const usageRows = rangeUsage[selectedRange] ?? rangeUsage["7days"];

  const stockRows = inventoryItems.map((item) => ({
    ...item,
    status: getStockStatus(item),
    parGap: item.parLevel - item.amountAvailable,
    fillRate: Math.min(100, Math.round((item.amountAvailable / item.parLevel) * 100)),
  }));

  const summaryCards = [
    { title: "Inventory SKUs", value: stockRows.length.toString() },
    {
      title: "On Hand Units",
      value: stockRows.reduce((sum, item) => sum + item.amountAvailable, 0).toString(),
    },
    {
      title: "Low Stock Alerts",
      value: stockRows
        .filter((item) => item.status === "Low" || item.status === "Critical")
        .length.toString(),
    },
    {
      title: "Unavailable Items",
      value: stockRows.filter((item) => item.status === "Unavailable").length.toString(),
    },
    {
      title: "Menu Links Active",
      value: `${stockRows.filter((item) => item.availabilityStatus).length}/${stockRows.length}`,
    },
  ];

  const totalUsed = usageRows.reduce((sum, item) => sum + item.used, 0);
  const totalWaste = usageRows.reduce((sum, item) => sum + item.waste, 0);
  const highestImpact = usageRows.reduce((top, item) =>
    item.salesImpact > top.salesImpact ? item : top
  );

  const usageSummary = [
    { title: "Units Used", value: totalUsed.toString() },
    { title: "Waste Logged", value: totalWaste.toString() },
    {
      title: "Waste Rate",
      value: `${totalUsed > 0 ? ((totalWaste / totalUsed) * 100).toFixed(1) : "0.0"}%`,
    },
    { title: "Top Sales Driver", value: highestImpact.inventoryItemName },
  ];

  const menuCoverageRows = stockRows.map((item) => ({
    menuItemId: item.menuItemId,
    menuItemName: item.linkedMenuItem,
    category: item.category,
    basePrice: item.basePrice,
    ingredient: item.inventoryItemName,
    availabilityStatus: item.availabilityStatus,
    stockStatus: item.status,
  }));

  const reorderRows = stockRows
    .filter((item) => item.parGap > 0)
    .map((item) => {
      const usage = usageRows.find((entry) => entry.inventoryItemName === item.inventoryItemName);
      const averageDailyUse =
        selectedRange === "today"
          ? usage?.used ?? 0
          : selectedRange === "7days"
            ? (usage?.used ?? 0) / 7
            : (usage?.used ?? 0) / 30;

      return {
        inventoryItemName: item.inventoryItemName,
        supplier: item.supplier,
        recommendedOrder: item.parGap,
        leadTimeDays: item.leadTimeDays,
        estimatedDaysLeft:
          averageDailyUse > 0 ? (item.amountAvailable / averageDailyUse).toFixed(1) : "N/A",
        priority: item.status,
        unit: item.unit,
      };
    })
    .sort((a, b) => {
      const rank = { Unavailable: 0, Critical: 1, Low: 2, Healthy: 3 };
      return rank[a.priority] - rank[b.priority];
    });

  return {
    usageRows,
    stockRows,
    summaryCards,
    usageSummary,
    menuCoverageRows,
    reorderRows,
    alertRows: stockRows.filter((item) => item.status !== "Healthy"),
  };
}
