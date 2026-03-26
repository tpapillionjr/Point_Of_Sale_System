import express from "express";
import { getDashboard, getOverview } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/overview", getOverview);

export default router;
