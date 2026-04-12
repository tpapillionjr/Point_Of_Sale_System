import express from "express";
import { requireAuth, requireCustomerAuth, requireManager } from "../../middleware/auth.middleware.js";
import {
  adjustLoyaltyPoints,
  getRewards,
  getLoyaltyInfo,
  redeem,
  lookupCustomer,
  awardPoints,
  listAllRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  toggleLoyaltyReward,
} from "../controllers/loyalty.controller.js";

const router = express.Router();

// Customer-facing
router.get("/rewards", getRewards);
router.get("/balance", requireCustomerAuth, getLoyaltyInfo);
router.post("/redeem", requireCustomerAuth, redeem);

// POS staff
router.get("/lookup", requireAuth, lookupCustomer);
router.post("/staff-award", requireAuth, awardPoints);

// Back-office (manager only)
router.get("/manage/rewards", requireAuth, requireManager, listAllRewards);
router.post("/manage/rewards", requireAuth, requireManager, createLoyaltyReward);
router.put("/manage/rewards/:id", requireAuth, requireManager, updateLoyaltyReward);
router.patch("/manage/rewards/:id/toggle", requireAuth, requireManager, toggleLoyaltyReward);
router.post("/manage/customers/:customerId/points", requireAuth, requireManager, adjustLoyaltyPoints);

export default router;
