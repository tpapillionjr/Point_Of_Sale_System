import express from "express";
import {
  requireAuth,
  requireKitchenOrManager,
} from "../../middleware/auth.middleware.js";
import {
  deleteKitchenTicket,
  getKitchenTickets,
  patchKitchenTicket,
} from "../controllers/kitchen.controller.js";

const router = express.Router();

router.get("/tickets", requireAuth, getKitchenTickets);
router.patch(
  "/tickets/:ticketId",
  requireAuth,
  requireKitchenOrManager,
  patchKitchenTicket
);
router.delete(
  "/tickets/:ticketId",
  requireAuth,
  requireKitchenOrManager,
  deleteKitchenTicket
);

export default router;
