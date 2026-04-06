import express from "express";
import {
  requireAuth,
  requireKitchenOrManager,
} from "../../middleware/auth.middleware.js";
import { getKitchenTickets, patchKitchenTicket } from "../controllers/kitchen.controller.js";

const router = express.Router();

router.get("/tickets", requireAuth, getKitchenTickets);
router.patch(
  "/tickets/:ticketId",
  requireAuth,
  requireKitchenOrManager,
  patchKitchenTicket
);

export default router;
