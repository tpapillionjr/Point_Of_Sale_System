import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postCloseOrder } from "../controllers/payments.controller.js";

const router = express.Router();

router.post("/close-order", requireAuth, postCloseOrder);

export default router;
