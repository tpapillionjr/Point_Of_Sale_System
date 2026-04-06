import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authShift, postClockIn, postClockOut } from "../controllers/shifts.controller.js";

const router = express.Router();

router.post("/auth", authShift);
router.post("/clock-in", requireAuth, postClockIn);
router.post("/clock-out", requireAuth, postClockOut);

export default router;
