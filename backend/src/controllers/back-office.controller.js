import { getBackOfficeDashboard } from "../services/back-office.service.js";

async function getDashboard(req, res) {
  try {
    const dashboard = await getBackOfficeDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error("Failed to fetch back office dashboard:", error.message);
    res.status(500).json({ error: "Failed to fetch back office dashboard" });
  }
}

export { getDashboard };
