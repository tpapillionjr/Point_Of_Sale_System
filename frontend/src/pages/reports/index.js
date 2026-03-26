import ReportsPageLayout from "../../components/reports/ReportsPageLayout";
import ReportCard from "../../components/reports/ReportCard";
import ReportSection from "../../components/reports/ReportSection";
import TopItemsTable from "../../components/reports/TopItemsTable";
import LowInventoryTable from "../../components/reports/LowInventoryTable";
import RevenueChart from "../../components/reports/RevenueChart";
import TopItemsChart from "../../components/reports/TopItemsChart";
import { useEffect, useState } from "react";
import { getReportsOverview } from "../../lib/api";

export default function ReportsHomePage() {
  return (
    <ReportsPageLayout
      title="Reports Dashboard"
      description="View restaurant performance, sales, labor, inventory, operations, and customer trends."
    >
      {(selectedRange) => <ReportsOverview selectedRange={selectedRange} />}
    </ReportsPageLayout>
  );
}

function ReportsOverview({ selectedRange }) {
  const [overview, setOverview] = useState({
    todaySummary: [],
    weeklySummary: [],
    monthlySummary: [],
    revenueTrend: [],
    topItems: [],
    lowInventory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        setIsLoading(true);
        const data = await getReportsOverview(selectedRange);
        if (!isMounted) {
          return;
        }

        setOverview(data);
        setError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "Failed to load reports overview.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  const fallbackCard = [{ title: "Loading", value: "..." }];

  if (error) {
    return (
      <ReportSection title="Reports Dashboard">
        <p className="text-sm text-red-600">{error}</p>
      </ReportSection>
    );
  }

  return (
    <>
      <ReportSection title="Today Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isLoading ? fallbackCard : overview.todaySummary).map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Weekly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isLoading ? fallbackCard : overview.weeklySummary).map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Monthly Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isLoading ? fallbackCard : overview.monthlySummary).map((card) => (
            <ReportCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Revenue Trend">
          <RevenueChart data={overview.revenueTrend} />
        </ReportSection>

        <ReportSection title="Top Selling Items">
          <TopItemsChart items={overview.topItems} />
        </ReportSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportSection title="Top Selling Items Table">
          <TopItemsTable items={overview.topItems} />
        </ReportSection>

        <ReportSection title="Low Inventory">
          <LowInventoryTable items={overview.lowInventory} />
        </ReportSection>
      </div>
    </>
  );
}
