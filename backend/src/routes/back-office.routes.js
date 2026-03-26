import express from "express";
import { getDashboard, getData } from "../controllers/back-office.controller.js";

const router = express.Router();

router.get("/data", getData);
router.get("/dashboard", getDashboard);

export default router;
