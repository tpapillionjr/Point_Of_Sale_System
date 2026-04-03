import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { getActiveOrderByTable, postCancelOrder, postOrder } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", requireAuth, postOrder);
router.post("/cancel", requireAuth, requireManager, postCancelOrder);
router.get("/active-by-table/:tableNumber", requireAuth, getActiveOrderByTable);

export default router;
