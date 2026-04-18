import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { reportsRateLimit } from "../../middleware/rateLimit.middleware.js";
import { getDashboard, getOverview, getRevenue, getCustomerLoyalty, getItemReportHandler } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/dashboard", reportsRateLimit, requireAuth, requireManager, getDashboard);
router.get("/overview", reportsRateLimit, requireAuth, requireManager, getOverview);
router.get("/revenue", reportsRateLimit, requireAuth, requireManager, getRevenue);
router.get("/customer-loyalty", reportsRateLimit, requireAuth, requireManager, getCustomerLoyalty);
router.get("/item-report", reportsRateLimit, requireAuth, requireManager, getItemReportHandler);

export default router;
