import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { validateRange } from "../../middleware/validate-range.middleware.js";
import { getDashboard, getOverview } from "../controllers/reports.controller.js";

const router = express.Router();


router.use(validateRange);

router.get("/dashboard", requireAuth, requireManager, getDashboard);
router.get("/overview", requireAuth, requireManager, getOverview);

export default router;
