import express from "express";
import {
  requireAuth,
  requireBackOfficeViewer,
  requireManager,
} from "../../middleware/auth.middleware.js";
import {
  getDashboard,
  getData,
  getCustomerOrderHistory,
  getReservationsHandler,
  confirmReservationHandler,
  cancelReservationHandler,
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

router.get("/data", requireAuth, requireBackOfficeViewer, getData);
router.get("/dashboard", requireAuth, requireBackOfficeViewer, getDashboard);
router.get("/settings", requireAuth, requireBackOfficeViewer, getSettings);
router.patch("/settings", requireAuth, requireManager, patchSettings);
router.post("/inventory", requireAuth, requireManager, postInventoryItem);
router.patch("/inventory/:type/:name", requireAuth, requireManager, patchInventoryItemAmount);
router.delete("/inventory/:type/:name", requireAuth, requireManager, removeInventoryItem);
router.post("/labor/shifts", requireAuth, requireManager, postLaborShift);
router.patch("/labor/shifts/:shiftId", requireAuth, requireManager, patchLaborShift);
router.post("/purchasing/receive", requireAuth, requireManager, postReceivePurchasingStock);
router.get("/customers/:customerId/orders", requireAuth, requireBackOfficeViewer, getCustomerOrderHistory);
router.get("/reservations", requireAuth, requireBackOfficeViewer, getReservationsHandler);
router.patch("/reservations/:reservationId/confirm", requireAuth, confirmReservationHandler);
router.patch("/reservations/:reservationId/cancel", requireAuth, cancelReservationHandler);

export default router;
