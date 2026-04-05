import express from "express";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";
import { getActiveOrderByTable, postCancelOrder, postOrder, postAddItems } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", requireAuth, postOrder);
router.post("/cancel", requireAuth, requireManager, postCancelOrder);
router.post("/:orderId/items", requireAuth, postAddItems);
router.get("/active-by-table/:tableNumber", requireAuth, getActiveOrderByTable);

export default router;
