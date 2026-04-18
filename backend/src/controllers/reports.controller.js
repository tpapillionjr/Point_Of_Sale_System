import { getReportsDashboard, getReportsOverview, getRevenueReport, getCustomerLoyaltyReport, getItemReport } from "../services/reports.service.js";

async function getOverview(req, res) {
  try {
    const overview = await getReportsOverview(req.query);
    res.json(overview);
  } catch (error) {
    console.error("Failed to fetch reports overview:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.message || "Failed to fetch reports overview",
      details: error.details ?? [],
    });
  }
}

async function getDashboard(req, res) {
  try {
    const dashboard = await getReportsDashboard(req.query);
    res.json(dashboard);
  } catch (error) {
    console.error("Failed to fetch reports dashboard:", error.message);
    res.status(error.statusCode ?? 500).json({
      error: error.message || "Failed to fetch reports dashboard",
      details: error.details ?? [],
    });
  }
}

async function getRevenue(req, res) {
  try {
    const { revenueType, ...rangeQuery } = req.query;
    const data = await getRevenueReport(rangeQuery, revenueType || "all");
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch revenue report:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.message || "Failed to fetch revenue report" });
  }
}

async function getCustomerLoyalty(req, res) {
  try {
    const data = await getCustomerLoyaltyReport(req.query);
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch loyalty report:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.message || "Failed to fetch loyalty report" });
  }
}

async function getItemReportHandler(req, res) {
  try {
    const { category, ...rangeQuery } = req.query;
    const data = await getItemReport(rangeQuery, category || "all");
    res.json(data);
  } catch (error) {
    console.error("Failed to fetch item report:", error.message);
    res.status(error.statusCode ?? 500).json({ error: error.message || "Failed to fetch item report" });
  }
}

export { getDashboard, getOverview, getRevenue, getCustomerLoyalty, getItemReportHandler };
