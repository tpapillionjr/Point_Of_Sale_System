import express from "express";
import {
  requireAuth,
  requireManager,
} from "../../middleware/auth.middleware.js";
import {
  getDashboard,
  getData,
  getCustomerOrderHistory,
  getSettings,
  patchInventoryItemAmount,
  patchLaborShift,
  patchSettings,
  postReceivePurchasingStock,
  postInventoryItem,
  postLaborShift,
  removeInventoryItem,
} from "../controllers/back-office.controller.js";

const router = express.Router();

router.get("/data", requireAuth, requireManager, getData);
router.get("/dashboard", requireAuth, requireManager, getDashboard);
router.get("/settings", requireAuth, requireManager, getSettings);
router.patch("/settings", requireAuth, requireManager, patchSettings);
router.post("/inventory", requireAuth, requireManager, postInventoryItem);
router.patch("/inventory/:type/:name", requireAuth, requireManager, patchInventoryItemAmount);
router.delete("/inventory/:type/:name", requireAuth, requireManager, removeInventoryItem);
router.post("/labor/shifts", requireAuth, requireManager, postLaborShift);
router.patch("/labor/shifts/:shiftId", requireAuth, requireManager, patchLaborShift);
router.post("/purchasing/receive", requireAuth, requireManager, postReceivePurchasingStock);
router.get("/customers/:customerId/orders", requireAuth, requireManager, getCustomerOrderHistory);

export default router;
