export const salesData = [
  { date: "Mar 1", revenue: 1200, orders: 42, tips: 140 },
  { date: "Mar 2", revenue: 1450, orders: 50, tips: 160 },
  { date: "Mar 3", revenue: 1325, orders: 46, tips: 145 },
  { date: "Mar 4", revenue: 1680, orders: 58, tips: 190 },
  { date: "Mar 5", revenue: 1750, orders: 61, tips: 210 },
  { date: "Mar 6", revenue: 1910, orders: 66, tips: 230 },
  { date: "Mar 7", revenue: 2430, orders: 84, tips: 290 },
  { date: "Mar 8", revenue: 2210, orders: 79, tips: 250 },
  { date: "Mar 9", revenue: 1880, orders: 68, tips: 215 },
  { date: "Mar 10", revenue: 2055, orders: 73, tips: 220 },
  { date: "Mar 11", revenue: 2140, orders: 75, tips: 235 },
  { date: "Mar 12", revenue: 2265, orders: 80, tips: 245 },
  { date: "Mar 13", revenue: 2380, orders: 82, tips: 265 },
  { date: "Mar 14", revenue: 2525, orders: 88, tips: 295 },
  { date: "Mar 15", revenue: 2610, orders: 90, tips: 310 },
  { date: "Mar 16", revenue: 2490, orders: 86, tips: 285 },
  { date: "Mar 17", revenue: 2700, orders: 94, tips: 325 },
  { date: "Mar 18", revenue: 2550, orders: 89, tips: 300 },
  { date: "Mar 19", revenue: 2440, orders: 83, tips: 278 },
  { date: "Mar 20", revenue: 2635, orders: 91, tips: 315 },
  { date: "Mar 21", revenue: 2800, orders: 97, tips: 340 },
  { date: "Mar 22", revenue: 2745, orders: 95, tips: 330 },
  { date: "Mar 23", revenue: 2680, orders: 92, tips: 320 },
  { date: "Mar 24", revenue: 2595, orders: 88, tips: 302 },
  { date: "Mar 25", revenue: 2720, orders: 93, tips: 318 },
  { date: "Mar 26", revenue: 2815, orders: 96, tips: 336 },
  { date: "Mar 27", revenue: 2890, orders: 99, tips: 348 },
  { date: "Mar 28", revenue: 2950, orders: 101, tips: 355 },
  { date: "Mar 29", revenue: 3010, orders: 104, tips: 367 },
  { date: "Mar 30", revenue: 3125, orders: 108, tips: 380 },
];

export const topItems = [
  { name: "Hashbrowns", sold: 120, revenue: 540.0 },
  { name: "Waffle", sold: 95, revenue: 665.0 },
  { name: "Coffee", sold: 88, revenue: 220.0 },
  { name: "Bacon Plate", sold: 73, revenue: 730.0 },
  { name: "Texas Toast", sold: 60, revenue: 180.0 },
];

export const lowInventory = [
  { itemName: "Eggs", amountAvailable: 4, status: "Low" },
  { itemName: "Syrup", amountAvailable: 2, status: "Low" },
  { itemName: "Bacon", amountAvailable: 1, status: "Critical" },
];

export const laborData = [
  { name: "Alice", scheduled: 40, worked: 38, clockIns: 5, performance: "Strong" },
  { name: "Brian", scheduled: 35, worked: 36, clockIns: 5, performance: "Good" },
  { name: "Carla", scheduled: 30, worked: 28, clockIns: 4, performance: "Average" },
];

export const clockData = [
  { name: "Alice", lastClockIn: "7:00 AM", lastClockOut: "3:10 PM", status: "Clocked Out" },
  { name: "Brian", lastClockIn: "8:00 AM", lastClockOut: "4:02 PM", status: "Clocked Out" },
  { name: "Carla", lastClockIn: "6:55 AM", lastClockOut: "—", status: "Clocked In" },
];

