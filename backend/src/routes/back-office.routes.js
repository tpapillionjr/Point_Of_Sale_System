import express from "express";
import { getDashboard } from "../controllers/back-office.controller.js";

const router = express.Router();

router.get("/dashboard", getDashboard);

export default router;
