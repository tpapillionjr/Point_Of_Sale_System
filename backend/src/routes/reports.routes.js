import express from "express";
import { requireAuth, requireBackOfficeViewer } from "../../middleware/auth.middleware.js";
import { reportsRateLimit } from "../../middleware/rateLimit.middleware.js";
import { getDashboard, getOverview, getRevenue, getCustomerLoyalty, getItemReportHandler } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/dashboard", reportsRateLimit, requireAuth, requireBackOfficeViewer, getDashboard);
router.get("/overview", reportsRateLimit, requireAuth, requireBackOfficeViewer, getOverview);
router.get("/revenue", reportsRateLimit, requireAuth, requireBackOfficeViewer, getRevenue);
router.get("/customer-loyalty", reportsRateLimit, requireAuth, requireBackOfficeViewer, getCustomerLoyalty);
router.get("/item-report", reportsRateLimit, requireAuth, requireBackOfficeViewer, getItemReportHandler);

export default router;