export const operationalData = [
  { label: "Voids", value: 8 },
  { label: "Discounts", value: 14 },
  { label: "Refunds", value: 3 },
  { label: "Cash Payments", value: 42 },
  { label: "Card Payments", value: 96 },
];

export const voidData = [
  { order: "A102", reason: "Wrong item", employee: "Alice", amount: "$12.50" },
  { order: "A118", reason: "Customer canceled", employee: "Brian", amount: "$8.99" },
  { order: "A126", reason: "Duplicate ticket", employee: "Carla", amount: "$16.25" },
];

export const discountData = [
  { type: "Promo", count: 6, amount: "$42.00" },
  { type: "Manager Comp", count: 4, amount: "$58.00" },
  { type: "Employee Meal", count: 4, amount: "$29.00" },
];

export const refundData = [
  { order: "R201", reason: "Order error", amount: "$14.99", status: "Approved" },
  { order: "R214", reason: "Wrong charge", amount: "$9.50", status: "Approved" },
  { order: "R219", reason: "Customer complaint", amount: "$21.25", status: "Pending Review" },
];

export const paymentMethodData = [
  { method: "Cash", count: 42, amount: "$1,240.00" },
  { method: "Card", count: 96, amount: "$3,890.00" },
];

export const customerData = [
  { label: "Loyalty Signups", value: 22 },
  { label: "Repeat Customers", value: 48 },
  { label: "Most Common Order", value: "Waffle Combo" },
];

export const customerHabitData = [
  { label: "Most Common Order", value: "Waffle Combo" },
  { label: "Most Common Time", value: "8:00 AM - 10:00 AM" },
  { label: "Average Party Size", value: "2.6" },
];

export const loyaltyData = [
  { label: "New Loyalty Signups", value: 22 },
  { label: "Points Redeemed", value: 185 },
  { label: "Active Loyalty Members", value: 71 },
];

export const repeatCustomerData = [
  { name: "Customer #104", visits: 8, favorite: "Hashbrowns" },
  { name: "Customer #217", visits: 6, favorite: "Coffee" },
  { name: "Customer #318", visits: 5, favorite: "Waffle Combo" },
];

export function getFilteredSalesData(selectedRange) {
  if (selectedRange === "today") {
    return salesData.slice(-1);
  }

  if (selectedRange === "7days") {
    return salesData.slice(-7);
  }

  return salesData.slice(-30);
}

export function buildSummaryCards(data, prefix = "") {
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = data.reduce((sum, day) => sum + day.orders, 0);
  const totalTips = data.reduce((sum, day) => sum + day.tips, 0);
  const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return [
    { title: `${prefix}Revenue`, value: `$${totalRevenue.toFixed(2)}` },
    { title: `${prefix}Orders`, value: totalOrders.toString() },
    { title: `${prefix}Average Order`, value: `$${averageOrder.toFixed(2)}` },
    { title: `${prefix}Tips`, value: `$${totalTips.toFixed(2)}` },
  ];
}

export function getReportsView(selectedRange) {
  const filteredSalesData = getFilteredSalesData(selectedRange);
  const todayData = salesData.slice(-1);
  const weeklyData = salesData.slice(-7);
  const monthlyData = salesData.slice(-30);

  return {
    filteredSalesData,
    summaryData: buildSummaryCards(filteredSalesData),
    todaySummary: buildSummaryCards(todayData, "Today ").filter(
      (item) => item.title !== "Today Average Order"
    ),
    weeklySummary: buildSummaryCards(weeklyData, "Weekly ").filter(
      (item) => item.title !== "Weekly Average Order"
    ),
    monthlySummary: buildSummaryCards(monthlyData, "Monthly ").filter(
      (item) => item.title !== "Monthly Average Order"
    ),
    totalTips: filteredSalesData.reduce((sum, day) => sum + day.tips, 0),
    averageTips:
      filteredSalesData.length > 0
        ? filteredSalesData.reduce((sum, day) => sum + day.tips, 0) / filteredSalesData.length
        : 0,
  };
}
