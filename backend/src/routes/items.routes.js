import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getItems } from "../controllers/items.controller.js";

const router = express.Router();

router.get("/", requireAuth, getItems);

export default router;
