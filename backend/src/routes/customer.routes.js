import express from "express";
import { getCustomerMenu, createCustomerOrder, getCustomerOrderStatus, getOnlineOrders, confirmOnlineOrder, registerCustomer, loginCustomer } from "../controllers/customer.controller.js";
import { requireAuth, requireCustomerAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/menu", getCustomerMenu);
router.post("/orders", createCustomerOrder);
router.get("/orders/:orderId/status", getCustomerOrderStatus);
router.get("/online-orders", requireAuth, getOnlineOrders);
router.patch("/online-orders/:orderId/confirm", requireAuth, confirmOnlineOrder);
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

export default router;
