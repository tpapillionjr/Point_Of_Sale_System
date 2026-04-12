import express from "express";
import {
  requireAuth,
  requireManager,
} from "../../middleware/auth.middleware.js";
import {
  getDashboard,
  getData,
  patchInventoryItemAmount,
  postInventoryItem,
  removeInventoryItem,
} from "../controllers/back-office.controller.js";

const router = express.Router();

router.get("/data", requireAuth, requireManager, getData);
router.get("/dashboard", requireAuth, requireManager, getDashboard);
router.post("/inventory", requireAuth, requireManager, postInventoryItem);
router.patch("/inventory/:type/:name", requireAuth, requireManager, patchInventoryItemAmount);
router.delete("/inventory/:type/:name", requireAuth, requireManager, removeInventoryItem);

export default router;
