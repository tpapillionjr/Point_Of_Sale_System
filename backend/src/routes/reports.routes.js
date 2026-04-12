import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { reportsRateLimit } from "../../middleware/rateLimit.middleware.js";
import { getDashboard, getOverview } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/dashboard", reportsRateLimit, requireAuth, requireManager, getDashboard);
router.get("/overview", reportsRateLimit, requireAuth, requireManager, getOverview);

export default router;
