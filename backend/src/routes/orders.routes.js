import express from "express";
import { getActiveOrderByTable, postCancelOrder, postOrder } from "../controllers/orders.controller.js";

const router = express.Router();

router.post("/", postOrder);
router.post("/cancel", postCancelOrder);
router.get("/active-by-table/:tableNumber", getActiveOrderByTable);

export default router;
