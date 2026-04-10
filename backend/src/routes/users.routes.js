import express from "express";
import {
  getAllUsers,
  postCreateUser,
  putDeactivateUser,
  postVerifyManager,
  postLogin,
  postValidateCaptcha,
  getSecurityStatus,
} from "../controllers/users.controller.js";
import { loginRateLimit } from "../../middleware/rateLimit.middleware.js";
import { requireAuth, requireManager } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public endpoints (with rate limiting)
router.post("/login", loginRateLimit, postLogin);
router.post("/validate-captcha", loginRateLimit, postValidateCaptcha);

// Protected endpoints
router.get("/", requireAuth, getAllUsers);
router.post("/", requireAuth, requireManager, postCreateUser);
router.post("/verify-manager", postVerifyManager);
router.put("/:userId/deactivate", requireAuth, requireManager, putDeactivateUser);
router.get("/:userId/security-status", requireAuth, getSecurityStatus);

export default router;
