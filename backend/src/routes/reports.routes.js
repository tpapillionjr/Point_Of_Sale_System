import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { getDashboard, getOverview } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/dashboard", requireAuth, requireManager, getDashboard);
router.get("/overview", requireAuth, requireManager, getOverview);

export default router;
