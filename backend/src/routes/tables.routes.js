import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getTables, updateTableStatus } from "../controllers/tables.controller.js";

const router = express.Router();

router.get("/", requireAuth, getTables);
router.patch("/:tableId/status", requireAuth, updateTableStatus);

export default router;
