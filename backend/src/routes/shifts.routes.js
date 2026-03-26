import express from "express";
import { authShift, postClockIn, postClockOut } from "../controllers/shifts.controller.js";

const router = express.Router();

router.post("/auth", authShift);
router.post("/clock-in", postClockIn);
router.post("/clock-out", postClockOut);

export default router;
