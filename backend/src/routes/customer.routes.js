import express from "express";
import { getCustomerMenu, createCustomerOrder, getCustomerOrderStatus } from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/menu", getCustomerMenu);
router.post("/orders", createCustomerOrder);
router.get("/orders/:orderId/status", getCustomerOrderStatus);

export default router;
