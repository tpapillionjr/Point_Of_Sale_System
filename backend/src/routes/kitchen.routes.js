import express from "express";
import { getKitchenTickets, patchKitchenTicket } from "../controllers/kitchen.controller.js";

const router = express.Router();

router.get("/tickets", getKitchenTickets);
router.patch("/tickets/:ticketId", patchKitchenTicket);

export default router;
