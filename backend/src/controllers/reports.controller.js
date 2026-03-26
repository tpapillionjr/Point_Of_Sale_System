import { getReportsOverview } from "../services/reports.service.js";

async function getOverview(req, res) {
  try {
    const overview = await getReportsOverview(req.query.range);
    res.json(overview);
  } catch (error) {
    console.error("Failed to fetch reports overview:", error.message);
    res.status(500).json({ error: "Failed to fetch reports overview" });
  }
}

export { getOverview };
