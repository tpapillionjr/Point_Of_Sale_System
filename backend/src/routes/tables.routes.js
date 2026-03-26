import express from "express";
import { getTables, updateTableStatus } from "../controllers/tables.controller.js";

const router = express.Router();

router.get("/", getTables);
router.patch("/:tableId/status", updateTableStatus);

export default router;
