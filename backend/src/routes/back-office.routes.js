import express from "express";
import {
  requireAuth,
  requireManager,
} from "../../middleware/auth.middleware.js";
import { getDashboard, getData } from "../controllers/back-office.controller.js";

const router = express.Router();

router.get("/data", requireAuth, requireManager, getData);
router.get("/dashboard", requireAuth, requireManager, getDashboard);

export default router;
