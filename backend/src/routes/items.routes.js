import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getItems, createItem, updateItem, toggleItemActive } from "../controllers/items.controller.js";

const router = express.Router();

router.get("/", requireAuth, getItems);
router.post("/", requireAuth, createItem);
router.put("/:id", requireAuth, updateItem);
router.patch("/:id/active", requireAuth, toggleItemActive);

export default router;
