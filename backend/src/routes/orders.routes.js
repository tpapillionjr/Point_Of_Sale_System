import express from "express";
import { getActiveOrderByTable, postCancelOrder, postOrder, postAddItems } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", postOrder);
router.post("/cancel", postCancelOrder);
router.post("/:orderId/items", postAddItems);
router.get("/active-by-table/:tableNumber", getActiveOrderByTable);

export default router;
