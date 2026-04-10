import { getReportsDashboard, getReportsOverview } from "../services/reports.service.js";

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

export { getDashboard, getOverview };
