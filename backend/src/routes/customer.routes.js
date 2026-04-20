import express from "express";
import {
  getCustomerMenu,
  createCustomerOrder,
  getCustomerOrderStatus,
  getOnlineOrders,
  confirmOnlineOrder,
  cancelOnlineOrder,
  denyOnlineOrder,
  registerCustomer,
  loginCustomer,
  getOnlineOrderById,
  markOnlineOrderPaid,
  markOrderPickedUp,
  deleteOnlineOrder,
  getCustomerOrderHistory,
  createCustomerReservation,
  getCustomerReservations,
  deactivateCustomer,
  updateCustomerProfile,
} from "../controllers/customer.controller.js";
import { requireAuth, requireCustomerAuth, requireManager } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/menu", getCustomerMenu);
router.post("/orders", createCustomerOrder);
router.get("/orders/:orderId/status", requireCustomerAuth, getCustomerOrderStatus);
router.get("/online-orders", requireAuth, getOnlineOrders);
router.get("/online-orders/:orderId", requireAuth, getOnlineOrderById);
router.patch("/online-orders/:orderId/confirm", requireAuth, confirmOnlineOrder);
router.patch("/online-orders/:orderId/deny", requireAuth, denyOnlineOrder);
router.patch("/online-orders/:orderId/cancel", requireAuth, requireManager, cancelOnlineOrder);
router.patch("/online-orders/:orderId/pay", requireAuth, markOnlineOrderPaid);
router.patch("/online-orders/:orderId/pickup", requireAuth, markOrderPickedUp);
router.delete("/online-orders/:orderId", requireAuth, requireManager, deleteOnlineOrder);
router.get("/orders/history", requireCustomerAuth, getCustomerOrderHistory);
router.post("/reservations", requireCustomerAuth, createCustomerReservation);
router.get("/reservations", requireCustomerAuth, getCustomerReservations);
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.patch("/accounts/:customerId/deactivate", requireAuth, requireManager, deactivateCustomer);
router.patch("/profile", requireCustomerAuth, updateCustomerProfile);

export default router;
